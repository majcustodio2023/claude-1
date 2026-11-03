-- Prototype maker: each request is a job. The app saves the brief (and any pictures it pulled from the
-- client's socials); Claude in the project picks the job up, builds the site page by page and saves it here.
-- The finished pages are public by their unguessable slug so they can be shown to the client.

create table if not exists public.prototype_jobs (
  id text primary key,
  slug text unique not null,
  status text not null default 'queued', -- preparing | queued | building | ready | failed | removed
  model text not null default 'claude-opus-5-5',
  links jsonb not null default '[]'::jsonb,
  description text not null default '',
  scraped jsonb not null default '{}'::jsonb,
  brief text not null,
  business_name text,
  business_type text,
  summary text,
  progress jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  planned int -- pages in the builder's site plan, for the progress bar
);
alter table public.prototype_jobs enable row level security;

create table if not exists public.prototype_pages (
  job_id text not null references public.prototype_jobs(id) on delete cascade,
  path text not null,
  title text,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (job_id, path)
);
alter table public.prototype_pages enable row level security;

create table if not exists public.prototype_assets (
  job_id text not null references public.prototype_jobs(id) on delete cascade,
  name text not null,
  content_type text not null,
  data text not null, -- base64
  primary key (job_id, name)
);
alter table public.prototype_assets enable row level security;

create or replace function public.tracker_key_ok(p_key text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex'))
$$;
revoke all on function public.tracker_key_ok(text) from public, anon, authenticated;

-- ---------- the app (database key) ----------

-- New jobs start as 'preparing' while the app reads the links; prototype_set_brief queues them.
create or replace function public.prototype_create(p_key text, p_job jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  insert into prototype_jobs (id, slug, status, model, links, description, scraped, brief, progress)
  values (p_job->>'id', p_job->>'slug', 'preparing', coalesce(p_job->>'model', 'claude-opus-5-5'), coalesce(p_job->'links', '[]'::jsonb),
          coalesce(p_job->>'description', ''), coalesce(p_job->'scraped', '{}'::jsonb), p_job->>'brief',
          jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Reading the links and saving the pictures.')));
end $$;

create or replace function public.prototype_set_brief(p_key text, p_id text, p_brief text, p_scraped jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set brief = p_brief, scraped = p_scraped, status = 'queued',
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Brief ready. Waiting for the builder.'))
   where id = p_id and status = 'preparing';
end $$;

create or replace function public.prototype_add_asset(p_key text, p_job_id text, p_name text, p_type text, p_data text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  insert into prototype_assets (job_id, name, content_type, data) values (p_job_id, p_name, p_type, p_data)
  on conflict (job_id, name) do update set content_type = excluded.content_type, data = excluded.data;
end $$;

create or replace function public.prototype_list(p_key text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', j.id, 'slug', j.slug, 'status', j.status, 'model', j.model, 'links', j.links, 'description', j.description,
      'businessName', j.business_name, 'businessType', j.business_type, 'summary', j.summary, 'error', j.error,
      'createdAt', j.created_at, 'startedAt', j.started_at, 'finishedAt', j.finished_at,
      'progress', j.progress, 'planned', j.planned,
      'styles', exists (select 1 from prototype_pages p where p.job_id = j.id and p.path = 'site.css'),
      'pictures', (select count(*) from prototype_assets a where a.job_id = j.id),
      'pages', coalesce((select jsonb_agg(jsonb_build_object('path', p.path, 'title', p.title) order by p.path = 'index' desc, p.updated_at)
                         from prototype_pages p where p.job_id = j.id and p.path not like '%.css' and p.path not like '%.js'), '[]'::jsonb),
      'scraped', j.scraped
    ) order by j.created_at desc) from prototype_jobs j where j.status <> 'removed'), '[]'::jsonb);
end $$;

-- Hides a prototype (its link stops working). Nothing is deleted.
create or replace function public.prototype_remove(p_key text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set status = 'removed' where id = p_id;
end $$;

-- Puts a job back in the queue (a failed build, or one that got stuck).
create or replace function public.prototype_requeue(p_key text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set status = 'queued', error = null, started_at = null, finished_at = null,
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Sent back to the builder.'))
   where id = p_id;
end $$;

revoke all on function public.prototype_create(text, jsonb) from public;
revoke all on function public.prototype_add_asset(text, text, text, text, text) from public;
revoke all on function public.prototype_list(text) from public;
revoke all on function public.prototype_remove(text, text) from public;
revoke all on function public.prototype_requeue(text, text) from public;
grant execute on function public.prototype_create(text, jsonb) to anon;
grant execute on function public.prototype_set_brief(text, text, text, jsonb) to anon;
grant execute on function public.prototype_add_asset(text, text, text, text, text) to anon;
grant execute on function public.prototype_list(text) to anon;
grant execute on function public.prototype_remove(text, text) to anon;
grant execute on function public.prototype_requeue(text, text) to anon;

-- ---------- public: the finished site, by its slug ----------

create or replace function public.prototype_page(p_slug text, p_path text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('body', p.body, 'title', p.title, 'status', j.status, 'name', j.business_name, 'badge', j.scraped->>'badge')
  from prototype_jobs j join prototype_pages p on p.job_id = j.id
  where j.slug = p_slug and p.path = p_path and j.status <> 'removed'
$$;

create or replace function public.prototype_asset(p_slug text, p_name text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('type', a.content_type, 'data', a.data)
  from prototype_jobs j join prototype_assets a on a.job_id = j.id
  where j.slug = p_slug and a.name = p_name and j.status <> 'removed'
$$;

create or replace function public.prototype_status(p_slug text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('status', j.status, 'name', j.business_name,
    'pages', coalesce((select jsonb_agg(p.path) from prototype_pages p where p.job_id = j.id), '[]'::jsonb))
  from prototype_jobs j where j.slug = p_slug and j.status <> 'removed'
$$;

grant execute on function public.prototype_page(text, text) to anon;
grant execute on function public.prototype_asset(text, text) to anon;
grant execute on function public.prototype_status(text) to anon;

-- ---------- the builder (Claude in the project, through the database owner connection) ----------

-- Jobs waiting for a build, plus builds that stalled for 25 minutes.
create or replace function public.prototype_queue()
returns table(id text, slug text, model text, created_at timestamptz, brief text)
language sql security definer set search_path = public as $$
  select j.id, j.slug, j.model, j.created_at, j.brief from prototype_jobs j
  where j.status = 'queued' or (j.status = 'building' and j.started_at < now() - interval '25 minutes')
  order by j.created_at
$$;

-- Takes a job. Returns false when another builder already has it.
create or replace function public.prototype_claim(p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update prototype_jobs set status = 'building', started_at = now(), error = null,
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Builder picked it up.'))
   where id = p_id and (status = 'queued' or (status = 'building' and started_at < now() - interval '25 minutes'));
  return found;
end $$;

create or replace function public.prototype_progress(p_id text, p_text text) returns void
language sql security definer set search_path = public as $$
  update prototype_jobs set progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', left(p_text, 300)))
  where id = p_id
$$;

-- How many pages the site plan has, so the maker can show a real progress bar.
create or replace function public.prototype_plan(p_id text, p_pages int) returns void
language sql security definer set search_path = public as $$
  update prototype_jobs set planned = greatest(1, least(p_pages, 20)),
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Site plan ready: ' || p_pages || ' pages.'))
  where id = p_id
$$;

create or replace function public.prototype_save_page(p_id text, p_path text, p_title text, p_body text) returns int
language plpgsql security definer set search_path = public as $$
begin
  if p_path !~ '^[a-z0-9][a-z0-9-]*(\.(css|js))?$' then raise exception 'path must be like "index", "menu", "book" or "site.css"'; end if;
  insert into prototype_pages (job_id, path, title, body, updated_at) values (p_id, p_path, p_title, p_body, now())
  on conflict (job_id, path) do update set title = excluded.title, body = excluded.body, updated_at = now();
  return length(p_body);
end $$;

create or replace function public.prototype_finish(p_id text, p_name text, p_type text, p_summary text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from prototype_pages where job_id = p_id and path = 'index') then
    raise exception 'save the "index" page before finishing';
  end if;
  update prototype_jobs set status = 'ready', business_name = p_name, business_type = p_type, summary = p_summary, finished_at = now(),
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Prototype ready.'))
   where id = p_id;
end $$;

create or replace function public.prototype_fail(p_id text, p_error text) returns void
language sql security definer set search_path = public as $$
  update prototype_jobs set status = 'failed', error = left(p_error, 500), finished_at = now() where id = p_id
$$;

revoke all on function public.prototype_queue() from public, anon, authenticated;
revoke all on function public.prototype_claim(text) from public, anon, authenticated;
revoke all on function public.prototype_progress(text, text) from public, anon, authenticated;
revoke all on function public.prototype_plan(text, int) from public, anon, authenticated;
revoke all on function public.prototype_save_page(text, text, text, text) from public, anon, authenticated;
revoke all on function public.prototype_finish(text, text, text, text) from public, anon, authenticated;
revoke all on function public.prototype_fail(text, text) from public, anon, authenticated;
