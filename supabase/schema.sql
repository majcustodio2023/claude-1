-- Give the tracker its own Supabase project; don't share one with another app.
-- Agency Tracker storage: one JSON document, reachable only through these
-- functions with the secret key (TRACKER_DB_KEY). Row level security with no
-- policies keeps the table itself closed to the public API key.

create table if not exists public.tracker_state (
  id text primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.tracker_state enable row level security;

create table if not exists public.tracker_keys (
  key_hash text primary key
);
alter table public.tracker_keys enable row level security;

-- One snapshot per day, written by tracker_put, so a bad save or a lost
-- database row can be rolled back from Settings → Data.
create table if not exists public.tracker_backups (
  day date primary key,
  doc jsonb not null,
  saved_at timestamptz not null default now()
);
alter table public.tracker_backups enable row level security;

create or replace function public.tracker_get(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return (select doc from tracker_state where id = 'main');
end;
$$;

create or replace function public.tracker_put(p_key text, p_doc jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  insert into tracker_state (id, doc, updated_at) values ('main', p_doc, now())
  on conflict (id) do update set doc = excluded.doc, updated_at = now();
  insert into tracker_backups (day, doc, saved_at) values (current_date, p_doc, now())
  on conflict (day) do update set doc = excluded.doc, saved_at = now();
end;
$$;

create or replace function public.tracker_backup_list(p_key text)
returns table(day date, saved_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return query select b.day, b.saved_at from tracker_backups b order by b.day desc;
end;
$$;

create or replace function public.tracker_backup_get(p_key text, p_day date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return (select doc from tracker_backups where day = p_day);
end;
$$;

revoke all on function public.tracker_get(text) from public;
revoke all on function public.tracker_put(text, jsonb) from public;
grant execute on function public.tracker_get(text) to anon;
grant execute on function public.tracker_put(text, jsonb) to anon;
grant execute on function public.tracker_backup_list(text) to anon;
grant execute on function public.tracker_backup_get(text, date) to anon;

-- Then register the key once (run with your own value):
-- insert into tracker_keys values (encode(digest('<TRACKER_DB_KEY>', 'sha256'), 'hex'));
-- City meetings without an API key: the app saves a brief on each meeting waiting for an answer;
-- Claude in the project reads them here, answers as the staff and saves the replies back.
-- Only the database owner (the project's Supabase connection) can call these; not the public key.
create or replace function public.tracker_meeting_queue()
returns table(meeting_id text, title text, asked_at text, staff jsonb, system_prompt text, user_prompt text)
language sql
security definer
set search_path = public
as $$
  select m->>'id', m->>'title', m->'prompt'->>'askedAt',
         coalesce((select jsonb_agg(jsonb_build_object('id', s->>'id', 'name', s->>'name'))
                   from jsonb_array_elements(t.doc->'data'->'city'->'staff') s
                   where m->'staffIds' ? (s->>'id')), '[]'::jsonb),
         m->'prompt'->>'system', m->'prompt'->>'user'
  from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'meetings', '[]'::jsonb)) m
  where t.id = 'main' and m->>'status' = 'waiting' and m ? 'prompt'
$$;

create or replace function public.tracker_meeting_reply(p_id text, p_asked_at text, p_replies jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb;
  msgs jsonb := '[]'::jsonb;
  r jsonb;
  now_text text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  select x into m from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'meetings', '[]'::jsonb)) x
   where t.id = 'main' and x->>'id' = p_id;
  if m is null then raise exception 'no such meeting'; end if;
  for r in select * from jsonb_array_elements(p_replies) loop
    if m->'staffIds' ? (r->>'staffId') and coalesce(trim(r->>'text'), '') <> '' then
      msgs := msgs || jsonb_build_array(jsonb_build_object(
        'id', 'msg-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
        'from', r->>'staffId',
        'name', coalesce((select s->>'name' from tracker_state t2, jsonb_array_elements(t2.doc->'data'->'city'->'staff') s where t2.id = 'main' and s->>'id' = r->>'staffId'), 'Staff'),
        'text', left(trim(r->>'text'), 4000),
        'at', now_text));
    end if;
  end loop;
  if jsonb_array_length(msgs) = 0 then raise exception 'no valid replies (staffId must be one of the meeting''s staffIds)'; end if;
  update tracker_state t
     set doc = jsonb_set(t.doc, '{data,meetings}', (
       select jsonb_agg(case when e.x->>'id' = p_id then
                (case when e.x->'prompt'->>'askedAt' = p_asked_at
                      then (e.x - 'prompt') || jsonb_build_object('status', case when e.x->>'status' = 'ended' then 'ended' else 'open' end)
                      else e.x end)
                || jsonb_build_object('messages', coalesce(e.x->'messages', '[]'::jsonb) || msgs)
              else e.x end order by e.ord)
       from jsonb_array_elements(t.doc->'data'->'meetings') with ordinality as e(x, ord))),
         updated_at = now()
   where t.id = 'main';
  return jsonb_array_length(msgs);
end $$;

revoke all on function public.tracker_meeting_queue() from public, anon, authenticated;
revoke all on function public.tracker_meeting_reply(text, text, jsonb) from public, anon, authenticated;
