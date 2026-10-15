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
