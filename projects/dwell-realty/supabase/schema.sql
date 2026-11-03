-- Supabase project dwell-realty (zzhnkdvidtoirgmbbkmd) — schemas: dwell, public
-- Schema snapshot exported from the live Supabase project (DDL reconstructed from catalogs).
-- Re-create order: extensions, schemas, enums, tables, constraints, indexes, RLS, policies, views, functions, triggers.

-- ===== Extensions (4) =====
-- pg_stat_statements
create extension if not exists "pg_stat_statements" with schema extensions;

-- pgcrypto
create extension if not exists "pgcrypto" with schema extensions;

-- supabase_vault
create extension if not exists "supabase_vault" with schema vault;

-- uuid-ossp
create extension if not exists "uuid-ossp" with schema extensions;

-- ===== Schemas (1) =====
-- dwell
create schema if not exists dwell;

-- ===== Tables (12) =====
-- dwell.broadcasts
create table dwell.broadcasts (
  id uuid not null default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience text not null,
  recipients integer not null default 0,
  failed integer not null default 0,
  sent_by uuid,
  created_at timestamp with time zone not null default now()
);

-- dwell.chat_messages
create table dwell.chat_messages (
  id bigint not null,
  thread_id uuid not null,
  sender_id uuid,
  from_team boolean not null,
  body text not null,
  created_at timestamp with time zone not null default now()
);

-- dwell.chat_threads
create table dwell.chat_threads (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  last_message_at timestamp with time zone not null default now(),
  client_last_read timestamp with time zone not null default now(),
  team_last_read timestamp with time zone not null default '1970-01-01 00:00:00+00'::timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- dwell.email_optouts
create table dwell.email_optouts (
  email text not null,
  created_at timestamp with time zone not null default now()
);

-- dwell.favorites
create table dwell.favorites (
  user_id uuid not null,
  property_id uuid not null,
  created_at timestamp with time zone not null default now()
);

-- dwell.invite_codes
create table dwell.invite_codes (
  code text not null,
  role text not null default 'agent'::text,
  max_uses integer not null default 1,
  uses integer not null default 0,
  expires_at timestamp with time zone,
  note text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

-- dwell.message_replies
create table dwell.message_replies (
  id uuid not null default gen_random_uuid(),
  message_id uuid not null,
  author_id uuid,
  direction text not null default 'out'::text,
  body text not null,
  created_at timestamp with time zone not null default now()
);

-- dwell.messages
create table dwell.messages (
  id uuid not null default gen_random_uuid(),
  kind text not null default 'inquiry'::text,
  name text,
  email text,
  phone text,
  subject text,
  body text,
  body_html text,
  property_id uuid,
  service_id uuid,
  assigned_to uuid,
  preferred_date text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'new'::text,
  created_at timestamp with time zone not null default now()
);

-- dwell.properties
create table dwell.properties (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  listing_type text not null default 'sale'::text,
  property_type text not null default 'condo'::text,
  price numeric,
  price_period text,
  region text,
  province text,
  city text,
  address text,
  bedrooms integer,
  bathrooms integer,
  floor_area numeric,
  lot_area numeric,
  parking integer,
  year_built integer,
  furnishing text,
  title_status text,
  amenities text[] not null default '{}'::text[],
  images text[] not null default '{}'::text[],
  status text not null default 'active'::text,
  featured boolean not null default false,
  owner_id uuid,
  views integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- dwell.services
create table dwell.services (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  title text not null,
  category text not null default 'Advisory'::text,
  icon text not null default 'Briefcase'::text,
  summary text not null default ''::text,
  description text,
  includes text[] not null default '{}'::text[],
  ideal_for text[] not null default '{}'::text[],
  image text,
  sort_order integer not null default 100,
  active boolean not null default true,
  owner_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- dwell.sessions
create table dwell.sessions (
  token_hash text not null,
  user_id uuid not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now()
);

-- dwell.users
create table dwell.users (
  id uuid not null default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text not null default ''::text,
  phone text,
  title text,
  bio text,
  avatar_url text,
  role text not null default 'agent'::text,
  active boolean not null default true,
  invite_code text,
  created_at timestamp with time zone not null default now(),
  last_login_at timestamp with time zone
);

-- ===== Constraints (39) =====
-- dwell.broadcasts.broadcasts_pkey
alter table dwell.broadcasts add constraint broadcasts_pkey PRIMARY KEY (id);

-- dwell.broadcasts.broadcasts_sent_by_fkey
alter table dwell.broadcasts add constraint broadcasts_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.chat_messages.chat_messages_pkey
alter table dwell.chat_messages add constraint chat_messages_pkey PRIMARY KEY (id);

-- dwell.chat_messages.chat_messages_sender_id_fkey
alter table dwell.chat_messages add constraint chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.chat_messages.chat_messages_thread_id_fkey
alter table dwell.chat_messages add constraint chat_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES dwell.chat_threads(id) ON DELETE CASCADE;

-- dwell.chat_threads.chat_threads_client_id_fkey
alter table dwell.chat_threads add constraint chat_threads_client_id_fkey FOREIGN KEY (client_id) REFERENCES dwell.users(id) ON DELETE CASCADE;

-- dwell.chat_threads.chat_threads_client_id_key
alter table dwell.chat_threads add constraint chat_threads_client_id_key UNIQUE (client_id);

-- dwell.chat_threads.chat_threads_pkey
alter table dwell.chat_threads add constraint chat_threads_pkey PRIMARY KEY (id);

-- dwell.email_optouts.email_optouts_pkey
alter table dwell.email_optouts add constraint email_optouts_pkey PRIMARY KEY (email);

-- dwell.favorites.favorites_pkey
alter table dwell.favorites add constraint favorites_pkey PRIMARY KEY (user_id, property_id);

-- dwell.favorites.favorites_property_id_fkey
alter table dwell.favorites add constraint favorites_property_id_fkey FOREIGN KEY (property_id) REFERENCES dwell.properties(id) ON DELETE CASCADE;

-- dwell.favorites.favorites_user_id_fkey
alter table dwell.favorites add constraint favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES dwell.users(id) ON DELETE CASCADE;

-- dwell.invite_codes.invite_codes_created_by_fkey
alter table dwell.invite_codes add constraint invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.invite_codes.invite_codes_max_uses_check
alter table dwell.invite_codes add constraint invite_codes_max_uses_check CHECK ((max_uses > 0));

-- dwell.invite_codes.invite_codes_pkey
alter table dwell.invite_codes add constraint invite_codes_pkey PRIMARY KEY (code);

-- dwell.invite_codes.invite_codes_role_check
alter table dwell.invite_codes add constraint invite_codes_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'agent'::text])));

-- dwell.message_replies.message_replies_author_id_fkey
alter table dwell.message_replies add constraint message_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.message_replies.message_replies_direction_check
alter table dwell.message_replies add constraint message_replies_direction_check CHECK ((direction = ANY (ARRAY['out'::text, 'in'::text])));

-- dwell.message_replies.message_replies_message_id_fkey
alter table dwell.message_replies add constraint message_replies_message_id_fkey FOREIGN KEY (message_id) REFERENCES dwell.messages(id) ON DELETE CASCADE;

-- dwell.message_replies.message_replies_pkey
alter table dwell.message_replies add constraint message_replies_pkey PRIMARY KEY (id);

-- dwell.messages.messages_assigned_to_fkey
alter table dwell.messages add constraint messages_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.messages.messages_kind_check
alter table dwell.messages add constraint messages_kind_check CHECK ((kind = ANY (ARRAY['inquiry'::text, 'viewing'::text, 'service'::text, 'requirement'::text, 'contact'::text, 'email'::text])));

-- dwell.messages.messages_pkey
alter table dwell.messages add constraint messages_pkey PRIMARY KEY (id);

-- dwell.messages.messages_property_id_fkey
alter table dwell.messages add constraint messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES dwell.properties(id) ON DELETE SET NULL;

-- dwell.messages.messages_service_id_fkey
alter table dwell.messages add constraint messages_service_id_fkey FOREIGN KEY (service_id) REFERENCES dwell.services(id) ON DELETE SET NULL;

-- dwell.messages.messages_status_check
alter table dwell.messages add constraint messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'archived'::text])));

-- dwell.properties.properties_listing_type_check
alter table dwell.properties add constraint properties_listing_type_check CHECK ((listing_type = ANY (ARRAY['sale'::text, 'rent'::text, 'lease'::text])));

-- dwell.properties.properties_owner_id_fkey
alter table dwell.properties add constraint properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.properties.properties_pkey
alter table dwell.properties add constraint properties_pkey PRIMARY KEY (id);

-- dwell.properties.properties_slug_key
alter table dwell.properties add constraint properties_slug_key UNIQUE (slug);

-- dwell.properties.properties_status_check
alter table dwell.properties add constraint properties_status_check CHECK ((status = ANY (ARRAY['active'::text, 'reserved'::text, 'sold'::text, 'leased'::text, 'draft'::text])));

-- dwell.services.services_owner_id_fkey
alter table dwell.services add constraint services_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES dwell.users(id) ON DELETE SET NULL;

-- dwell.services.services_pkey
alter table dwell.services add constraint services_pkey PRIMARY KEY (id);

-- dwell.services.services_slug_key
alter table dwell.services add constraint services_slug_key UNIQUE (slug);

-- dwell.sessions.sessions_pkey
alter table dwell.sessions add constraint sessions_pkey PRIMARY KEY (token_hash);

-- dwell.sessions.sessions_user_id_fkey
alter table dwell.sessions add constraint sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES dwell.users(id) ON DELETE CASCADE;

-- dwell.users.users_email_key
alter table dwell.users add constraint users_email_key UNIQUE (email);

-- dwell.users.users_pkey
alter table dwell.users add constraint users_pkey PRIMARY KEY (id);

-- dwell.users.users_role_check
alter table dwell.users add constraint users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'agent'::text, 'client'::text])));

-- ===== Indexes (8) =====
-- dwell.chat_messages_thread_id_id_idx
CREATE INDEX chat_messages_thread_id_id_idx ON dwell.chat_messages USING btree (thread_id, id);

-- dwell.chat_threads_last_message_at_idx
CREATE INDEX chat_threads_last_message_at_idx ON dwell.chat_threads USING btree (last_message_at DESC);

-- dwell.message_replies_message_id_idx
CREATE INDEX message_replies_message_id_idx ON dwell.message_replies USING btree (message_id);

-- dwell.messages_assigned_to_idx
CREATE INDEX messages_assigned_to_idx ON dwell.messages USING btree (assigned_to);

-- dwell.messages_status_created_at_idx
CREATE INDEX messages_status_created_at_idx ON dwell.messages USING btree (status, created_at DESC);

-- dwell.properties_city_idx
CREATE INDEX properties_city_idx ON dwell.properties USING btree (city);

-- dwell.properties_status_listing_type_property_type_idx
CREATE INDEX properties_status_listing_type_property_type_idx ON dwell.properties USING btree (status, listing_type, property_type);

-- dwell.sessions_user_id_idx
CREATE INDEX sessions_user_id_idx ON dwell.sessions USING btree (user_id);

-- ===== Schema grants (1) =====
-- dwell
grant usage on schema dwell to anon, authenticated, service_role;

