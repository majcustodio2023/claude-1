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
end;
$$;

revoke all on function public.tracker_get(text) from public;
revoke all on function public.tracker_put(text, jsonb) from public;
grant execute on function public.tracker_get(text) to anon;
grant execute on function public.tracker_put(text, jsonb) to anon;

-- Then register the key once (run with your own value):
-- insert into tracker_keys values (encode(digest('<TRACKER_DB_KEY>', 'sha256'), 'hex'));
