-- Supabase project agency-tracker (wsiajfkjjbhpieuvjikz) — schemas: public, creatopia_private, dermatrend, insightcma, rasengan_private
-- Schema snapshot exported from the live Supabase project (DDL reconstructed from catalogs).
-- Re-create order: extensions, schemas, enums, tables, constraints, indexes, RLS, policies, views, functions, triggers.

-- ===== Extensions (6) =====
-- pg_cron
create extension if not exists "pg_cron" with schema pg_catalog;

-- pg_net
create extension if not exists "pg_net" with schema public;

-- pg_stat_statements
create extension if not exists "pg_stat_statements" with schema extensions;

-- pgcrypto
create extension if not exists "pgcrypto" with schema extensions;

-- supabase_vault
create extension if not exists "supabase_vault" with schema vault;

-- uuid-ossp
create extension if not exists "uuid-ossp" with schema extensions;

-- ===== Schemas (4) =====
-- creatopia_private
create schema if not exists creatopia_private;

-- dermatrend
create schema if not exists dermatrend;

-- insightcma
create schema if not exists insightcma;

-- rasengan_private
create schema if not exists rasengan_private;

-- ===== Enum types (1) =====
-- public.rasengan_contact_status
create type public.rasengan_contact_status as enum ('active', 'replied', 'completed', 'opted_out', 'paused', 'failed');

-- ===== Tables (52) =====
-- creatopia_private.admin_config
create table creatopia_private.admin_config (
  id integer not null default 1,
  admin_secret text not null,
  cron_secret text
);

-- dermatrend.activity
create table dermatrend.activity (
  id bigint not null,
  booking_id bigint,
  actor text,
  action text not null,
  detail jsonb,
  created_at timestamp with time zone not null default now()
);

-- dermatrend.bookings
create table dermatrend.bookings (
  id bigint not null,
  ref text not null,
  name text not null,
  phone text not null,
  email text,
  treatment_id text,
  treatment_name text not null,
  price numeric not null default 0,
  appt_date date,
  appt_time text,
  channel text,
  promo text,
  notes text,
  stage text not null default 'requested'::text,
  created_at timestamp with time zone not null default now(),
  confirmed_at timestamp with time zone,
  done_at timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  client_id bigint,
  source text not null default 'website'::text,
  reminder_sent_at timestamp with time zone,
  ack_sent_at timestamp with time zone,
  cancelled_reason text,
  deposit_amount numeric not null default 0,
  deposit_proof_url text,
  duration_min integer not null default 60
);

-- dermatrend.clients
create table dermatrend.clients (
  id bigint not null,
  name text not null,
  phone text,
  email text,
  birthday date,
  notes text,
  source text default 'website'::text,
  first_visit date,
  last_visit date,
  visits_imported integer not null default 0,
  spent_imported numeric not null default 0,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now()
);

-- dermatrend.onboarding
create table dermatrend.onboarding (
  id uuid not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  submitted_at timestamp with time zone
);

-- dermatrend.payments
create table dermatrend.payments (
  id bigint not null,
  booking_id bigint not null,
  amount numeric not null,
  method text not null,
  reference text,
  recorded_by text,
  verified boolean not null default false,
  verified_by text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  note text,
  kind text not null default 'payment'::text
);

-- dermatrend.receipts
create table dermatrend.receipts (
  id bigint not null,
  number bigint not null default nextval('dermatrend.receipt_no'::regclass),
  booking_id bigint not null,
  token text not null,
  sent_via text,
  sent_to text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- dermatrend.sessions
create table dermatrend.sessions (
  token text not null,
  staff_id bigint not null,
  expires_at timestamp with time zone not null
);

-- dermatrend.settings
create table dermatrend.settings (
  key text not null,
  value jsonb not null,
  updated_at timestamp with time zone not null default now()
);

-- dermatrend.sms_log
create table dermatrend.sms_log (
  id bigint not null,
  booking_id bigint,
  phone text not null,
  kind text not null,
  message text not null,
  status text not null,
  provider_ref text,
  error text,
  created_at timestamp with time zone not null default now()
);

-- dermatrend.staff
create table dermatrend.staff (
  id bigint not null,
  email text not null,
  name text not null,
  role text not null default 'staff'::text,
  pass_hash text not null,
  created_at timestamp with time zone not null default now()
);

-- insightcma.activity
create table insightcma.activity (
  id bigint not null default nextval('insightcma.activity_id_seq'::regclass),
  lead_id uuid,
  kind text not null,
  detail text,
  created_at timestamp with time zone default now()
);

-- insightcma.admins
create table insightcma.admins (
  id uuid not null default gen_random_uuid(),
  email text not null,
  name text,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

-- insightcma.batches
create table insightcma.batches (
  id uuid not null default gen_random_uuid(),
  filename text,
  total integer default 0,
  inserted integer default 0,
  skipped integer default 0,
  created_by text,
  created_at timestamp with time zone default now()
);

-- insightcma.email_log
create table insightcma.email_log (
  id bigint not null default nextval('insightcma.email_log_id_seq'::regclass),
  lead_id uuid,
  kind text not null,
  ok boolean not null,
  error text,
  created_at timestamp with time zone default now()
);

-- insightcma.leads
create table insightcma.leads (
  id uuid not null default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  school text,
  course text,
  current_status text,
  is_undergrad text,
  reason text,
  timeline text,
  budget text,
  source text not null default 'website'::text,
  stage text not null default 'new'::text,
  in_followup boolean not null default false,
  followup_step integer not null default 0,
  next_followup_at timestamp with time zone,
  followup_paused boolean not null default false,
  unsubscribed boolean not null default false,
  booking_at timestamp with time zone,
  notes text,
  batch_id uuid,
  value numeric,
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  sequence text not null default 'box'::text,
  appt_type text,
  appt_status text,
  reminder_24_sent boolean not null default false,
  reminder_1_sent boolean not null default false,
  appt_sent int4[] not null default '{}'::integer[],
  appt_last_daily date
);

-- insightcma.sequence_steps
create table insightcma.sequence_steps (
  step integer not null,
  delay_days integer not null,
  subject text not null,
  body text not null,
  enabled boolean not null default true,
  sequence text not null default 'box'::text
);

-- insightcma.settings
create table insightcma.settings (
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- public.creatopia_broadcasts
create table public.creatopia_broadcasts (
  id uuid not null default gen_random_uuid(),
  subject text not null,
  preview_text text,
  body text not null,
  resend_broadcast_id text,
  recipients integer not null default 0,
  status text not null default 'draft'::text,
  created_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone
);

-- public.creatopia_email_templates
create table public.creatopia_email_templates (
  event_id uuid not null,
  key text not null,
  subject text not null,
  body_md text not null,
  updated_at timestamp with time zone not null default now()
);

-- public.creatopia_events
create table public.creatopia_events (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  title text not null,
  tagline text,
  description text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  timezone text not null default 'Asia/Manila'::text,
  mode text not null default 'online'::text,
  youtube_url text,
  facebook_url text,
  maps_url text,
  venue_name text,
  venue_address text,
  language_note text,
  replay_url text,
  reminder_hour integer not null default 10,
  event_day_hours int4[] not null default '{10,13,15,16}'::integer[],
  reminders_enabled boolean not null default true,
  is_active boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- public.creatopia_inbox_messages
create table public.creatopia_inbox_messages (
  id text not null,
  direction text not null,
  thread_key text not null,
  from_address text not null,
  to_addresses text[] not null default '{}'::text[],
  subject text,
  text_body text,
  html_body text,
  message_id text,
  in_reply_to text,
  attachments jsonb not null default '[]'::jsonb,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- public.creatopia_registrations
create table public.creatopia_registrations (
  id uuid not null default gen_random_uuid(),
  event_id uuid not null,
  first_name text not null,
  email text not null,
  phone text not null default ''::text,
  source text,
  user_agent text,
  resend_contact_id text,
  unsubscribed boolean not null default false,
  unsubscribe_token text not null default encode(gen_random_bytes(16), 'hex'::text),
  created_at timestamp with time zone not null default now()
);

-- public.creatopia_reminder_log
create table public.creatopia_reminder_log (
  registration_id uuid not null,
  slot_key text not null,
  resend_id text,
  sent_at timestamp with time zone not null default now()
);

-- public.creatopia_speakers
create table public.creatopia_speakers (
  id uuid not null default gen_random_uuid(),
  event_id uuid not null,
  name text not null,
  role text,
  bio text,
  teaser text,
  is_hidden boolean not null default false,
  is_host boolean not null default false,
  instagram text,
  facebook text,
  youtube text,
  tiktok text,
  sort integer not null default 0,
  photo_mime text,
  photo_b64 text,
  created_at timestamp with time zone not null default now()
);

-- public.creatopia_waitlist
create table public.creatopia_waitlist (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default ''::text,
  source text,
  user_agent text,
  created_at timestamp with time zone not null default now(),
  resend_contact_id text,
  unsubscribed boolean not null default false,
  unsubscribe_token text not null default encode(gen_random_bytes(16), 'hex'::text)
);

-- public.creatopia_waitlist_reminder_log
create table public.creatopia_waitlist_reminder_log (
  waitlist_id uuid not null,
  event_id uuid not null,
  slot_key text not null,
  resend_id text,
  sent_at timestamp with time zone not null default now()
);

-- public.prototype_assets
create table public.prototype_assets (
  job_id text not null,
  name text not null,
  content_type text not null,
  data text not null
);

-- public.prototype_jobs
create table public.prototype_jobs (
  id text not null,
  slug text not null,
  status text not null default 'queued'::text,
  model text not null default 'claude-opus-5-5'::text,
  links jsonb not null default '[]'::jsonb,
  description text not null default ''::text,
  scraped jsonb not null default '{}'::jsonb,
  brief text not null,
  business_name text,
  business_type text,
  summary text,
  progress jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamp with time zone not null default now(),
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  planned integer
);

-- public.prototype_pages
create table public.prototype_pages (
  job_id text not null,
  path text not null,
  title text,
  body text not null,
  updated_at timestamp with time zone not null default now()
);

-- public.rasengan_activity
create table public.rasengan_activity (
  id bigint not null,
  user_id uuid not null,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_admins
create table public.rasengan_admins (
  user_id uuid not null,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_announcement_reads
create table public.rasengan_announcement_reads (
  announcement_id uuid not null,
  user_id uuid not null,
  read_at timestamp with time zone not null default now()
);

-- public.rasengan_announcements
create table public.rasengan_announcements (
  id uuid not null default gen_random_uuid(),
  title text not null,
  body text not null default ''::text,
  kind text not null default 'info'::text,
  style text not null default 'popup'::text,
  audience_user uuid,
  cta_label text,
  cta_url text,
  active boolean not null default true,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_audit_log
create table public.rasengan_audit_log (
  id bigint not null,
  actor uuid,
  action text not null,
  target text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_businesses
create table public.rasengan_businesses (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  website text,
  sender_name text not null,
  sender_title text,
  sender_email text,
  offer text not null,
  benefits text,
  audience text,
  call_to_action text,
  tone text not null default 'friendly'::text,
  language text not null default 'English'::text,
  timezone text not null default 'Asia/Manila'::text,
  steps integer not null default 5,
  interval_days integer not null default 3,
  use_email boolean not null default true,
  use_sms boolean not null default true,
  engine_paused boolean not null default false,
  sms_provider text,
  sms_api_key text,
  sms_username text,
  sms_from_number text,
  sms_daily_cap integer not null default 150,
  inbound_token text not null default encode(gen_random_bytes(18), 'hex'::text),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  brand_color text not null default '#2563eb'::text,
  logo_url text,
  email_style text not null default 'personal'::text,
  cta_label text,
  cta_url text,
  signature text,
  footer_text text,
  sms_verified_at timestamp with time zone,
  sms_last_inbound_at timestamp with time zone,
  email_mode text not null default 'shared'::text,
  from_name text,
  from_email text,
  domain_name text,
  resend_domain_id text,
  domain_status text,
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean not null default true,
  smtp_user text,
  smtp_pass_enc text,
  email_verified_at timestamp with time zone,
  google_email text,
  google_refresh_enc text,
  esp_provider text,
  esp_key_enc text,
  esp_domain text,
  esp_region text,
  reply_tracking boolean,
  availability text,
  meeting_minutes integer not null default 15,
  booking_url text,
  pain_points text,
  opener_angle text not null default 'capacity'::text,
  customer_word text,
  tour_done_at timestamp with time zone
);

-- public.rasengan_calls
create table public.rasengan_calls (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  contact_id uuid not null,
  outcome text not null,
  notes text,
  duration_s integer,
  next_call_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_changelog
create table public.rasengan_changelog (
  id uuid not null default gen_random_uuid(),
  version text,
  title text not null,
  body text not null default ''::text,
  kind text not null default 'feature'::text,
  published boolean not null default true,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_contacts
create table public.rasengan_contacts (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  name text,
  email text,
  phone text,
  company text,
  notes text,
  status public.rasengan_contact_status not null default 'active'::rasengan_contact_status,
  step integer not null default 0,
  next_run_at timestamp with time zone default now(),
  last_contacted_at timestamp with time zone,
  last_reply_at timestamp with time zone,
  unread_count integer not null default 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  stage_id uuid,
  next_call_at timestamp with time zone,
  call_attempts integer not null default 0,
  last_called_at timestamp with time zone
);

-- public.rasengan_messages
create table public.rasengan_messages (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  contact_id uuid not null,
  direction text not null,
  channel text not null,
  step integer,
  subject text,
  body text not null,
  status text not null default 'sent'::text,
  provider_id text,
  error text,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_pipeline_stages
create table public.rasengan_pipeline_stages (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  "position" integer not null default 0,
  color text not null default 'sky'::text,
  kind text not null default 'open'::text,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_profiles
create table public.rasengan_profiles (
  id uuid not null,
  username text not null,
  full_name text,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone
);

-- public.rasengan_support_messages
create table public.rasengan_support_messages (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  sender text not null,
  sender_id uuid,
  body text not null,
  announcement_id uuid,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_support_threads
create table public.rasengan_support_threads (
  user_id uuid not null,
  last_message_at timestamp with time zone not null default now(),
  last_preview text,
  last_sender text,
  admin_unread integer not null default 0,
  user_unread integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_suspensions
create table public.rasengan_suspensions (
  user_id uuid not null,
  reason text,
  created_at timestamp with time zone not null default now()
);

-- public.rasengan_templates
create table public.rasengan_templates (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  step integer not null,
  subject text not null default ''::text,
  body text not null default ''::text,
  sms text not null default ''::text,
  updated_at timestamp with time zone not null default now()
);

-- public.tracker_backups
create table public.tracker_backups (
  day date not null,
  doc jsonb not null,
  saved_at timestamp with time zone not null default now()
);

-- public.tracker_keys
create table public.tracker_keys (
  key_hash text not null
);

-- public.tracker_media
create table public.tracker_media (
  id text not null,
  folder text not null
);

-- public.tracker_state
create table public.tracker_state (
  id text not null,
  doc jsonb not null,
  updated_at timestamp with time zone not null default now()
);

-- rasengan_private.password_resets
create table rasengan_private.password_resets (
  token_hash text not null,
  user_id uuid not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- rasengan_private.rate_limits
create table rasengan_private.rate_limits (
  key text not null,
  window_start timestamp with time zone not null default now(),
  hits integer not null default 0
);

-- ===== Constraints (131) =====
-- creatopia_broadcasts.creatopia_broadcasts_pkey
alter table creatopia_broadcasts add constraint creatopia_broadcasts_pkey PRIMARY KEY (id);

-- creatopia_email_templates.creatopia_email_templates_event_id_fk
alter table creatopia_email_templates add constraint creatopia_email_templates_event_id_fkey FOREIGN KEY (event_id) REFERENCES creatopia_events(id) ON DELETE CASCADE;

-- creatopia_email_templates.creatopia_email_templates_pkey
alter table creatopia_email_templates add constraint creatopia_email_templates_pkey PRIMARY KEY (event_id, key);

-- creatopia_events.creatopia_events_mode_check
alter table creatopia_events add constraint creatopia_events_mode_check CHECK ((mode = ANY (ARRAY['online'::text, 'physical'::text, 'hybrid'::text])));

-- creatopia_events.creatopia_events_pkey
alter table creatopia_events add constraint creatopia_events_pkey PRIMARY KEY (id);

-- creatopia_events.creatopia_events_slug_key
alter table creatopia_events add constraint creatopia_events_slug_key UNIQUE (slug);

-- creatopia_inbox_messages.creatopia_inbox_messages_pkey
alter table creatopia_inbox_messages add constraint creatopia_inbox_messages_pkey PRIMARY KEY (id);

-- creatopia_private.admin_config.admin_config_pkey
alter table creatopia_private.admin_config add constraint admin_config_pkey PRIMARY KEY (id);

-- creatopia_registrations.creatopia_registrations_event_id_fkey
alter table creatopia_registrations add constraint creatopia_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES creatopia_events(id) ON DELETE CASCADE;

-- creatopia_registrations.creatopia_registrations_pkey
alter table creatopia_registrations add constraint creatopia_registrations_pkey PRIMARY KEY (id);

-- creatopia_registrations.creatopia_registrations_unsubscribe_tok
alter table creatopia_registrations add constraint creatopia_registrations_unsubscribe_token_key UNIQUE (unsubscribe_token);

-- creatopia_reminder_log.creatopia_reminder_log_pkey
alter table creatopia_reminder_log add constraint creatopia_reminder_log_pkey PRIMARY KEY (registration_id, slot_key);

-- creatopia_reminder_log.creatopia_reminder_log_registration_id_f
alter table creatopia_reminder_log add constraint creatopia_reminder_log_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES creatopia_registrations(id) ON DELETE CASCADE;

-- creatopia_speakers.creatopia_speakers_event_id_fkey
alter table creatopia_speakers add constraint creatopia_speakers_event_id_fkey FOREIGN KEY (event_id) REFERENCES creatopia_events(id) ON DELETE CASCADE;

-- creatopia_speakers.creatopia_speakers_pkey
alter table creatopia_speakers add constraint creatopia_speakers_pkey PRIMARY KEY (id);

-- creatopia_waitlist.creatopia_waitlist_pkey
alter table creatopia_waitlist add constraint creatopia_waitlist_pkey PRIMARY KEY (id);

-- creatopia_waitlist.creatopia_waitlist_unsubscribe_token_key
alter table creatopia_waitlist add constraint creatopia_waitlist_unsubscribe_token_key UNIQUE (unsubscribe_token);

-- creatopia_waitlist_reminder_log.creatopia_waitlist_reminder_log
alter table creatopia_waitlist_reminder_log add constraint creatopia_waitlist_reminder_log_waitlist_id_fkey FOREIGN KEY (waitlist_id) REFERENCES creatopia_waitlist(id) ON DELETE CASCADE;

-- creatopia_waitlist_reminder_log.creatopia_waitlist_reminder_log
alter table creatopia_waitlist_reminder_log add constraint creatopia_waitlist_reminder_log_pkey PRIMARY KEY (waitlist_id, event_id, slot_key);

-- dermatrend.activity.activity_booking_id_fkey
alter table dermatrend.activity add constraint activity_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES dermatrend.bookings(id) ON DELETE CASCADE;

-- dermatrend.activity.activity_pkey
alter table dermatrend.activity add constraint activity_pkey PRIMARY KEY (id);

-- dermatrend.bookings.bookings_client_id_fkey
alter table dermatrend.bookings add constraint bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES dermatrend.clients(id) ON DELETE SET NULL;

-- dermatrend.bookings.bookings_pkey
alter table dermatrend.bookings add constraint bookings_pkey PRIMARY KEY (id);

-- dermatrend.bookings.bookings_ref_key
alter table dermatrend.bookings add constraint bookings_ref_key UNIQUE (ref);

-- dermatrend.clients.clients_phone_key
alter table dermatrend.clients add constraint clients_phone_key UNIQUE (phone);

-- dermatrend.clients.clients_pkey
alter table dermatrend.clients add constraint clients_pkey PRIMARY KEY (id);

-- dermatrend.onboarding.onboarding_pkey
alter table dermatrend.onboarding add constraint onboarding_pkey PRIMARY KEY (id);

-- dermatrend.payments.payments_booking_id_fkey
alter table dermatrend.payments add constraint payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES dermatrend.bookings(id) ON DELETE CASCADE;

-- dermatrend.payments.payments_pkey
alter table dermatrend.payments add constraint payments_pkey PRIMARY KEY (id);

-- dermatrend.receipts.receipts_booking_id_fkey
alter table dermatrend.receipts add constraint receipts_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES dermatrend.bookings(id) ON DELETE CASCADE;

-- dermatrend.receipts.receipts_pkey
alter table dermatrend.receipts add constraint receipts_pkey PRIMARY KEY (id);

-- dermatrend.receipts.receipts_token_key
alter table dermatrend.receipts add constraint receipts_token_key UNIQUE (token);

-- dermatrend.sessions.sessions_pkey
alter table dermatrend.sessions add constraint sessions_pkey PRIMARY KEY (token);

-- dermatrend.sessions.sessions_staff_id_fkey
alter table dermatrend.sessions add constraint sessions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES dermatrend.staff(id) ON DELETE CASCADE;

-- dermatrend.settings.settings_pkey
alter table dermatrend.settings add constraint settings_pkey PRIMARY KEY (key);

-- dermatrend.sms_log.sms_log_booking_id_fkey
alter table dermatrend.sms_log add constraint sms_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES dermatrend.bookings(id) ON DELETE SET NULL;

-- dermatrend.sms_log.sms_log_pkey
alter table dermatrend.sms_log add constraint sms_log_pkey PRIMARY KEY (id);

-- dermatrend.staff.staff_email_key
alter table dermatrend.staff add constraint staff_email_key UNIQUE (email);

-- dermatrend.staff.staff_pkey
alter table dermatrend.staff add constraint staff_pkey PRIMARY KEY (id);

-- insightcma.activity.activity_lead_id_fkey
alter table insightcma.activity add constraint activity_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES insightcma.leads(id) ON DELETE CASCADE;

-- insightcma.activity.activity_pkey
alter table insightcma.activity add constraint activity_pkey PRIMARY KEY (id);

-- insightcma.admins.admins_email_key
alter table insightcma.admins add constraint admins_email_key UNIQUE (email);

-- insightcma.admins.admins_pkey
alter table insightcma.admins add constraint admins_pkey PRIMARY KEY (id);

-- insightcma.batches.batches_pkey
alter table insightcma.batches add constraint batches_pkey PRIMARY KEY (id);

-- insightcma.email_log.email_log_pkey
alter table insightcma.email_log add constraint email_log_pkey PRIMARY KEY (id);

-- insightcma.leads.leads_pkey
alter table insightcma.leads add constraint leads_pkey PRIMARY KEY (id);

-- insightcma.sequence_steps.sequence_steps_pkey
alter table insightcma.sequence_steps add constraint sequence_steps_pkey PRIMARY KEY (sequence, step);

-- insightcma.settings.settings_pkey
alter table insightcma.settings add constraint settings_pkey PRIMARY KEY (key);

-- prototype_assets.prototype_assets_job_id_fkey
alter table prototype_assets add constraint prototype_assets_job_id_fkey FOREIGN KEY (job_id) REFERENCES prototype_jobs(id) ON DELETE CASCADE;

-- prototype_assets.prototype_assets_pkey
alter table prototype_assets add constraint prototype_assets_pkey PRIMARY KEY (job_id, name);

-- prototype_jobs.prototype_jobs_pkey
alter table prototype_jobs add constraint prototype_jobs_pkey PRIMARY KEY (id);

-- prototype_jobs.prototype_jobs_slug_key
alter table prototype_jobs add constraint prototype_jobs_slug_key UNIQUE (slug);

-- prototype_pages.prototype_pages_job_id_fkey
alter table prototype_pages add constraint prototype_pages_job_id_fkey FOREIGN KEY (job_id) REFERENCES prototype_jobs(id) ON DELETE CASCADE;

-- prototype_pages.prototype_pages_pkey
alter table prototype_pages add constraint prototype_pages_pkey PRIMARY KEY (job_id, path);

-- rasengan_activity.rasengan_activity_event_check
alter table rasengan_activity add constraint rasengan_activity_event_check CHECK ((length(event) <= 60));

-- rasengan_activity.rasengan_activity_meta_check
alter table rasengan_activity add constraint rasengan_activity_meta_check CHECK ((pg_column_size(meta) <= 4000));

-- rasengan_activity.rasengan_activity_pkey
alter table rasengan_activity add constraint rasengan_activity_pkey PRIMARY KEY (id);

-- rasengan_activity.rasengan_activity_user_id_fkey
alter table rasengan_activity add constraint rasengan_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_admins.rasengan_admins_pkey
alter table rasengan_admins add constraint rasengan_admins_pkey PRIMARY KEY (user_id);

-- rasengan_admins.rasengan_admins_user_id_fkey
alter table rasengan_admins add constraint rasengan_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_announcement_reads.rasengan_announcement_reads_announc
alter table rasengan_announcement_reads add constraint rasengan_announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES rasengan_announcements(id) ON DELETE CASCADE;

-- rasengan_announcement_reads.rasengan_announcement_reads_pkey
alter table rasengan_announcement_reads add constraint rasengan_announcement_reads_pkey PRIMARY KEY (announcement_id, user_id);

-- rasengan_announcement_reads.rasengan_announcement_reads_user_id
alter table rasengan_announcement_reads add constraint rasengan_announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_announcements.rasengan_announcements_audience_user_fke
alter table rasengan_announcements add constraint rasengan_announcements_audience_user_fkey FOREIGN KEY (audience_user) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_announcements.rasengan_announcements_body_check
alter table rasengan_announcements add constraint rasengan_announcements_body_check CHECK ((length(body) <= 4000));

-- rasengan_announcements.rasengan_announcements_created_by_fkey
alter table rasengan_announcements add constraint rasengan_announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- rasengan_announcements.rasengan_announcements_kind_check
alter table rasengan_announcements add constraint rasengan_announcements_kind_check CHECK ((kind = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'update'::text])));

-- rasengan_announcements.rasengan_announcements_pkey
alter table rasengan_announcements add constraint rasengan_announcements_pkey PRIMARY KEY (id);

-- rasengan_announcements.rasengan_announcements_style_check
alter table rasengan_announcements add constraint rasengan_announcements_style_check CHECK ((style = ANY (ARRAY['popup'::text, 'banner'::text])));

-- rasengan_announcements.rasengan_announcements_title_check
alter table rasengan_announcements add constraint rasengan_announcements_title_check CHECK (((length(title) >= 1) AND (length(title) <= 140)));

-- rasengan_audit_log.rasengan_audit_log_actor_fkey
alter table rasengan_audit_log add constraint rasengan_audit_log_actor_fkey FOREIGN KEY (actor) REFERENCES auth.users(id) ON DELETE SET NULL;

-- rasengan_audit_log.rasengan_audit_log_pkey
alter table rasengan_audit_log add constraint rasengan_audit_log_pkey PRIMARY KEY (id);

-- rasengan_businesses.rasengan_businesses_brand_color_check
alter table rasengan_businesses add constraint rasengan_businesses_brand_color_check CHECK ((brand_color ~ '^#[0-9a-fA-F]{6}$'::text));

-- rasengan_businesses.rasengan_businesses_email_mode_check
alter table rasengan_businesses add constraint rasengan_businesses_email_mode_check CHECK ((email_mode = ANY (ARRAY['shared'::text, 'domain'::text, 'smtp'::text, 'gmail'::text, 'provider'::text])));

-- rasengan_businesses.rasengan_businesses_email_style_check
alter table rasengan_businesses add constraint rasengan_businesses_email_style_check CHECK ((email_style = ANY (ARRAY['branded'::text, 'personal'::text, 'minimal'::text])));

-- rasengan_businesses.rasengan_businesses_esp_provider_check
alter table rasengan_businesses add constraint rasengan_businesses_esp_provider_check CHECK ((esp_provider = ANY (ARRAY['resend'::text, 'sendgrid'::text, 'brevo'::text, 'mailgun'::text, 'postmark'::text])));

-- rasengan_businesses.rasengan_businesses_esp_region_check
alter table rasengan_businesses add constraint rasengan_businesses_esp_region_check CHECK ((esp_region = ANY (ARRAY['us'::text, 'eu'::text])));

-- rasengan_businesses.rasengan_businesses_inbound_token_key
alter table rasengan_businesses add constraint rasengan_businesses_inbound_token_key UNIQUE (inbound_token);

-- rasengan_businesses.rasengan_businesses_interval_days_check
alter table rasengan_businesses add constraint rasengan_businesses_interval_days_check CHECK (((interval_days >= 1) AND (interval_days <= 30)));

-- rasengan_businesses.rasengan_businesses_owner_id_fkey
alter table rasengan_businesses add constraint rasengan_businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_businesses.rasengan_businesses_owner_id_key
alter table rasengan_businesses add constraint rasengan_businesses_owner_id_key UNIQUE (owner_id);

-- rasengan_businesses.rasengan_businesses_pkey
alter table rasengan_businesses add constraint rasengan_businesses_pkey PRIMARY KEY (id);

-- rasengan_businesses.rasengan_businesses_sms_provider_check
alter table rasengan_businesses add constraint rasengan_businesses_sms_provider_check CHECK ((sms_provider = ANY (ARRAY['httpsms'::text, 'smsgate'::text, 'semaphore'::text, 'twilio'::text, 'clicksend'::text])));

-- rasengan_businesses.rasengan_businesses_steps_check
alter table rasengan_businesses add constraint rasengan_businesses_steps_check CHECK (((steps >= 1) AND (steps <= 12)));

-- rasengan_calls.rasengan_calls_contact_id_fkey
alter table rasengan_calls add constraint rasengan_calls_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES rasengan_contacts(id) ON DELETE CASCADE;

-- rasengan_calls.rasengan_calls_outcome_check
alter table rasengan_calls add constraint rasengan_calls_outcome_check CHECK ((outcome = ANY (ARRAY['no_answer'::text, 'voicemail'::text, 'busy'::text, 'callback'::text, 'not_interested'::text, 'interested'::text, 'booked'::text, 'wrong_number'::text])));

-- rasengan_calls.rasengan_calls_owner_id_fkey
alter table rasengan_calls add constraint rasengan_calls_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_calls.rasengan_calls_pkey
alter table rasengan_calls add constraint rasengan_calls_pkey PRIMARY KEY (id);

-- rasengan_changelog.rasengan_changelog_body_check
alter table rasengan_changelog add constraint rasengan_changelog_body_check CHECK ((length(body) <= 8000));

-- rasengan_changelog.rasengan_changelog_created_by_fkey
alter table rasengan_changelog add constraint rasengan_changelog_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- rasengan_changelog.rasengan_changelog_kind_check
alter table rasengan_changelog add constraint rasengan_changelog_kind_check CHECK ((kind = ANY (ARRAY['feature'::text, 'improvement'::text, 'fix'::text, 'security'::text])));

-- rasengan_changelog.rasengan_changelog_pkey
alter table rasengan_changelog add constraint rasengan_changelog_pkey PRIMARY KEY (id);

-- rasengan_changelog.rasengan_changelog_title_check
alter table rasengan_changelog add constraint rasengan_changelog_title_check CHECK (((length(title) >= 1) AND (length(title) <= 140)));

-- rasengan_contacts.rasengan_contacts_check
alter table rasengan_contacts add constraint rasengan_contacts_check CHECK (((email IS NOT NULL) OR (phone IS NOT NULL)));

-- rasengan_contacts.rasengan_contacts_owner_id_fkey
alter table rasengan_contacts add constraint rasengan_contacts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_contacts.rasengan_contacts_pkey
alter table rasengan_contacts add constraint rasengan_contacts_pkey PRIMARY KEY (id);

-- rasengan_contacts.rasengan_contacts_stage_id_fkey
alter table rasengan_contacts add constraint rasengan_contacts_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES rasengan_pipeline_stages(id) ON DELETE SET NULL;

-- rasengan_messages.rasengan_messages_channel_check
alter table rasengan_messages add constraint rasengan_messages_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text])));

-- rasengan_messages.rasengan_messages_contact_id_fkey
alter table rasengan_messages add constraint rasengan_messages_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES rasengan_contacts(id) ON DELETE CASCADE;

-- rasengan_messages.rasengan_messages_direction_check
alter table rasengan_messages add constraint rasengan_messages_direction_check CHECK ((direction = ANY (ARRAY['out'::text, 'in'::text])));

-- rasengan_messages.rasengan_messages_owner_id_fkey
alter table rasengan_messages add constraint rasengan_messages_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_messages.rasengan_messages_pkey
alter table rasengan_messages add constraint rasengan_messages_pkey PRIMARY KEY (id);

-- rasengan_pipeline_stages.rasengan_pipeline_stages_kind_check
alter table rasengan_pipeline_stages add constraint rasengan_pipeline_stages_kind_check CHECK ((kind = ANY (ARRAY['open'::text, 'won'::text, 'lost'::text])));

-- rasengan_pipeline_stages.rasengan_pipeline_stages_owner_id_fkey
alter table rasengan_pipeline_stages add constraint rasengan_pipeline_stages_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_pipeline_stages.rasengan_pipeline_stages_pkey
alter table rasengan_pipeline_stages add constraint rasengan_pipeline_stages_pkey PRIMARY KEY (id);

-- rasengan_private.password_resets.password_resets_pkey
alter table rasengan_private.password_resets add constraint password_resets_pkey PRIMARY KEY (token_hash);

-- rasengan_private.password_resets.password_resets_user_id_fkey
alter table rasengan_private.password_resets add constraint password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_private.rate_limits.rate_limits_pkey
alter table rasengan_private.rate_limits add constraint rate_limits_pkey PRIMARY KEY (key);

-- rasengan_profiles.rasengan_profiles_id_fkey
alter table rasengan_profiles add constraint rasengan_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_profiles.rasengan_profiles_pkey
alter table rasengan_profiles add constraint rasengan_profiles_pkey PRIMARY KEY (id);

-- rasengan_profiles.rasengan_profiles_username_check
alter table rasengan_profiles add constraint rasengan_profiles_username_check CHECK ((username ~ '^[a-z0-9_]{3,24}$'::text));

-- rasengan_profiles.rasengan_profiles_username_key
alter table rasengan_profiles add constraint rasengan_profiles_username_key UNIQUE (username);

-- rasengan_support_messages.rasengan_support_messages_announcemen
alter table rasengan_support_messages add constraint rasengan_support_messages_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES rasengan_announcements(id) ON DELETE SET NULL;

-- rasengan_support_messages.rasengan_support_messages_body_check
alter table rasengan_support_messages add constraint rasengan_support_messages_body_check CHECK (((length(TRIM(BOTH FROM body)) >= 1) AND (length(TRIM(BOTH FROM body)) <= 4000)));

-- rasengan_support_messages.rasengan_support_messages_pkey
alter table rasengan_support_messages add constraint rasengan_support_messages_pkey PRIMARY KEY (id);

-- rasengan_support_messages.rasengan_support_messages_sender_chec
alter table rasengan_support_messages add constraint rasengan_support_messages_sender_check CHECK ((sender = ANY (ARRAY['user'::text, 'admin'::text])));

-- rasengan_support_messages.rasengan_support_messages_sender_id_f
alter table rasengan_support_messages add constraint rasengan_support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- rasengan_support_messages.rasengan_support_messages_user_id_fke
alter table rasengan_support_messages add constraint rasengan_support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_support_threads.rasengan_support_threads_last_sender_c
alter table rasengan_support_threads add constraint rasengan_support_threads_last_sender_check CHECK ((last_sender = ANY (ARRAY['user'::text, 'admin'::text])));

-- rasengan_support_threads.rasengan_support_threads_pkey
alter table rasengan_support_threads add constraint rasengan_support_threads_pkey PRIMARY KEY (user_id);

-- rasengan_support_threads.rasengan_support_threads_user_id_fkey
alter table rasengan_support_threads add constraint rasengan_support_threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_suspensions.rasengan_suspensions_pkey
alter table rasengan_suspensions add constraint rasengan_suspensions_pkey PRIMARY KEY (user_id);

-- rasengan_suspensions.rasengan_suspensions_user_id_fkey
alter table rasengan_suspensions add constraint rasengan_suspensions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_templates.rasengan_templates_owner_id_fkey
alter table rasengan_templates add constraint rasengan_templates_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- rasengan_templates.rasengan_templates_owner_id_step_key
alter table rasengan_templates add constraint rasengan_templates_owner_id_step_key UNIQUE (owner_id, step);

-- rasengan_templates.rasengan_templates_pkey
alter table rasengan_templates add constraint rasengan_templates_pkey PRIMARY KEY (id);

-- rasengan_templates.rasengan_templates_step_check
alter table rasengan_templates add constraint rasengan_templates_step_check CHECK (((step >= 0) AND (step <= 11)));

-- tracker_backups.tracker_backups_pkey
alter table tracker_backups add constraint tracker_backups_pkey PRIMARY KEY (day);

-- tracker_keys.tracker_keys_pkey
alter table tracker_keys add constraint tracker_keys_pkey PRIMARY KEY (key_hash);

-- tracker_media.tracker_media_pkey
alter table tracker_media add constraint tracker_media_pkey PRIMARY KEY (id);

-- tracker_state.tracker_state_pkey
alter table tracker_state add constraint tracker_state_pkey PRIMARY KEY (id);

-- ===== Indexes (32) =====
-- dermatrend.activity_booking_id_idx
CREATE INDEX activity_booking_id_idx ON dermatrend.activity USING btree (booking_id);

-- dermatrend.bookings_appt_date_idx
CREATE INDEX bookings_appt_date_idx ON dermatrend.bookings USING btree (appt_date);

-- dermatrend.bookings_client_id_idx
CREATE INDEX bookings_client_id_idx ON dermatrend.bookings USING btree (client_id);

-- dermatrend.bookings_created_at_idx
CREATE INDEX bookings_created_at_idx ON dermatrend.bookings USING btree (created_at DESC);

-- dermatrend.bookings_stage_idx
CREATE INDEX bookings_stage_idx ON dermatrend.bookings USING btree (stage);

-- dermatrend.clients_lower_idx
CREATE INDEX clients_lower_idx ON dermatrend.clients USING btree (lower(name));

-- dermatrend.payments_booking_id_idx
CREATE INDEX payments_booking_id_idx ON dermatrend.payments USING btree (booking_id);

-- insightcma.activity_lead
CREATE INDEX activity_lead ON insightcma.activity USING btree (lead_id, created_at DESC);

-- insightcma.email_log_sent
CREATE INDEX email_log_sent ON insightcma.email_log USING btree (created_at) WHERE ok;

-- insightcma.leads_email_uniq
CREATE UNIQUE INDEX leads_email_uniq ON insightcma.leads USING btree (lower(email));

-- insightcma.leads_followup_due
CREATE INDEX leads_followup_due ON insightcma.leads USING btree (next_followup_at) WHERE (in_followup AND (NOT followup_paused) AND (NOT unsubscribed));

-- insightcma.leads_stage
CREATE INDEX leads_stage ON insightcma.leads USING btree (stage);

-- public.creatopia_inbox_messages_thread_key_created_at_idx
CREATE INDEX creatopia_inbox_messages_thread_key_created_at_idx ON public.creatopia_inbox_messages USING btree (thread_key, created_at);

-- public.creatopia_registrations_event_email
CREATE UNIQUE INDEX creatopia_registrations_event_email ON public.creatopia_registrations USING btree (event_id, lower(email));

-- public.creatopia_waitlist_email
CREATE UNIQUE INDEX creatopia_waitlist_email ON public.creatopia_waitlist USING btree (lower(email));

-- public.rasengan_activity_created_at_idx
CREATE INDEX rasengan_activity_created_at_idx ON public.rasengan_activity USING btree (created_at DESC);

-- public.rasengan_activity_user_id_created_at_idx
CREATE INDEX rasengan_activity_user_id_created_at_idx ON public.rasengan_activity USING btree (user_id, created_at DESC);

-- public.rasengan_announcements_active_starts_at_idx
CREATE INDEX rasengan_announcements_active_starts_at_idx ON public.rasengan_announcements USING btree (active, starts_at);

-- public.rasengan_audit_log_created_at_idx
CREATE INDEX rasengan_audit_log_created_at_idx ON public.rasengan_audit_log USING btree (created_at DESC);

-- public.rasengan_businesses_domain_name
CREATE UNIQUE INDEX rasengan_businesses_domain_name ON public.rasengan_businesses USING btree (lower(domain_name)) WHERE (domain_name IS NOT NULL);

-- public.rasengan_calls_contact
CREATE INDEX rasengan_calls_contact ON public.rasengan_calls USING btree (contact_id, created_at DESC);

-- public.rasengan_calls_owner_time
CREATE INDEX rasengan_calls_owner_time ON public.rasengan_calls USING btree (owner_id, created_at DESC);

-- public.rasengan_contacts_due
CREATE INDEX rasengan_contacts_due ON public.rasengan_contacts USING btree (next_run_at) WHERE (status = 'active'::rasengan_contact_status);

-- public.rasengan_contacts_owner_email
CREATE UNIQUE INDEX rasengan_contacts_owner_email ON public.rasengan_contacts USING btree (owner_id, email) WHERE (email IS NOT NULL);

-- public.rasengan_contacts_owner_next_call
CREATE INDEX rasengan_contacts_owner_next_call ON public.rasengan_contacts USING btree (owner_id, next_call_at);

-- public.rasengan_contacts_owner_phone
CREATE UNIQUE INDEX rasengan_contacts_owner_phone ON public.rasengan_contacts USING btree (owner_id, phone) WHERE (phone IS NOT NULL);

-- public.rasengan_messages_contact
CREATE INDEX rasengan_messages_contact ON public.rasengan_messages USING btree (contact_id, created_at);

-- public.rasengan_messages_owner_recent
CREATE INDEX rasengan_messages_owner_recent ON public.rasengan_messages USING btree (owner_id, created_at DESC);

-- public.rasengan_pipeline_stages_owner
CREATE INDEX rasengan_pipeline_stages_owner ON public.rasengan_pipeline_stages USING btree (owner_id, "position");

-- public.rasengan_support_messages_user_id_created_at_idx
CREATE INDEX rasengan_support_messages_user_id_created_at_idx ON public.rasengan_support_messages USING btree (user_id, created_at);

-- public.rasengan_support_threads_last_message_at_idx
CREATE INDEX rasengan_support_threads_last_message_at_idx ON public.rasengan_support_threads USING btree (last_message_at DESC);

-- rasengan_private.password_resets_user_id_created_at_idx
CREATE INDEX password_resets_user_id_created_at_idx ON rasengan_private.password_resets USING btree (user_id, created_at);

-- ===== Row level security (39) =====
-- insightcma.activity
alter table insightcma.activity enable row level security;

-- insightcma.admins
alter table insightcma.admins enable row level security;

-- insightcma.batches
alter table insightcma.batches enable row level security;

-- insightcma.email_log
alter table insightcma.email_log enable row level security;

-- insightcma.leads
alter table insightcma.leads enable row level security;

-- insightcma.sequence_steps
alter table insightcma.sequence_steps enable row level security;

-- insightcma.settings
alter table insightcma.settings enable row level security;

-- public.creatopia_broadcasts
alter table public.creatopia_broadcasts enable row level security;

-- public.creatopia_email_templates
alter table public.creatopia_email_templates enable row level security;

-- public.creatopia_events
alter table public.creatopia_events enable row level security;

-- public.creatopia_inbox_messages
alter table public.creatopia_inbox_messages enable row level security;

-- public.creatopia_registrations
alter table public.creatopia_registrations enable row level security;

-- public.creatopia_reminder_log
alter table public.creatopia_reminder_log enable row level security;

-- public.creatopia_speakers
alter table public.creatopia_speakers enable row level security;

-- public.creatopia_waitlist
alter table public.creatopia_waitlist enable row level security;

-- public.creatopia_waitlist_reminder_log
alter table public.creatopia_waitlist_reminder_log enable row level security;

-- public.prototype_assets
alter table public.prototype_assets enable row level security;

-- public.prototype_jobs
alter table public.prototype_jobs enable row level security;

-- public.prototype_pages
alter table public.prototype_pages enable row level security;

-- public.rasengan_activity
alter table public.rasengan_activity enable row level security;

-- public.rasengan_admins
alter table public.rasengan_admins enable row level security;

-- public.rasengan_announcement_reads
alter table public.rasengan_announcement_reads enable row level security;

-- public.rasengan_announcements
alter table public.rasengan_announcements enable row level security;

-- public.rasengan_audit_log
alter table public.rasengan_audit_log enable row level security;

-- public.rasengan_businesses
alter table public.rasengan_businesses enable row level security;

-- public.rasengan_calls
alter table public.rasengan_calls enable row level security;

-- public.rasengan_changelog
alter table public.rasengan_changelog enable row level security;

-- public.rasengan_contacts
alter table public.rasengan_contacts enable row level security;

-- public.rasengan_messages
alter table public.rasengan_messages enable row level security;

-- public.rasengan_pipeline_stages
alter table public.rasengan_pipeline_stages enable row level security;

-- public.rasengan_profiles
alter table public.rasengan_profiles enable row level security;

-- public.rasengan_support_messages
alter table public.rasengan_support_messages enable row level security;

-- public.rasengan_support_threads
alter table public.rasengan_support_threads enable row level security;

-- public.rasengan_suspensions
alter table public.rasengan_suspensions enable row level security;

-- public.rasengan_templates
alter table public.rasengan_templates enable row level security;

-- public.tracker_backups
alter table public.tracker_backups enable row level security;

-- public.tracker_keys
alter table public.tracker_keys enable row level security;

-- public.tracker_media
alter table public.tracker_media enable row level security;

-- public.tracker_state
alter table public.tracker_state enable row level security;

-- ===== Policies (32) =====
-- insightcma.activity.app_all
create policy "app_all" on insightcma.activity as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.admins.app_all
create policy "app_all" on insightcma.admins as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.batches.app_all
create policy "app_all" on insightcma.batches as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.email_log.app_all
create policy "app_all" on insightcma.email_log as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.leads.app_all
create policy "app_all" on insightcma.leads as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.sequence_steps.app_all
create policy "app_all" on insightcma.sequence_steps as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- insightcma.settings.app_all
create policy "app_all" on insightcma.settings as PERMISSIVE for ALL to insightcma_app using (true) with check (true);

-- public.rasengan_activity.rasengan admin activity
create policy "rasengan admin activity" on public.rasengan_activity as PERMISSIVE for SELECT to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_activity.rasengan log own activity
create policy "rasengan log own activity" on public.rasengan_activity as PERMISSIVE for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_announcement_reads.rasengan admin reads
create policy "rasengan admin reads" on public.rasengan_announcement_reads as PERMISSIVE for SELECT to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_announcement_reads.rasengan own reads
create policy "rasengan own reads" on public.rasengan_announcement_reads as PERMISSIVE for ALL to authenticated using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_announcements.rasengan admin announcements
create policy "rasengan admin announcements" on public.rasengan_announcements as PERMISSIVE for ALL to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin)) with check (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_announcements.rasengan read my announcements
create policy "rasengan read my announcements" on public.rasengan_announcements as PERMISSIVE for SELECT to authenticated using ((active AND (starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at > now())) AND ((audience_user IS NULL) OR (audience_user = ( SELECT auth.uid() AS uid)))));

-- public.rasengan_audit_log.rasengan admin audit read
create policy "rasengan admin audit read" on public.rasengan_audit_log as PERMISSIVE for SELECT to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_audit_log.rasengan admin audit write
create policy "rasengan admin audit write" on public.rasengan_audit_log as PERMISSIVE for INSERT to authenticated with check ((( SELECT rasengan_private.is_admin() AS is_admin) AND (actor = ( SELECT auth.uid() AS uid))));

-- public.rasengan_businesses.rasengan own business
create policy "rasengan own business" on public.rasengan_businesses as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_calls.rasengan own calls
create policy "rasengan own calls" on public.rasengan_calls as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_changelog.rasengan admin changelog
create policy "rasengan admin changelog" on public.rasengan_changelog as PERMISSIVE for ALL to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin)) with check (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_changelog.rasengan read changelog
create policy "rasengan read changelog" on public.rasengan_changelog as PERMISSIVE for SELECT to authenticated using (published);

-- public.rasengan_contacts.rasengan own contacts
create policy "rasengan own contacts" on public.rasengan_contacts as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_messages.rasengan own messages
create policy "rasengan own messages" on public.rasengan_messages as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check (((owner_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM rasengan_contacts c
  WHERE ((c.id = rasengan_messages.contact_id) AND (c.owner_id = ( SELECT auth.uid() AS uid)))))));

-- public.rasengan_pipeline_stages.rasengan own stages
create policy "rasengan own stages" on public.rasengan_pipeline_stages as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_profiles.rasengan own profile
create policy "rasengan own profile" on public.rasengan_profiles as PERMISSIVE for ALL to authenticated using ((id = ( SELECT auth.uid() AS uid))) with check ((id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_support_messages.rasengan admin delete support
create policy "rasengan admin delete support" on public.rasengan_support_messages as PERMISSIVE for DELETE to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_support_messages.rasengan admin read support
create policy "rasengan admin read support" on public.rasengan_support_messages as PERMISSIVE for SELECT to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_support_messages.rasengan admin write support
create policy "rasengan admin write support" on public.rasengan_support_messages as PERMISSIVE for INSERT to authenticated with check ((( SELECT rasengan_private.is_admin() AS is_admin) AND (sender = 'admin'::text) AND (sender_id = ( SELECT auth.uid() AS uid))));

-- public.rasengan_support_messages.rasengan read own support
create policy "rasengan read own support" on public.rasengan_support_messages as PERMISSIVE for SELECT to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_support_messages.rasengan write own support
create policy "rasengan write own support" on public.rasengan_support_messages as PERMISSIVE for INSERT to authenticated with check (((user_id = ( SELECT auth.uid() AS uid)) AND (sender = 'user'::text) AND (sender_id = ( SELECT auth.uid() AS uid))));

-- public.rasengan_support_threads.rasengan admin support threads
create policy "rasengan admin support threads" on public.rasengan_support_threads as PERMISSIVE for SELECT to authenticated using (( SELECT rasengan_private.is_admin() AS is_admin));

-- public.rasengan_support_threads.rasengan own support thread
create policy "rasengan own support thread" on public.rasengan_support_threads as PERMISSIVE for SELECT to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_suspensions.rasengan see own suspension
create policy "rasengan see own suspension" on public.rasengan_suspensions as PERMISSIVE for SELECT to authenticated using ((user_id = ( SELECT auth.uid() AS uid)));

-- public.rasengan_templates.rasengan own templates
create policy "rasengan own templates" on public.rasengan_templates as PERMISSIVE for ALL to authenticated using ((owner_id = ( SELECT auth.uid() AS uid))) with check ((owner_id = ( SELECT auth.uid() AS uid)));

-- ===== Functions (92) =====
-- creatopia_private.check_secret
CREATE OR REPLACE FUNCTION creatopia_private.check_secret(p_secret text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'creatopia_private', 'pg_temp'
AS $function$
begin
  if p_secret is null or not exists (select 1 from creatopia_private.admin_config where id = 1 and admin_secret = p_secret) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
end $function$
;

-- creatopia_private.tick_reminders
CREATE OR REPLACE FUNCTION creatopia_private.tick_reminders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'creatopia_private', 'extensions', 'pg_temp'
AS $function$
declare v_secret text;
begin
  select cron_secret into v_secret from creatopia_private.admin_config where id = 1;
  perform net.http_post(
    url := 'https://creatopialive.com/api/cron/reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb, timeout_milliseconds := 60000);
end $function$
;

-- public.creatopia_admin_activate_event
CREATE OR REPLACE FUNCTION public.creatopia_admin_activate_event(p_secret text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  update public.creatopia_events set is_active = (id = p_id), updated_at = now() where is_active or id = p_id;
end $function$
;

-- public.creatopia_admin_broadcast_recipients
CREATE OR REPLACE FUNCTION public.creatopia_admin_broadcast_recipients(p_secret text, p_audience text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_event uuid;
begin
  perform creatopia_private.check_secret(p_secret);
  select id into v_event from public.creatopia_events where is_active limit 1;
  return coalesce((
    select jsonb_agg(x) from (
      select distinct on (lower(email)) email, first_name, token from (
        select r.email, r.first_name, r.unsubscribe_token token, 1 pri from public.creatopia_registrations r
          where p_audience in ('registrants','everyone') and r.event_id = v_event and not r.unsubscribed
        union all
        select w.email, w.name, w.unsubscribe_token, 2 from public.creatopia_waitlist w
          where p_audience in ('waitlist','everyone') and not w.unsubscribed
            and not exists (select 1 from public.creatopia_registrations r2 where lower(r2.email) = lower(w.email) and r2.unsubscribed)
      ) u order by lower(email), pri
    ) x), '[]'::jsonb);
end $function$
;

-- public.creatopia_admin_broadcasts
CREATE OR REPLACE FUNCTION public.creatopia_admin_broadcasts(p_secret text)
 RETURNS SETOF creatopia_broadcasts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); return query select * from public.creatopia_broadcasts order by created_at desc; end $function$
;

-- public.creatopia_admin_clear_speaker_photo
CREATE OR REPLACE FUNCTION public.creatopia_admin_clear_speaker_photo(p_secret text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); update public.creatopia_speakers set photo_mime = null, photo_b64 = null where id = p_id; end $function$
;

-- public.creatopia_admin_delete_speaker
CREATE OR REPLACE FUNCTION public.creatopia_admin_delete_speaker(p_secret text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); delete from public.creatopia_speakers where id = p_id; end $function$
;

-- public.creatopia_admin_delete_template
CREATE OR REPLACE FUNCTION public.creatopia_admin_delete_template(p_secret text, p_event_id uuid, p_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); delete from public.creatopia_email_templates where event_id = p_event_id and key = p_key; end $function$
;

-- public.creatopia_admin_events
CREATE OR REPLACE FUNCTION public.creatopia_admin_events(p_secret text)
 RETURNS SETOF creatopia_events
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); return query select * from public.creatopia_events order by starts_at desc; end $function$
;

-- public.creatopia_admin_inbox_ids
CREATE OR REPLACE FUNCTION public.creatopia_admin_inbox_ids(p_secret text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); return coalesce((select array_agg(id) from public.creatopia_inbox_messages), '{}'); end $function$
;

-- public.creatopia_admin_inbox_mark_read
CREATE OR REPLACE FUNCTION public.creatopia_admin_inbox_mark_read(p_secret text, p_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); update public.creatopia_inbox_messages set read = true where thread_key = p_key; end $function$
;

-- public.creatopia_admin_inbox_thread
CREATE OR REPLACE FUNCTION public.creatopia_admin_inbox_thread(p_secret text, p_key text)
 RETURNS SETOF creatopia_inbox_messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); return query select * from public.creatopia_inbox_messages where thread_key = p_key order by created_at; end $function$
;

-- public.creatopia_admin_inbox_threads
CREATE OR REPLACE FUNCTION public.creatopia_admin_inbox_threads(p_secret text)
 RETURNS TABLE(thread_key text, subject text, counterpart text, last_at timestamp with time zone, message_count bigint, unread bigint, snippet text, last_direction text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return query
    select m.thread_key, last.subject,
      case when last.direction = 'inbound' then last.from_address else coalesce(last.to_addresses[1], last.from_address) end,
      max(m.created_at), count(*), count(*) filter (where not m.read and m.direction = 'inbound'),
      left(coalesce(last.text_body, ''), 160), last.direction
    from public.creatopia_inbox_messages m
    cross join lateral (select * from public.creatopia_inbox_messages x where x.thread_key = m.thread_key order by x.created_at desc limit 1) last
    group by m.thread_key, last.subject, last.direction, last.from_address, last.to_addresses, last.text_body
    order by max(m.created_at) desc;
end $function$
;

-- public.creatopia_admin_inbox_upsert
CREATE OR REPLACE FUNCTION public.creatopia_admin_inbox_upsert(p_secret text, p_msg jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  insert into public.creatopia_inbox_messages (id, direction, thread_key, from_address, to_addresses, subject, text_body, html_body, message_id, in_reply_to, attachments, read, created_at)
  values (p_msg->>'id', p_msg->>'direction', p_msg->>'thread_key', p_msg->>'from_address',
    coalesce(array(select jsonb_array_elements_text(p_msg->'to_addresses')), '{}'), p_msg->>'subject', p_msg->>'text_body', p_msg->>'html_body',
    p_msg->>'message_id', p_msg->>'in_reply_to', coalesce(p_msg->'attachments', '[]'), coalesce((p_msg->>'read')::boolean, false),
    coalesce((p_msg->>'created_at')::timestamptz, now()))
  on conflict (id) do nothing;
end $function$
;

-- public.creatopia_admin_leads
CREATE OR REPLACE FUNCTION public.creatopia_admin_leads(p_secret text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return coalesce((select jsonb_agg(to_jsonb(w) - 'unsubscribe_token' order by w.created_at desc) from public.creatopia_waitlist w), '[]'::jsonb);
end $function$
;

-- public.creatopia_admin_log_reminder
CREATE OR REPLACE FUNCTION public.creatopia_admin_log_reminder(p_secret text, p_registration_id uuid, p_slot_key text, p_resend_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  insert into public.creatopia_reminder_log (registration_id, slot_key, resend_id) values (p_registration_id, p_slot_key, p_resend_id) on conflict do nothing;
end $function$
;

-- public.creatopia_admin_log_reminders
CREATE OR REPLACE FUNCTION public.creatopia_admin_log_reminders(p_secret text, p_kind text, p_event_id uuid, p_slot_key text, p_rows jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  if p_kind = 'waitlist' then
    insert into public.creatopia_waitlist_reminder_log (waitlist_id, event_id, slot_key, resend_id)
    select (r->>'id')::uuid, p_event_id, p_slot_key, r->>'resend_id' from jsonb_array_elements(p_rows) r on conflict do nothing;
  else
    insert into public.creatopia_reminder_log (registration_id, slot_key, resend_id)
    select (r->>'id')::uuid, p_slot_key, r->>'resend_id' from jsonb_array_elements(p_rows) r on conflict do nothing;
  end if;
end $function$
;

-- public.creatopia_admin_log_waitlist_reminder
CREATE OR REPLACE FUNCTION public.creatopia_admin_log_waitlist_reminder(p_secret text, p_waitlist_id uuid, p_event_id uuid, p_slot_key text, p_resend_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  insert into public.creatopia_waitlist_reminder_log (waitlist_id, event_id, slot_key, resend_id) values (p_waitlist_id, p_event_id, p_slot_key, p_resend_id) on conflict do nothing;
end $function$
;

-- public.creatopia_admin_registrations
CREATE OR REPLACE FUNCTION public.creatopia_admin_registrations(p_secret text, p_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.creatopia_registrations r where r.event_id = p_event_id), '[]'::jsonb);
end $function$
;

-- public.creatopia_admin_reminder_stats
CREATE OR REPLACE FUNCTION public.creatopia_admin_reminder_stats(p_secret text, p_event_id uuid)
 RETURNS TABLE(slot_key text, sent bigint, last_sent timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return query select l.slot_key, count(*), max(l.sent_at) from public.creatopia_reminder_log l
    join public.creatopia_registrations r on r.id = l.registration_id where r.event_id = p_event_id group by l.slot_key order by max(l.sent_at);
end $function$
;

-- public.creatopia_admin_reminder_targets
CREATE OR REPLACE FUNCTION public.creatopia_admin_reminder_targets(p_secret text, p_event_id uuid, p_slot_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.creatopia_registrations r
    where r.event_id = p_event_id and not r.unsubscribed
      and not exists (select 1 from public.creatopia_reminder_log l where l.registration_id = r.id and l.slot_key = p_slot_key)), '[]'::jsonb);
end $function$
;

-- public.creatopia_admin_save_broadcast
CREATE OR REPLACE FUNCTION public.creatopia_admin_save_broadcast(p_secret text, p_id uuid, p_subject text, p_preview text, p_body text, p_resend_id text, p_recipients integer, p_status text, p_sent_at timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid := p_id;
begin
  perform creatopia_private.check_secret(p_secret);
  if v_id is not null and exists (select 1 from public.creatopia_broadcasts where id = v_id) then
    update public.creatopia_broadcasts set subject = p_subject, preview_text = p_preview, body = p_body, resend_broadcast_id = p_resend_id,
      recipients = p_recipients, status = p_status, sent_at = p_sent_at where id = v_id;
  else
    insert into public.creatopia_broadcasts (subject, preview_text, body, resend_broadcast_id, recipients, status, sent_at)
    values (p_subject, p_preview, p_body, p_resend_id, p_recipients, p_status, p_sent_at) returning id into v_id;
  end if;
  return v_id;
end $function$
;

-- public.creatopia_admin_save_event
CREATE OR REPLACE FUNCTION public.creatopia_admin_save_event(p_secret text, p_event jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid := nullif(p_event->>'id','')::uuid;
begin
  perform creatopia_private.check_secret(p_secret);
  if v_id is not null and exists (select 1 from public.creatopia_events where id = v_id) then
    update public.creatopia_events set
      slug = p_event->>'slug', title = p_event->>'title', tagline = p_event->>'tagline', description = p_event->>'description',
      starts_at = (p_event->>'starts_at')::timestamptz, ends_at = nullif(p_event->>'ends_at','')::timestamptz,
      timezone = coalesce(p_event->>'timezone','Asia/Manila'), mode = coalesce(p_event->>'mode','online'),
      youtube_url = p_event->>'youtube_url', facebook_url = p_event->>'facebook_url', maps_url = p_event->>'maps_url',
      venue_name = p_event->>'venue_name', venue_address = p_event->>'venue_address', language_note = p_event->>'language_note', replay_url = p_event->>'replay_url',
      reminder_hour = coalesce((p_event->>'reminder_hour')::int, 10),
      event_day_hours = coalesce(array(select jsonb_array_elements_text(p_event->'event_day_hours')::int), '{10,13,15,16}'),
      reminders_enabled = coalesce((p_event->>'reminders_enabled')::boolean, true),
      is_active = coalesce((p_event->>'is_active')::boolean, false), updated_at = now()
    where id = v_id;
  else
    insert into public.creatopia_events (slug, title, tagline, description, starts_at, ends_at, timezone, mode, youtube_url, facebook_url, maps_url, venue_name, venue_address, language_note, replay_url, reminder_hour, event_day_hours, reminders_enabled, is_active)
    values (p_event->>'slug', p_event->>'title', p_event->>'tagline', p_event->>'description', (p_event->>'starts_at')::timestamptz, nullif(p_event->>'ends_at','')::timestamptz,
      coalesce(p_event->>'timezone','Asia/Manila'), coalesce(p_event->>'mode','online'), p_event->>'youtube_url', p_event->>'facebook_url', p_event->>'maps_url',
      p_event->>'venue_name', p_event->>'venue_address', p_event->>'language_note', p_event->>'replay_url', coalesce((p_event->>'reminder_hour')::int, 10),
      coalesce(array(select jsonb_array_elements_text(p_event->'event_day_hours')::int), '{10,13,15,16}'),
      coalesce((p_event->>'reminders_enabled')::boolean, true), coalesce((p_event->>'is_active')::boolean, false))
    returning id into v_id;
  end if;
  return v_id;
end $function$
;

-- public.creatopia_admin_save_speaker
CREATE OR REPLACE FUNCTION public.creatopia_admin_save_speaker(p_secret text, p_speaker jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid := nullif(p_speaker->>'id','')::uuid;
begin
  perform creatopia_private.check_secret(p_secret);
  if v_id is not null and exists (select 1 from public.creatopia_speakers where id = v_id) then
    update public.creatopia_speakers set
      name = p_speaker->>'name', role = p_speaker->>'role', bio = p_speaker->>'bio', teaser = p_speaker->>'teaser',
      is_hidden = coalesce((p_speaker->>'is_hidden')::boolean, false), is_host = coalesce((p_speaker->>'is_host')::boolean, false),
      instagram = p_speaker->>'instagram', facebook = p_speaker->>'facebook', youtube = p_speaker->>'youtube', tiktok = p_speaker->>'tiktok',
      sort = coalesce((p_speaker->>'sort')::int, 0),
      photo_mime = coalesce(p_speaker->>'photo_mime', photo_mime), photo_b64 = coalesce(p_speaker->>'photo_b64', photo_b64)
    where id = v_id;
  else
    insert into public.creatopia_speakers (event_id, name, role, bio, teaser, is_hidden, is_host, instagram, facebook, youtube, tiktok, sort, photo_mime, photo_b64)
    values ((p_speaker->>'event_id')::uuid, p_speaker->>'name', p_speaker->>'role', p_speaker->>'bio', p_speaker->>'teaser',
      coalesce((p_speaker->>'is_hidden')::boolean, false), coalesce((p_speaker->>'is_host')::boolean, false),
      p_speaker->>'instagram', p_speaker->>'facebook', p_speaker->>'youtube', p_speaker->>'tiktok', coalesce((p_speaker->>'sort')::int, 0),
      p_speaker->>'photo_mime', p_speaker->>'photo_b64')
    returning id into v_id;
  end if;
  return v_id;
end $function$
;

-- public.creatopia_admin_save_template
CREATE OR REPLACE FUNCTION public.creatopia_admin_save_template(p_secret text, p_event_id uuid, p_key text, p_subject text, p_body text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  insert into public.creatopia_email_templates (event_id, key, subject, body_md) values (p_event_id, p_key, p_subject, p_body)
  on conflict (event_id, key) do update set subject = excluded.subject, body_md = excluded.body_md, updated_at = now();
end $function$
;

-- public.creatopia_admin_set_contact
CREATE OR REPLACE FUNCTION public.creatopia_admin_set_contact(p_secret text, p_id uuid, p_contact_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); update public.creatopia_waitlist set resend_contact_id = p_contact_id where id = p_id; end $function$
;

-- public.creatopia_admin_set_registration_contact
CREATE OR REPLACE FUNCTION public.creatopia_admin_set_registration_contact(p_secret text, p_id uuid, p_contact_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); update public.creatopia_registrations set resend_contact_id = p_contact_id where id = p_id; end $function$
;

-- public.creatopia_admin_speakers
CREATE OR REPLACE FUNCTION public.creatopia_admin_speakers(p_secret text, p_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return coalesce((select jsonb_agg((to_jsonb(s) - 'photo_b64' - 'photo_mime') || jsonb_build_object('has_photo', s.photo_b64 is not null) order by s.sort, s.created_at)
    from public.creatopia_speakers s where s.event_id = p_event_id), '[]'::jsonb);
end $function$
;

-- public.creatopia_admin_templates
CREATE OR REPLACE FUNCTION public.creatopia_admin_templates(p_secret text, p_event_id uuid)
 RETURNS SETOF creatopia_email_templates
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin perform creatopia_private.check_secret(p_secret); return query select * from public.creatopia_email_templates where event_id = p_event_id; end $function$
;

-- public.creatopia_admin_waitlist_targets
CREATE OR REPLACE FUNCTION public.creatopia_admin_waitlist_targets(p_secret text, p_event_id uuid, p_slot_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform creatopia_private.check_secret(p_secret);
  return coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'first_name', coalesce(w.name, ''), 'email', w.email, 'unsubscribe_token', w.unsubscribe_token) order by w.created_at)
    from public.creatopia_waitlist w
    where not w.unsubscribed
      and not exists (select 1 from public.creatopia_registrations r where r.event_id = p_event_id and lower(r.email) = lower(w.email))
      and not exists (select 1 from public.creatopia_waitlist_reminder_log l where l.waitlist_id = w.id and l.event_id = p_event_id and l.slot_key = p_slot_key)), '[]'::jsonb);
end $function$
;

-- public.creatopia_join_waitlist
CREATE OR REPLACE FUNCTION public.creatopia_join_waitlist(p_name text, p_email text, p_phone text, p_source text, p_user_agent text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare w public.creatopia_waitlist;
begin
  select * into w from public.creatopia_waitlist where lower(email) = lower(p_email);
  if found then return jsonb_build_object('id', w.id, 'duplicate', true); end if;
  insert into public.creatopia_waitlist (name, email, phone, source, user_agent)
  values (left(p_name, 80), lower(p_email), left(p_phone, 20), left(p_source, 200), left(p_user_agent, 400)) returning * into w;
  return jsonb_build_object('id', w.id, 'duplicate', false);
end $function$
;

-- public.creatopia_public_event
CREATE OR REPLACE FUNCTION public.creatopia_public_event()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select to_jsonb(e) - 'reminder_hour' - 'event_day_hours' - 'reminders_enabled' - 'is_active' || jsonb_build_object('speakers', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'event_id', s.event_id,
      'name', case when s.is_hidden then 'Hidden speaker' else s.name end,
      'role', s.role, 'bio', case when s.is_hidden then null else s.bio end, 'teaser', s.teaser,
      'is_hidden', s.is_hidden, 'is_host', s.is_host,
      'instagram', case when s.is_hidden then null else s.instagram end, 'facebook', case when s.is_hidden then null else s.facebook end,
      'youtube', case when s.is_hidden then null else s.youtube end, 'tiktok', case when s.is_hidden then null else s.tiktok end,
      'has_photo', (s.photo_b64 is not null and not s.is_hidden), 'sort', s.sort) order by s.sort, s.created_at)
    from public.creatopia_speakers s where s.event_id = e.id), '[]'::jsonb))
  from public.creatopia_events e where e.is_active limit 1
$function$
;

-- public.creatopia_register
CREATE OR REPLACE FUNCTION public.creatopia_register(p_event_id uuid, p_first_name text, p_email text, p_phone text, p_source text, p_user_agent text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare r public.creatopia_registrations;
begin
  if not exists (select 1 from public.creatopia_events where id = p_event_id and is_active) then raise exception 'event not open'; end if;
  select * into r from public.creatopia_registrations where event_id = p_event_id and lower(email) = lower(p_email);
  if found then return jsonb_build_object('id', r.id, 'duplicate', true, 'token', r.unsubscribe_token); end if;
  insert into public.creatopia_registrations (event_id, first_name, email, phone, source, user_agent)
  values (p_event_id, left(p_first_name, 60), lower(p_email), left(p_phone, 20), left(p_source, 200), left(p_user_agent, 400)) returning * into r;
  return jsonb_build_object('id', r.id, 'duplicate', false, 'token', r.unsubscribe_token);
end $function$
;

-- public.creatopia_speaker_photo
CREATE OR REPLACE FUNCTION public.creatopia_speaker_photo(p_id uuid)
 RETURNS TABLE(photo_mime text, photo_b64 text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select s.photo_mime, s.photo_b64 from public.creatopia_speakers s where s.id = p_id and not s.is_hidden
$function$
;

-- public.creatopia_unsubscribe
CREATE OR REPLACE FUNCTION public.creatopia_unsubscribe(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare n int := 0; m int := 0;
begin
  update public.creatopia_registrations set unsubscribed = true where unsubscribe_token = p_token; get diagnostics n = row_count;
  update public.creatopia_waitlist set unsubscribed = true where unsubscribe_token = p_token; get diagnostics m = row_count;
  return (n + m) > 0;
end $function$
;

-- public.prototype_add_asset
CREATE OR REPLACE FUNCTION public.prototype_add_asset(p_key text, p_job_id text, p_name text, p_type text, p_data text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  insert into prototype_assets (job_id, name, content_type, data) values (p_job_id, p_name, p_type, p_data)
  on conflict (job_id, name) do update set content_type = excluded.content_type, data = excluded.data;
end $function$
;

-- public.prototype_asset
CREATE OR REPLACE FUNCTION public.prototype_asset(p_slug text, p_name text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('type', a.content_type, 'data', a.data)
  from prototype_jobs j join prototype_assets a on a.job_id = j.id
  where j.slug = p_slug and a.name = p_name and j.status <> 'removed'
$function$
;

-- public.prototype_claim
CREATE OR REPLACE FUNCTION public.prototype_claim(p_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update prototype_jobs set status = 'building', started_at = now(), error = null,
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Builder picked it up.'))
   where id = p_id and (status = 'queued' or (status = 'building' and started_at < now() - interval '25 minutes'));
  return found;
end $function$
;

-- public.prototype_create
CREATE OR REPLACE FUNCTION public.prototype_create(p_key text, p_job jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  insert into prototype_jobs (id, slug, status, model, links, description, scraped, brief, progress)
  values (p_job->>'id', p_job->>'slug', 'preparing', coalesce(p_job->>'model', 'claude-opus-5-5'), coalesce(p_job->'links', '[]'::jsonb),
          coalesce(p_job->>'description', ''), coalesce(p_job->'scraped', '{}'::jsonb), p_job->>'brief',
          jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Reading the links and saving the pictures.')));
end $function$
;

-- public.prototype_fail
CREATE OR REPLACE FUNCTION public.prototype_fail(p_id text, p_error text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update prototype_jobs set status = 'failed', error = left(p_error, 500), finished_at = now() where id = p_id
$function$
;

-- public.prototype_finish
CREATE OR REPLACE FUNCTION public.prototype_finish(p_id text, p_name text, p_type text, p_summary text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from prototype_pages where job_id = p_id and path = 'index') then
    raise exception 'save the "index" page before finishing';
  end if;
  update prototype_jobs set status = 'ready', business_name = p_name, business_type = p_type, summary = p_summary, finished_at = now(),
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Prototype ready.'))
   where id = p_id;
end $function$
;

-- public.prototype_list
CREATE OR REPLACE FUNCTION public.prototype_list(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$
;

-- public.prototype_page
CREATE OR REPLACE FUNCTION public.prototype_page(p_slug text, p_path text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('body', p.body, 'title', p.title, 'status', j.status, 'name', j.business_name, 'badge', j.scraped->>'badge')
  from prototype_jobs j join prototype_pages p on p.job_id = j.id
  where j.slug = p_slug and p.path = p_path and j.status <> 'removed'
$function$
;

-- public.prototype_plan
CREATE OR REPLACE FUNCTION public.prototype_plan(p_id text, p_pages integer)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update prototype_jobs set planned = greatest(1, least(p_pages, 20)),
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Site plan ready: ' || p_pages || ' pages.'))
  where id = p_id
$function$
;

-- public.prototype_progress
CREATE OR REPLACE FUNCTION public.prototype_progress(p_id text, p_text text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update prototype_jobs set progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', left(p_text, 300)))
  where id = p_id
$function$
;

-- public.prototype_queue
CREATE OR REPLACE FUNCTION public.prototype_queue()
 RETURNS TABLE(id text, slug text, model text, created_at timestamp with time zone, brief text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select j.id, j.slug, j.model, j.created_at, j.brief from prototype_jobs j
  where j.status = 'queued' or (j.status = 'building' and j.started_at < now() - interval '25 minutes')
  order by j.created_at
$function$
;

-- public.prototype_remove
CREATE OR REPLACE FUNCTION public.prototype_remove(p_key text, p_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set status = 'removed' where id = p_id;
end $function$
;

-- public.prototype_requeue
CREATE OR REPLACE FUNCTION public.prototype_requeue(p_key text, p_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set status = 'queued', error = null, started_at = null, finished_at = null,
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Sent back to the builder.'))
   where id = p_id;
end $function$
;

-- public.prototype_save_page
CREATE OR REPLACE FUNCTION public.prototype_save_page(p_id text, p_path text, p_title text, p_body text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_path !~ '^[a-z0-9][a-z0-9-]*(\.(css|js))?$' then raise exception 'path must be like "index", "menu", "book" or "site.css"'; end if;
  insert into prototype_pages (job_id, path, title, body, updated_at) values (p_id, p_path, p_title, p_body, now())
  on conflict (job_id, path) do update set title = excluded.title, body = excluded.body, updated_at = now();
  return length(p_body);
end $function$
;

-- public.prototype_set_brief
CREATE OR REPLACE FUNCTION public.prototype_set_brief(p_key text, p_id text, p_brief text, p_scraped jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not tracker_key_ok(p_key) then raise exception 'unauthorized'; end if;
  update prototype_jobs set brief = p_brief, scraped = p_scraped, status = 'queued',
         progress = progress || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Brief ready. Waiting for the builder.'))
   where id = p_id and status = 'preparing';
end $function$
;

-- public.prototype_status
CREATE OR REPLACE FUNCTION public.prototype_status(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('status', j.status, 'name', j.business_name,
    'pages', coalesce((select jsonb_agg(p.path) from prototype_pages p where p.job_id = j.id), '[]'::jsonb))
  from prototype_jobs j where j.slug = p_slug and j.status <> 'removed'
$function$
;

-- public.rasengan_admin_emails
CREATE OR REPLACE FUNCTION public.rasengan_admin_emails(p_secret text)
 RETURNS SETOF text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return query select u.email::text from public.rasengan_admins a join auth.users u on u.id = a.user_id where u.email is not null;
end $function$
;

-- public.rasengan_admin_set_suspended
CREATE OR REPLACE FUNCTION public.rasengan_admin_set_suspended(p_user uuid, p_suspended boolean, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not rasengan_private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user = (select auth.uid()) then raise exception 'You can''t suspend yourself'; end if;
  if p_suspended then
    insert into public.rasengan_suspensions (user_id, reason) values (p_user, p_reason)
    on conflict (user_id) do update set reason = excluded.reason;
    update public.rasengan_contacts set next_run_at = null where owner_id = p_user and status = 'active';
  else
    delete from public.rasengan_suspensions where user_id = p_user;
    update public.rasengan_contacts set next_run_at = now() where owner_id = p_user and status = 'active' and next_run_at is null;
  end if;
  insert into public.rasengan_audit_log (actor, action, target, meta)
  values ((select auth.uid()), case when p_suspended then 'user.suspend' else 'user.unsuspend' end, p_user::text, jsonb_build_object('reason', p_reason));
end $function$
;

-- public.rasengan_admin_stats
CREATE OR REPLACE FUNCTION public.rasengan_admin_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r jsonb;
begin
  if not rasengan_private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.rasengan_profiles),
    'users_today', (select count(*) from public.rasengan_profiles where created_at > now() - interval '1 day'),
    'users_7d', (select count(*) from public.rasengan_profiles where created_at > now() - interval '7 days'),
    'active_today', (select count(*) from public.rasengan_profiles where last_seen_at > now() - interval '1 day'),
    'active_7d', (select count(*) from public.rasengan_profiles where last_seen_at > now() - interval '7 days'),
    'businesses', (select count(*) from public.rasengan_businesses),
    'contacts', (select count(*) from public.rasengan_contacts),
    'emails_today', (select count(*) from public.rasengan_messages where direction = 'out' and channel = 'email' and created_at > now() - interval '1 day'),
    'sms_today', (select count(*) from public.rasengan_messages where direction = 'out' and channel = 'sms' and created_at > now() - interval '1 day'),
    'emails_total', (select count(*) from public.rasengan_messages where direction = 'out' and channel = 'email'),
    'sms_total', (select count(*) from public.rasengan_messages where direction = 'out' and channel = 'sms'),
    'replies_total', (select count(*) from public.rasengan_messages where direction = 'in'),
    'failed_7d', (select count(*) from public.rasengan_messages where status = 'failed' and created_at > now() - interval '7 days'),
    'email_modes', (select coalesce(jsonb_object_agg(email_mode, n), '{}'::jsonb) from (select email_mode, count(*) n from public.rasengan_businesses group by 1) x),
    'sms_providers', (select coalesce(jsonb_object_agg(coalesce(sms_provider, 'none'), n), '{}'::jsonb) from (select sms_provider, count(*) n from public.rasengan_businesses group by 1) x),
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d::date,
        'signups', (select count(*) from public.rasengan_profiles p where p.created_at::date = d::date),
        'active', (select count(distinct a.user_id) from public.rasengan_activity a where a.created_at::date = d::date),
        'emails', (select count(*) from public.rasengan_messages m where m.direction = 'out' and m.channel = 'email' and m.created_at::date = d::date),
        'sms', (select count(*) from public.rasengan_messages m where m.direction = 'out' and m.channel = 'sms' and m.created_at::date = d::date),
        'replies', (select count(*) from public.rasengan_messages m where m.direction = 'in' and m.created_at::date = d::date)
      ) order by d)
      from generate_series(now() - interval '13 days', now(), interval '1 day') d
    )
  ) into r;
  return r;
end $function$
;

-- public.rasengan_admin_users
CREATE OR REPLACE FUNCTION public.rasengan_admin_users()
 RETURNS TABLE(id uuid, email text, username text, full_name text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, last_seen_at timestamp with time zone, business text, email_mode text, sms_provider text, contacts bigint, emails_7d bigint, sms_7d bigint, replies_7d bigint, sent_total bigint, suspended boolean, is_admin boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not rasengan_private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select u.id, u.email::text, p.username, p.full_name, u.created_at, u.last_sign_in_at, p.last_seen_at,
    b.name, b.email_mode, b.sms_provider,
    (select count(*) from public.rasengan_contacts c where c.owner_id = u.id),
    (select count(*) from public.rasengan_messages m where m.owner_id = u.id and m.direction = 'out' and m.channel = 'email' and m.created_at > now() - interval '7 days'),
    (select count(*) from public.rasengan_messages m where m.owner_id = u.id and m.direction = 'out' and m.channel = 'sms' and m.created_at > now() - interval '7 days'),
    (select count(*) from public.rasengan_messages m where m.owner_id = u.id and m.direction = 'in' and m.created_at > now() - interval '7 days'),
    (select count(*) from public.rasengan_messages m where m.owner_id = u.id and m.direction = 'out'),
    exists (select 1 from public.rasengan_suspensions s where s.user_id = u.id),
    exists (select 1 from public.rasengan_admins a where a.user_id = u.id)
  from public.rasengan_profiles p
  join auth.users u on u.id = p.id
  left join public.rasengan_businesses b on b.owner_id = u.id
  order by u.created_at desc;
end $function$
;

-- public.rasengan_check_reset
CREATE OR REPLACE FUNCTION public.rasengan_check_reset(p_secret text, p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return exists (
    select 1 from rasengan_private.password_resets
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and used_at is null and expires_at > now()
  );
end $function$
;

-- public.rasengan_consume_reset
CREATE OR REPLACE FUNCTION public.rasengan_consume_reset(p_secret text, p_token text, p_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid; v_email text;
begin
  perform rasengan_private.assert_secret(p_secret);
  if length(coalesce(p_password, '')) < 8 then raise exception 'weak password' using errcode = '22023'; end if;
  update rasengan_private.password_resets set used_at = now()
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and used_at is null and expires_at > now()
  returning user_id into v_user;
  if v_user is null then return null; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = v_user returning email::text into v_email;
  delete from auth.refresh_tokens where user_id = v_user::text;
  delete from auth.sessions where user_id = v_user;
  -- invalidate any other outstanding links for this account
  update rasengan_private.password_resets set used_at = now() where user_id = v_user and used_at is null;
  return v_email;
end $function$
;

-- public.rasengan_create_reset
CREATE OR REPLACE FUNCTION public.rasengan_create_reset(p_secret text, p_identifier text)
 RETURNS TABLE(email text, full_name text, token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid; v_email text; v_name text; v_token text;
begin
  perform rasengan_private.assert_secret(p_secret);
  select u.id, u.email::text, p.full_name into v_user, v_email, v_name
  from auth.users u join public.rasengan_profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_identifier)) or p.username = lower(trim(p_identifier))
  limit 1;
  if v_user is null then return; end if;
  if (select count(*) from rasengan_private.password_resets r where r.user_id = v_user and r.created_at > now() - interval '1 hour') >= 3 then
    return;
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into rasengan_private.password_resets (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_user, now() + interval '1 hour');
  return query select v_email, v_name, v_token;
end $function$
;

-- public.rasengan_email_for_username
CREATE OR REPLACE FUNCTION public.rasengan_email_for_username(p_secret text, p_username text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return (select u.email::text from auth.users u join public.rasengan_profiles p on p.id = u.id where p.username = lower(p_username) limit 1);
end $function$
;

-- public.rasengan_engine_businesses
CREATE OR REPLACE FUNCTION public.rasengan_engine_businesses(p_secret text, p_owners uuid[])
 RETURNS SETOF rasengan_businesses
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return query select * from public.rasengan_businesses where owner_id = any (p_owners);
end $function$
;

-- public.rasengan_engine_claim
CREATE OR REPLACE FUNCTION public.rasengan_engine_claim(p_secret text, p_limit integer DEFAULT 40, p_owner uuid DEFAULT NULL::uuid)
 RETURNS SETOF rasengan_contacts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return query
  update public.rasengan_contacts c set locked_until = now() + interval '10 minutes'
  where c.id in (
    select c2.id from public.rasengan_contacts c2
    join public.rasengan_businesses b on b.owner_id = c2.owner_id and not b.engine_paused
    where c2.status = 'active'
      and c2.next_run_at <= now()
      and (p_owner is null or c2.owner_id = p_owner)
      and (c2.locked_until is null or c2.locked_until < now())
      and not exists (select 1 from public.rasengan_suspensions s where s.user_id = c2.owner_id)
    order by c2.next_run_at
    limit p_limit
    for update of c2 skip locked
  )
  returning c.*;
end $function$
;

-- public.rasengan_engine_history
CREATE OR REPLACE FUNCTION public.rasengan_engine_history(p_secret text, p_contact uuid)
 RETURNS SETOF rasengan_messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return query select * from public.rasengan_messages where contact_id = p_contact order by created_at;
end $function$
;

-- public.rasengan_engine_record
CREATE OR REPLACE FUNCTION public.rasengan_engine_record(p_secret text, p_contact uuid, p_messages jsonb, p_patch jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_owner uuid;
begin
  perform rasengan_private.assert_secret(p_secret);
  select owner_id into v_owner from public.rasengan_contacts where id = p_contact;
  if v_owner is null then return; end if;

  insert into public.rasengan_messages (owner_id, contact_id, direction, channel, step, subject, body, status, provider_id, error)
  select v_owner, p_contact, 'out', m->>'channel', (m->>'step')::int, m->>'subject', m->>'body',
         coalesce(m->>'status', 'sent'), m->>'provider_id', m->>'error'
  from jsonb_array_elements(coalesce(p_messages, '[]'::jsonb)) m;

  update public.rasengan_contacts set
    locked_until = null,
    step = coalesce((p_patch->>'step')::int, step),
    status = coalesce((p_patch->>'status')::public.rasengan_contact_status, status),
    next_run_at = case when p_patch ? 'next_run_at' then (p_patch->>'next_run_at')::timestamptz else next_run_at end,
    last_contacted_at = coalesce((p_patch->>'last_contacted_at')::timestamptz, last_contacted_at)
  where id = p_contact;
end $function$
;

-- public.rasengan_engine_sms_today
CREATE OR REPLACE FUNCTION public.rasengan_engine_sms_today(p_secret text, p_owner uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return (select count(*)::int from public.rasengan_messages
          where owner_id = p_owner and channel = 'sms' and direction = 'out'
            and created_at > now() - interval '24 hours');
end $function$
;

-- public.rasengan_engine_templates
CREATE OR REPLACE FUNCTION public.rasengan_engine_templates(p_secret text, p_owners uuid[])
 RETURNS SETOF rasengan_templates
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform rasengan_private.assert_secret(p_secret);
  return query select * from public.rasengan_templates where owner_id = any (p_owners);
end $function$
;

-- public.rasengan_inbound_email
CREATE OR REPLACE FUNCTION public.rasengan_inbound_email(p_secret text, p_contact uuid, p_from text, p_subject text, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_contact public.rasengan_contacts;
begin
  perform rasengan_private.assert_secret(p_secret);
  if p_contact is not null then
    select * into v_contact from public.rasengan_contacts where id = p_contact;
  end if;
  if v_contact.id is null and p_from is not null then
    select * into v_contact from public.rasengan_contacts where email = lower(p_from)
     order by last_contacted_at desc nulls last limit 1;
  end if;
  if v_contact.id is null then return jsonb_build_object('ok', true, 'unmatched', true); end if;
  return rasengan_private.record_inbound(v_contact, 'email', p_subject, p_body);
end $function$
;

-- public.rasengan_inbound_sms
CREATE OR REPLACE FUNCTION public.rasengan_inbound_sms(p_token text, p_from text, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_owner uuid;
  v_key text := right(regexp_replace(coalesce(p_from, ''), '\D', '', 'g'), 9);
  v_contact public.rasengan_contacts;
begin
  update public.rasengan_businesses set sms_last_inbound_at = now() where inbound_token = p_token returning owner_id into v_owner;
  if v_owner is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(v_key) < 7 then return jsonb_build_object('ok', true, 'unmatched', true); end if;
  select * into v_contact from public.rasengan_contacts
   where owner_id = v_owner and phone is not null and right(regexp_replace(phone, '\D', '', 'g'), 9) = v_key
   order by last_contacted_at desc nulls last limit 1;
  if v_contact.id is null then return jsonb_build_object('ok', true, 'unmatched', true); end if;
  return rasengan_private.record_inbound(v_contact, 'sms', null, p_text);
end $function$
;

-- public.rasengan_is_admin
CREATE OR REPLACE FUNCTION public.rasengan_is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select rasengan_private.is_admin();
$function$
;

-- public.rasengan_rate_limit
CREATE OR REPLACE FUNCTION public.rasengan_rate_limit(p_secret text, p_key text, p_max integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v rasengan_private.rate_limits;
begin
  perform rasengan_private.assert_secret(p_secret);
  insert into rasengan_private.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning * into v;
  if random() < 0.01 then delete from rasengan_private.rate_limits where window_start < now() - interval '1 day'; end if;
  return v.hits <= p_max;
end $function$
;

-- public.rasengan_support_mark_read
CREATE OR REPLACE FUNCTION public.rasengan_support_mark_read(p_user uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_user is null or p_user = (select auth.uid()) then
    update public.rasengan_support_threads set user_unread = 0 where user_id = (select auth.uid());
  elsif rasengan_private.is_admin() then
    update public.rasengan_support_threads set admin_unread = 0 where user_id = p_user;
  else
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $function$
;

-- public.rasengan_username_available
CREATE OR REPLACE FUNCTION public.rasengan_username_available(p_username text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select not exists (select 1 from public.rasengan_profiles where username = lower(p_username))
$function$
;

-- public.tmp_shot_upload
CREATE OR REPLACE FUNCTION public.tmp_shot_upload(p_token text, p_name text, p_data text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$ begin raise exception 'disabled'; end $function$
;

-- public.tracker_backup_get
CREATE OR REPLACE FUNCTION public.tracker_backup_get(p_key text, p_day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return (select doc from tracker_backups where day = p_day);
end; $function$
;

-- public.tracker_backup_list
CREATE OR REPLACE FUNCTION public.tracker_backup_list(p_key text)
 RETURNS TABLE(day date, saved_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return query select b.day, b.saved_at from tracker_backups b order by b.day desc;
end; $function$
;

-- public.tracker_get
CREATE OR REPLACE FUNCTION public.tracker_get(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return (select doc from tracker_state where id = 'main');
end; $function$
;

-- public.tracker_key_ok
CREATE OR REPLACE FUNCTION public.tracker_key_ok(p_key text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex'))
$function$
;

-- public.tracker_media_folder
CREATE OR REPLACE FUNCTION public.tracker_media_folder(p_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  return (select folder from tracker_media where id = 'videos');
end; $function$
;

-- public.tracker_meeting_pending
CREATE OR REPLACE FUNCTION public.tracker_meeting_pending()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int
  from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'meetings', '[]'::jsonb)) m
  where t.id = 'main' and m->>'status' = 'waiting' and m ? 'prompt'
$function$
;

-- public.tracker_meeting_queue
CREATE OR REPLACE FUNCTION public.tracker_meeting_queue()
 RETURNS TABLE(meeting_id text, title text, asked_at text, staff jsonb, system_prompt text, user_prompt text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select m->>'id', m->>'title', m->'prompt'->>'askedAt',
         coalesce((select jsonb_agg(jsonb_build_object('id', s->>'id', 'name', s->>'name'))
                   from jsonb_array_elements(t.doc->'data'->'city'->'staff') s
                   where m->'staffIds' ? (s->>'id')), '[]'::jsonb),
         m->'prompt'->>'system', m->'prompt'->>'user'
  from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'meetings', '[]'::jsonb)) m
  where t.id = 'main' and m->>'status' = 'waiting' and m ? 'prompt'
$function$
;

-- public.tracker_meeting_reply
CREATE OR REPLACE FUNCTION public.tracker_meeting_reply(p_id text, p_asked_at text, p_replies jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;

-- public.tracker_put
CREATE OR REPLACE FUNCTION public.tracker_put(p_key text, p_doc jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not exists (select 1 from tracker_keys where key_hash = encode(digest(p_key, 'sha256'), 'hex')) then
    raise exception 'unauthorized';
  end if;
  insert into tracker_state (id, doc, updated_at) values ('main', p_doc, now())
  on conflict (id) do update set doc = excluded.doc, updated_at = now();
  insert into tracker_backups (day, doc, saved_at) values (current_date, p_doc, now())
  on conflict (day) do update set doc = excluded.doc, saved_at = now();
end; $function$
;

-- public.tracker_work_finish
CREATE OR REPLACE FUNCTION public.tracker_work_finish(p_id text, p_text text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  if coalesce(trim(p_text), '') = '' then raise exception 'empty result'; end if;
  update tracker_state t
     set doc = jsonb_set(t.doc, '{data,staffWork}', (
       select jsonb_agg(case when e.w->>'id' = p_id
                             then (e.w - 'prompt' - 'status') || jsonb_build_object('text', p_text, 'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
                             else e.w end order by e.ord)
       from jsonb_array_elements(t.doc->'data'->'staffWork') with ordinality as e(w, ord)))
   where t.id = 'main'
     and exists (select 1 from jsonb_array_elements(t.doc->'data'->'staffWork') x where x->>'id' = p_id and x->>'status' = 'queued');
  get diagnostics n = row_count;
  return n > 0;
end $function$
;

-- public.tracker_work_pending
CREATE OR REPLACE FUNCTION public.tracker_work_pending()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'staffWork', '[]'::jsonb)) w
  where t.id = 'main' and w->>'status' = 'queued' and w ? 'prompt'
$function$
;

-- public.tracker_work_queue
CREATE OR REPLACE FUNCTION public.tracker_work_queue()
 RETURNS TABLE(job_id text, staff_name text, job_label text, system_prompt text, user_prompt text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select w->>'id',
         coalesce((select s->>'name' from jsonb_array_elements(t.doc->'data'->'city'->'staff') s where s->>'id' = w->>'staffId'), 'Staff'),
         w->>'label', w->'prompt'->>'system', w->'prompt'->>'user'
  from tracker_state t, jsonb_array_elements(coalesce(t.doc->'data'->'staffWork', '[]'::jsonb)) w
  where t.id = 'main' and w->>'status' = 'queued'
$function$
;

-- rasengan_private.assert_secret
CREATE OR REPLACE FUNCTION rasengan_private.assert_secret(p_secret text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_secret is null or p_secret is distinct from (
    select decrypted_secret from vault.decrypted_secrets where name = 'rasengan_engine_secret' limit 1
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $function$
;

-- rasengan_private.is_admin
CREATE OR REPLACE FUNCTION rasengan_private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.rasengan_admins where user_id = (select auth.uid()));
$function$
;

-- rasengan_private.log_signup
CREATE OR REPLACE FUNCTION rasengan_private.log_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.rasengan_activity (user_id, event, meta) values (new.id, 'signup', jsonb_build_object('username', new.username));
  return new;
end $function$
;

-- rasengan_private.on_auth_user_after_insert
CREATE OR REPLACE FUNCTION rasengan_private.on_auth_user_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.raw_user_meta_data ->> 'app' = 'rasengan' then
    insert into public.rasengan_profiles (id, username, full_name)
    values (new.id, lower(new.raw_user_meta_data ->> 'username'), new.raw_user_meta_data ->> 'full_name');
  end if;
  return new;
end $function$
;

-- rasengan_private.on_auth_user_before_insert
CREATE OR REPLACE FUNCTION rasengan_private.on_auth_user_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.raw_user_meta_data ->> 'app' = 'rasengan' and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end $function$
;

-- rasengan_private.on_support_message
CREATE OR REPLACE FUNCTION rasengan_private.on_support_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.rasengan_support_threads as t (user_id, last_message_at, last_preview, last_sender, admin_unread, user_unread)
  values (new.user_id, new.created_at, left(new.body, 160), new.sender,
          case when new.sender = 'user' then 1 else 0 end, case when new.sender = 'admin' then 1 else 0 end)
  on conflict (user_id) do update set
    last_message_at = excluded.last_message_at,
    last_preview = excluded.last_preview,
    last_sender = excluded.last_sender,
    admin_unread = t.admin_unread + excluded.admin_unread,
    user_unread = t.user_unread + excluded.user_unread;
  return new;
end $function$
;

-- rasengan_private.record_inbound
CREATE OR REPLACE FUNCTION rasengan_private.record_inbound(p_contact rasengan_contacts, p_channel text, p_subject text, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_opt boolean := coalesce(p_body, '') ~* '^\s*(stop|unsubscribe|cancel|end|quit|stopall|remove me)\M'
                      or coalesce(p_subject, '') ~* '^\s*(unsubscribe|stop|remove me)\M';
begin
  insert into public.rasengan_messages (owner_id, contact_id, direction, channel, subject, body, status)
  values (p_contact.owner_id, p_contact.id, 'in', p_channel, p_subject, coalesce(nullif(trim(p_body), ''), '(empty message)'), 'received');
  update public.rasengan_contacts set
    status = case when v_opt or status = 'opted_out' then 'opted_out'::public.rasengan_contact_status
                  else 'replied'::public.rasengan_contact_status end,
    next_run_at = null,
    last_reply_at = now(),
    unread_count = unread_count + 1
  where id = p_contact.id;
  return jsonb_build_object('ok', true, 'contact', p_contact.id, 'opt_out', v_opt);
end $function$
;

-- rasengan_private.touch_updated_at
CREATE OR REPLACE FUNCTION rasengan_private.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.updated_at = now(); return new; end $function$
;

-- ===== Triggers (3) =====
-- public.rasengan_businesses.rasengan_businesses_touch
CREATE TRIGGER rasengan_businesses_touch BEFORE UPDATE ON public.rasengan_businesses FOR EACH ROW EXECUTE FUNCTION rasengan_private.touch_updated_at();

-- public.rasengan_profiles.rasengan_log_signup
CREATE TRIGGER rasengan_log_signup AFTER INSERT ON public.rasengan_profiles FOR EACH ROW EXECUTE FUNCTION rasengan_private.log_signup();

-- public.rasengan_support_messages.rasengan_support_message_after
CREATE TRIGGER rasengan_support_message_after AFTER INSERT ON public.rasengan_support_messages FOR EACH ROW EXECUTE FUNCTION rasengan_private.on_support_message();

-- ===== Schema grants (4) =====
-- creatopia_private
grant usage on schema creatopia_private to anon, authenticated, service_role;

-- dermatrend
grant usage on schema dermatrend to anon, authenticated, service_role;

-- insightcma
grant usage on schema insightcma to anon, authenticated, service_role;

-- rasengan_private
grant usage on schema rasengan_private to anon, authenticated, service_role;

-- ===== Storage buckets (3) =====
-- city-images
insert into storage.buckets (id,name,public) values ('city-images','city-images',false) on conflict do nothing;

-- city-videos
insert into storage.buckets (id,name,public) values ('city-videos','city-videos',false) on conflict do nothing;

-- rasengan-logos
insert into storage.buckets (id,name,public) values ('rasengan-logos','rasengan-logos',true) on conflict do nothing;

-- ===== Storage policies (7) =====
-- city_images_insert
create policy "city_images_insert" on storage.objects as PERMISSIVE for INSERT to anon with check (((bucket_id = 'city-images'::text) AND ((storage.foldername(name))[1] = 'a79b9907f6090bbad20bacc2c5ae52c7'::text)));

-- city_images_select
create policy "city_images_select" on storage.objects as PERMISSIVE for SELECT to anon using (((bucket_id = 'city-images'::text) AND ((storage.foldername(name))[1] = 'a79b9907f6090bbad20bacc2c5ae52c7'::text)));

-- city_videos_insert
create policy "city_videos_insert" on storage.objects as PERMISSIVE for INSERT to anon with check (((bucket_id = 'city-videos'::text) AND ((storage.foldername(name))[1] = 'a79b9907f6090bbad20bacc2c5ae52c7'::text)));

-- city_videos_select
create policy "city_videos_select" on storage.objects as PERMISSIVE for SELECT to anon using (((bucket_id = 'city-videos'::text) AND ((storage.foldername(name))[1] = 'a79b9907f6090bbad20bacc2c5ae52c7'::text)));

-- rasengan logos delete own
create policy "rasengan logos delete own" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'rasengan-logos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

-- rasengan logos insert own
create policy "rasengan logos insert own" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'rasengan-logos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

-- rasengan logos update own
create policy "rasengan logos update own" on storage.objects as PERMISSIVE for UPDATE to authenticated using (((bucket_id = 'rasengan-logos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

-- ===== Cron jobs (4) =====
-- creatopia-reminders
select cron.schedule('creatopia-reminders','0 * * * *','select creatopia_private.tick_reminders()');

-- insightcma-appointments-5min
select cron.schedule('insightcma-appointments-5min','*/5 * * * *','
  select net.http_get(
    url := ''https://insightcma.vercel.app/api/cron/appointments'',
    headers := jsonb_build_object(''Authorization'', ''Bearer 8ca7d8e889cedca41db132454f439213864c2dd5825fee36''),
    timeout_milliseconds := 60000
  );
');

-- insightcma-followup-hourly
select cron.schedule('insightcma-followup-hourly','5 * * * *','
  select net.http_get(
    url := ''https://insightcma.vercel.app/api/cron/followup'',
    headers := jsonb_build_object(''Authorization'', ''Bearer 8ca7d8e889cedca41db132454f439213864c2dd5825fee36''),
    timeout_milliseconds := 120000
  );
');

-- rasengan-followups
select cron.schedule('rasengan-followups','*/15 * * * *','
  select net.http_get(
    url := ''https://rasengan-seven.vercel.app/api/cron/followups'',
    headers := jsonb_build_object(
      ''Authorization'',
      ''Bearer '' || (select decrypted_secret from vault.decrypted_secrets where name = ''rasengan_engine_secret'' limit 1)
    ),
    timeout_milliseconds := 290000
  );
  ');

