-- Supabase project jaytees (qanzoabxpglcuhzscwha) — schemas: public, viomi
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
-- viomi
create schema if not exists viomi;

-- ===== Enum types (9) =====
-- public.inventory_unit
create type public.inventory_unit as enum ('kg', 'g', 'L', 'mL', 'pcs', 'pct');

-- public.order_status
create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');

-- public.order_type
create type public.order_type as enum ('delivery', 'pickup');

-- public.payment_method
create type public.payment_method as enum ('cod', 'bank', 'gcash');

-- public.payment_status
create type public.payment_status as enum ('unpaid', 'pending_verification', 'paid', 'refunded');

-- public.reservation_status
create type public.reservation_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'seated', 'no_show');

-- public.staff_role
create type public.staff_role as enum ('super_admin', 'admin', 'cashier', 'inventory', 'staff');

-- public.staff_status
create type public.staff_status as enum ('pending', 'approved', 'disabled');

-- viomi.order_status
create type viomi.order_status as enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'installed', 'cancelled');

-- ===== Tables (20) =====
-- public.audit_reports
create table public.audit_reports (
  id uuid not null default gen_random_uuid(),
  branch_id uuid,
  period_start date not null,
  period_end date not null,
  score integer,
  payload jsonb not null,
  generated_by uuid,
  created_at timestamp with time zone not null default now()
);

-- public.branch_menu_items
create table public.branch_menu_items (
  branch_id uuid not null,
  menu_item_id uuid not null,
  is_available boolean not null default true,
  price_override numeric
);

-- public.branches
create table public.branches (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  code text not null,
  name text not null,
  short_name text not null,
  address text not null,
  city text not null,
  landmark text,
  phone text,
  email text,
  hours jsonb not null default '[]'::jsonb,
  map_url text,
  cover_image text,
  tagline text,
  since integer,
  delivery_fee numeric not null default 0,
  delivery_note text,
  accepts_delivery boolean not null default true,
  accepts_pickup boolean not null default true,
  accepts_reservations boolean not null default true,
  reservation_auto_accept boolean not null default false,
  registration_code text not null,
  courier_emails text[] not null default '{}'::text[],
  bank_details jsonb not null default '{}'::jsonb,
  gcash_details jsonb not null default '{}'::jsonb,
  seats integer not null default 60,
  is_active boolean not null default true,
  sort integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- public.counters
create table public.counters (
  branch_id uuid not null,
  kind text not null,
  value bigint not null default 0
);

-- public.inventory_items
create table public.inventory_items (
  id uuid not null default gen_random_uuid(),
  branch_id uuid not null,
  name text not null,
  category text,
  unit public.inventory_unit not null default 'kg'::inventory_unit,
  quantity numeric not null default 0,
  capacity numeric,
  low_threshold numeric not null default 0,
  sort integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid,
  unit_cost numeric not null default 0,
  selling_price numeric,
  supplier text,
  par_level numeric,
  is_countable boolean not null default true
);

-- public.inventory_logs
create table public.inventory_logs (
  id uuid not null default gen_random_uuid(),
  inventory_item_id uuid not null,
  branch_id uuid not null,
  delta numeric not null,
  quantity_after numeric not null,
  reason text,
  order_id uuid,
  user_id uuid,
  created_at timestamp with time zone not null default now(),
  kind text not null default 'adjustment'::text,
  unit_cost numeric,
  purchase_id uuid
);

-- public.menu_categories
create table public.menu_categories (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  sort integer not null default 0,
  is_active boolean not null default true
);

-- public.menu_items
create table public.menu_items (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null,
  slug text not null,
  name text not null,
  description text,
  price numeric not null,
  orig_price numeric,
  serves text,
  tag text,
  image_url text,
  is_available boolean not null default true,
  sort integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- public.notifications
create table public.notifications (
  id uuid not null default gen_random_uuid(),
  branch_id uuid,
  audience text[] not null default '{admin,cashier,inventory}'::text[],
  kind text not null,
  title text not null,
  body text,
  href text,
  ref_id uuid,
  read_by uuid[] not null default '{}'::uuid[],
  created_at timestamp with time zone not null default now()
);

-- public.order_items
create table public.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  menu_item_id uuid,
  name text not null,
  unit_price numeric not null,
  quantity integer not null,
  line_total numeric not null,
  notes text
);

-- public.orders
create table public.orders (
  id uuid not null default gen_random_uuid(),
  order_number text not null,
  branch_id uuid not null,
  type public.order_type not null,
  status public.order_status not null default 'pending'::order_status,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text,
  delivery_landmark text,
  pickup_time timestamp with time zone,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid'::payment_status,
  receipt_path text,
  subtotal numeric not null,
  delivery_fee numeric not null default 0,
  total numeric not null,
  notes text,
  courier_email text,
  courier_assigned_at timestamp with time zone,
  tracking_token text not null default encode(gen_random_bytes(12), 'hex'::text),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone,
  preparing_at timestamp with time zone,
  ready_at timestamp with time zone,
  dispatched_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancelled_reason text
);

-- public.profiles
create table public.profiles (
  id uuid not null,
  full_name text not null,
  email text not null,
  phone text,
  role public.staff_role not null default 'staff'::staff_role,
  status public.staff_status not null default 'pending'::staff_status,
  branch_id uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- public.purchases
create table public.purchases (
  id uuid not null default gen_random_uuid(),
  branch_id uuid not null,
  supplier text not null,
  category text,
  reference text,
  total numeric not null default 0,
  paid boolean not null default false,
  notes text,
  received_at timestamp with time zone not null default now(),
  user_id uuid,
  created_at timestamp with time zone not null default now()
);

-- public.reservations
create table public.reservations (
  id uuid not null default gen_random_uuid(),
  reservation_number text not null,
  branch_id uuid not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  party_size integer not null,
  reserved_at timestamp with time zone not null,
  status public.reservation_status not null default 'pending'::reservation_status,
  notes text,
  decided_by uuid,
  decided_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  seated_at timestamp with time zone
);

-- public.stock_counts
create table public.stock_counts (
  id uuid not null default gen_random_uuid(),
  branch_id uuid not null,
  inventory_item_id uuid not null,
  system_qty numeric not null,
  counted_qty numeric not null,
  variance numeric not null,
  remarks text,
  user_id uuid,
  counted_at timestamp with time zone not null default now()
);

-- viomi.bookings
create table viomi.bookings (
  id uuid not null default gen_random_uuid(),
  booking_number text not null,
  kind text not null,
  unit text,
  scheduled_at timestamp with time zone not null,
  slot text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  status text not null default 'requested'::text,
  created_at timestamp with time zone not null default now()
);

-- viomi.config
create table viomi.config (
  key text not null,
  value text not null
);

-- viomi.order_items
create table viomi.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  product_id text not null,
  name text not null,
  unit_price numeric not null,
  quantity integer not null,
  line_total numeric not null
);

-- viomi.orders
create table viomi.orders (
  id uuid not null default gen_random_uuid(),
  order_number text not null,
  tracking_token text not null default encode(gen_random_bytes(12), 'hex'::text),
  status viomi.order_status not null default 'pending'::viomi.order_status,
  payment_method text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  city text not null,
  subtotal numeric not null,
  total numeric not null,
  notes text,
  courier_email text,
  courier_name text,
  dispatched_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- viomi.products
create table viomi.products (
  id text not null,
  name text not null,
  price numeric not null,
  active boolean not null default true
);

-- ===== Constraints (62) =====
-- audit_reports.audit_reports_branch_id_fkey
alter table audit_reports add constraint audit_reports_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- audit_reports.audit_reports_pkey
alter table audit_reports add constraint audit_reports_pkey PRIMARY KEY (id);

-- branch_menu_items.branch_menu_items_branch_id_fkey
alter table branch_menu_items add constraint branch_menu_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- branch_menu_items.branch_menu_items_menu_item_id_fkey
alter table branch_menu_items add constraint branch_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

-- branch_menu_items.branch_menu_items_pkey
alter table branch_menu_items add constraint branch_menu_items_pkey PRIMARY KEY (branch_id, menu_item_id);

-- branches.branches_code_key
alter table branches add constraint branches_code_key UNIQUE (code);

-- branches.branches_pkey
alter table branches add constraint branches_pkey PRIMARY KEY (id);

-- branches.branches_slug_key
alter table branches add constraint branches_slug_key UNIQUE (slug);

-- counters.counters_branch_id_fkey
alter table counters add constraint counters_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- counters.counters_pkey
alter table counters add constraint counters_pkey PRIMARY KEY (branch_id, kind);

-- inventory_items.inventory_items_branch_id_fkey
alter table inventory_items add constraint inventory_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- inventory_items.inventory_items_pkey
alter table inventory_items add constraint inventory_items_pkey PRIMARY KEY (id);

-- inventory_logs.inventory_logs_branch_id_fkey
alter table inventory_logs add constraint inventory_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- inventory_logs.inventory_logs_inventory_item_id_fkey
alter table inventory_logs add constraint inventory_logs_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE;

-- inventory_logs.inventory_logs_kind_check
alter table inventory_logs add constraint inventory_logs_kind_check CHECK ((kind = ANY (ARRAY['delivery'::text, 'consumption'::text, 'spoilage'::text, 'transfer'::text, 'adjustment'::text, 'audit'::text])));

-- inventory_logs.inventory_logs_order_id_fkey
alter table inventory_logs add constraint inventory_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- inventory_logs.inventory_logs_pkey
alter table inventory_logs add constraint inventory_logs_pkey PRIMARY KEY (id);

-- inventory_logs.inventory_logs_purchase_fk
alter table inventory_logs add constraint inventory_logs_purchase_fk FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL;

-- menu_categories.menu_categories_pkey
alter table menu_categories add constraint menu_categories_pkey PRIMARY KEY (id);

-- menu_categories.menu_categories_slug_key
alter table menu_categories add constraint menu_categories_slug_key UNIQUE (slug);

-- menu_items.menu_items_category_id_fkey
alter table menu_items add constraint menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE;

-- menu_items.menu_items_pkey
alter table menu_items add constraint menu_items_pkey PRIMARY KEY (id);

-- menu_items.menu_items_slug_key
alter table menu_items add constraint menu_items_slug_key UNIQUE (slug);

-- notifications.notifications_branch_id_fkey
alter table notifications add constraint notifications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- notifications.notifications_pkey
alter table notifications add constraint notifications_pkey PRIMARY KEY (id);

-- order_items.order_items_menu_item_id_fkey
alter table order_items add constraint order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);

-- order_items.order_items_order_id_fkey
alter table order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- order_items.order_items_pkey
alter table order_items add constraint order_items_pkey PRIMARY KEY (id);

-- order_items.order_items_quantity_check
alter table order_items add constraint order_items_quantity_check CHECK ((quantity > 0));

-- orders.orders_branch_id_fkey
alter table orders add constraint orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);

-- orders.orders_order_number_key
alter table orders add constraint orders_order_number_key UNIQUE (order_number);

-- orders.orders_pkey
alter table orders add constraint orders_pkey PRIMARY KEY (id);

-- profiles.profiles_branch_id_fkey
alter table profiles add constraint profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- profiles.profiles_id_fkey
alter table profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- profiles.profiles_pkey
alter table profiles add constraint profiles_pkey PRIMARY KEY (id);

-- purchases.purchases_branch_id_fkey
alter table purchases add constraint purchases_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- purchases.purchases_pkey
alter table purchases add constraint purchases_pkey PRIMARY KEY (id);

-- reservations.reservations_branch_id_fkey
alter table reservations add constraint reservations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id);

-- reservations.reservations_party_size_check
alter table reservations add constraint reservations_party_size_check CHECK ((party_size > 0));

-- reservations.reservations_pkey
alter table reservations add constraint reservations_pkey PRIMARY KEY (id);

-- reservations.reservations_reservation_number_key
alter table reservations add constraint reservations_reservation_number_key UNIQUE (reservation_number);

-- stock_counts.stock_counts_branch_id_fkey
alter table stock_counts add constraint stock_counts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- stock_counts.stock_counts_inventory_item_id_fkey
alter table stock_counts add constraint stock_counts_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE;

-- stock_counts.stock_counts_pkey
alter table stock_counts add constraint stock_counts_pkey PRIMARY KEY (id);

-- viomi.bookings.bookings_booking_number_key
alter table viomi.bookings add constraint bookings_booking_number_key UNIQUE (booking_number);

-- viomi.bookings.bookings_kind_check
alter table viomi.bookings add constraint bookings_kind_check CHECK ((kind = ANY (ARRAY['home'::text, 'video'::text, 'call'::text])));

-- viomi.bookings.bookings_pkey
alter table viomi.bookings add constraint bookings_pkey PRIMARY KEY (id);

-- viomi.bookings.bookings_status_check
alter table viomi.bookings add constraint bookings_status_check CHECK ((status = ANY (ARRAY['requested'::text, 'confirmed'::text, 'done'::text, 'cancelled'::text])));

-- viomi.config.config_pkey
alter table viomi.config add constraint config_pkey PRIMARY KEY (key);

-- viomi.order_items.order_items_order_id_fkey
alter table viomi.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES viomi.orders(id) ON DELETE CASCADE;

-- viomi.order_items.order_items_pkey
alter table viomi.order_items add constraint order_items_pkey PRIMARY KEY (id);

-- viomi.order_items.order_items_product_id_fkey
alter table viomi.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES viomi.products(id);

-- viomi.order_items.order_items_quantity_check
alter table viomi.order_items add constraint order_items_quantity_check CHECK (((quantity >= 1) AND (quantity <= 9)));

-- viomi.orders.orders_address_check
alter table viomi.orders add constraint orders_address_check CHECK ((length(TRIM(BOTH FROM address)) > 0));

-- viomi.orders.orders_customer_email_check
alter table viomi.orders add constraint orders_customer_email_check CHECK ((customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text));

-- viomi.orders.orders_customer_name_check
alter table viomi.orders add constraint orders_customer_name_check CHECK ((length(TRIM(BOTH FROM customer_name)) > 0));

-- viomi.orders.orders_customer_phone_check
alter table viomi.orders add constraint orders_customer_phone_check CHECK ((length(TRIM(BOTH FROM customer_phone)) >= 7));

-- viomi.orders.orders_order_number_key
alter table viomi.orders add constraint orders_order_number_key UNIQUE (order_number);

-- viomi.orders.orders_payment_method_check
alter table viomi.orders add constraint orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['gcash'::text, 'maya'::text, 'bdo'::text, 'card'::text])));

-- viomi.orders.orders_pkey
alter table viomi.orders add constraint orders_pkey PRIMARY KEY (id);

-- viomi.products.products_pkey
alter table viomi.products add constraint products_pkey PRIMARY KEY (id);

-- viomi.products.products_price_check
alter table viomi.products add constraint products_price_check CHECK ((price > (0)::numeric));

-- ===== Indexes (15) =====
-- public.audit_reports_idx
CREATE INDEX audit_reports_idx ON public.audit_reports USING btree (branch_id, created_at DESC);

-- public.inventory_items_branch_id_idx
CREATE INDEX inventory_items_branch_id_idx ON public.inventory_items USING btree (branch_id);

-- public.inventory_logs_branch_id_created_at_idx
CREATE INDEX inventory_logs_branch_id_created_at_idx ON public.inventory_logs USING btree (branch_id, created_at DESC);

-- public.notifications_branch_id_created_at_idx
CREATE INDEX notifications_branch_id_created_at_idx ON public.notifications USING btree (branch_id, created_at DESC);

-- public.order_items_order_id_idx
CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);

-- public.orders_branch_id_created_at_idx
CREATE INDEX orders_branch_id_created_at_idx ON public.orders USING btree (branch_id, created_at DESC);

-- public.orders_status_idx
CREATE INDEX orders_status_idx ON public.orders USING btree (status);

-- public.profiles_branch_id_idx
CREATE INDEX profiles_branch_id_idx ON public.profiles USING btree (branch_id);

-- public.purchases_branch_idx
CREATE INDEX purchases_branch_idx ON public.purchases USING btree (branch_id, received_at DESC);

-- public.reservations_branch_id_reserved_at_idx
CREATE INDEX reservations_branch_id_reserved_at_idx ON public.reservations USING btree (branch_id, reserved_at);

-- public.stock_counts_branch_idx
CREATE INDEX stock_counts_branch_idx ON public.stock_counts USING btree (branch_id, counted_at DESC);

-- viomi.order_items_order_id_idx
CREATE INDEX order_items_order_id_idx ON viomi.order_items USING btree (order_id);

-- viomi.orders_courier_email_idx
CREATE INDEX orders_courier_email_idx ON viomi.orders USING btree (courier_email);

-- viomi.orders_created_at_idx
CREATE INDEX orders_created_at_idx ON viomi.orders USING btree (created_at DESC);

-- viomi.orders_status_idx
CREATE INDEX orders_status_idx ON viomi.orders USING btree (status);

-- ===== Row level security (20) =====
-- public.audit_reports
alter table public.audit_reports enable row level security;

-- public.branch_menu_items
alter table public.branch_menu_items enable row level security;

-- public.branches
alter table public.branches enable row level security;

-- public.counters
alter table public.counters enable row level security;

-- public.inventory_items
alter table public.inventory_items enable row level security;

-- public.inventory_logs
alter table public.inventory_logs enable row level security;

-- public.menu_categories
alter table public.menu_categories enable row level security;

-- public.menu_items
alter table public.menu_items enable row level security;

-- public.notifications
alter table public.notifications enable row level security;

-- public.order_items
alter table public.order_items enable row level security;

-- public.orders
alter table public.orders enable row level security;

-- public.profiles
alter table public.profiles enable row level security;

-- public.purchases
alter table public.purchases enable row level security;

-- public.reservations
alter table public.reservations enable row level security;

-- public.stock_counts
alter table public.stock_counts enable row level security;

-- viomi.bookings
alter table viomi.bookings enable row level security;

-- viomi.config
alter table viomi.config enable row level security;

-- viomi.order_items
alter table viomi.order_items enable row level security;

-- viomi.orders
alter table viomi.orders enable row level security;

-- viomi.products
alter table viomi.products enable row level security;

-- ===== Policies (26) =====
-- public.audit_reports.audit reports insert
create policy "audit reports insert" on public.audit_reports as PERMISSIVE for INSERT to public with check ((((branch_id IS NULL) AND is_super()) OR is_admin_of(branch_id)));

-- public.audit_reports.audit reports read
create policy "audit reports read" on public.audit_reports as PERMISSIVE for SELECT to public using ((((branch_id IS NULL) AND is_super()) OR is_staff_of(branch_id)));

-- public.branch_menu_items.bmi admin write
create policy "bmi admin write" on public.branch_menu_items as PERMISSIVE for ALL to public using (is_admin_of(branch_id)) with check (is_admin_of(branch_id));

-- public.branch_menu_items.bmi public read
create policy "bmi public read" on public.branch_menu_items as PERMISSIVE for SELECT to public using (true);

-- public.branches.branches admin update
create policy "branches admin update" on public.branches as PERMISSIVE for UPDATE to public using (is_admin_of(id)) with check (is_admin_of(id));

-- public.branches.branches public read
create policy "branches public read" on public.branches as PERMISSIVE for SELECT to public using (true);

-- public.counters.counters no access
create policy "counters no access" on public.counters as PERMISSIVE for SELECT to public using (false);

-- public.inventory_items.inventory staff read
create policy "inventory staff read" on public.inventory_items as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- public.inventory_items.inventory staff write
create policy "inventory staff write" on public.inventory_items as PERMISSIVE for ALL to public using (is_staff_of(branch_id)) with check (is_staff_of(branch_id));

-- public.inventory_logs.inventory logs read
create policy "inventory logs read" on public.inventory_logs as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- public.menu_categories.categories public read
create policy "categories public read" on public.menu_categories as PERMISSIVE for SELECT to public using (true);

-- public.menu_categories.categories super write
create policy "categories super write" on public.menu_categories as PERMISSIVE for ALL to public using (is_super()) with check (is_super());

-- public.menu_items.items public read
create policy "items public read" on public.menu_items as PERMISSIVE for SELECT to public using (true);

-- public.menu_items.items super write
create policy "items super write" on public.menu_items as PERMISSIVE for ALL to public using (is_super()) with check (is_super());

-- public.notifications.notifications staff read
create policy "notifications staff read" on public.notifications as PERMISSIVE for SELECT to public using ((((branch_id IS NULL) AND is_super()) OR is_staff_of(branch_id)));

-- public.notifications.notifications staff update
create policy "notifications staff update" on public.notifications as PERMISSIVE for UPDATE to public using ((((branch_id IS NULL) AND is_super()) OR is_staff_of(branch_id))) with check (true);

-- public.order_items.order items staff read
create policy "order items staff read" on public.order_items as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND is_staff_of(o.branch_id)))));

-- public.orders.orders staff read
create policy "orders staff read" on public.orders as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- public.orders.orders staff update
create policy "orders staff update" on public.orders as PERMISSIVE for UPDATE to public using (is_staff_of(branch_id)) with check (is_staff_of(branch_id));

-- public.profiles.profile admin read
create policy "profile admin read" on public.profiles as PERMISSIVE for SELECT to public using ((is_admin_of(branch_id) OR is_super()));

-- public.profiles.profile self read
create policy "profile self read" on public.profiles as PERMISSIVE for SELECT to public using ((id = auth.uid()));

-- public.purchases.purchases staff read
create policy "purchases staff read" on public.purchases as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- public.purchases.purchases staff update
create policy "purchases staff update" on public.purchases as PERMISSIVE for UPDATE to public using (is_staff_of(branch_id)) with check (is_staff_of(branch_id));

-- public.reservations.reservations staff read
create policy "reservations staff read" on public.reservations as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- public.reservations.reservations staff update
create policy "reservations staff update" on public.reservations as PERMISSIVE for UPDATE to public using (is_staff_of(branch_id)) with check (is_staff_of(branch_id));

-- public.stock_counts.counts staff read
create policy "counts staff read" on public.stock_counts as PERMISSIVE for SELECT to public using (is_staff_of(branch_id));

-- ===== Functions (26) =====
-- public.adjust_inventory
CREATE OR REPLACE FUNCTION public.adjust_inventory(p_item uuid, p_delta numeric, p_reason text DEFAULT NULL::text, p_order uuid DEFAULT NULL::uuid, p_kind text DEFAULT 'adjustment'::text, p_unit_cost numeric DEFAULT NULL::numeric)
 RETURNS inventory_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v public.inventory_items%rowtype;
begin
  select * into v from public.inventory_items where id = p_item;
  if v.id is null then raise exception 'Item not found'; end if;
  if not public.is_staff_of(v.branch_id) then raise exception 'Not allowed'; end if;
  if p_kind not in ('delivery','consumption','spoilage','transfer','adjustment','audit') then raise exception 'Bad movement kind'; end if;
  update public.inventory_items set quantity = greatest(0, quantity + p_delta), updated_at = now(), updated_by = auth.uid(),
    unit_cost = case when p_kind = 'delivery' and p_unit_cost is not null and p_unit_cost > 0 then p_unit_cost else unit_cost end
  where id = p_item returning * into v;
  insert into public.inventory_logs(inventory_item_id, branch_id, delta, quantity_after, reason, order_id, user_id, kind, unit_cost)
  values (p_item, v.branch_id, p_delta, v.quantity, p_reason, p_order, auth.uid(), p_kind, coalesce(p_unit_cost, v.unit_cost));
  if v.quantity <= v.low_threshold then
    insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
    values (v.branch_id, '{admin,inventory}', 'inventory_low', 'Low stock: ' || v.name,
      'Only ' || trim(to_char(v.quantity,'FM999,999,990.###')) || ' ' || v.unit::text || ' left.', '/admin/inventory', v.id);
  end if;
  return v;
end $function$
;

-- public.create_reservation
CREATE OR REPLACE FUNCTION public.create_reservation(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_branch public.branches%rowtype;
  v_res public.reservations%rowtype;
  v_num bigint;
  v_status public.reservation_status := 'pending';
begin
  select * into v_branch from public.branches where slug = payload->>'branch_slug' and is_active;
  if v_branch.id is null then raise exception 'Branch not found'; end if;
  if not v_branch.accepts_reservations then raise exception 'This branch is not taking reservations right now'; end if;
  if coalesce(payload->>'customer_name','') = '' or coalesce(payload->>'customer_phone','') = '' then raise exception 'Name and phone are required'; end if;
  if (payload->>'reserved_at')::timestamptz < now() then raise exception 'Please pick a future time'; end if;
  if v_branch.reservation_auto_accept then v_status := 'confirmed'; end if;
  v_num := public.next_counter(v_branch.id, 'reservation');
  insert into public.reservations(reservation_number, branch_id, customer_name, customer_phone, customer_email, party_size, reserved_at, status, notes)
  values ('RV-' || v_branch.code || '-' || lpad(v_num::text,5,'0'), v_branch.id, payload->>'customer_name', payload->>'customer_phone',
    nullif(payload->>'customer_email',''), greatest(1, least(60, coalesce((payload->>'party_size')::int,2))), (payload->>'reserved_at')::timestamptz, v_status, nullif(payload->>'notes',''))
  returning * into v_res;
  insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
  values (v_branch.id, '{admin,cashier}', 'reservation',
    case when v_status = 'confirmed' then 'Reservation auto-confirmed ' else 'Reservation request ' end || v_res.reservation_number,
    v_res.customer_name || ' · party of ' || v_res.party_size || ' · ' || to_char(v_res.reserved_at at time zone 'Asia/Manila','Mon DD, HH12:MI AM'),
    '/admin/reservations', v_res.id);
  return jsonb_build_object('id', v_res.id, 'reservation_number', v_res.reservation_number, 'status', v_res.status,
    'customer_name', v_res.customer_name, 'customer_email', v_res.customer_email, 'customer_phone', v_res.customer_phone,
    'party_size', v_res.party_size, 'reserved_at', v_res.reserved_at, 'notes', v_res.notes,
    'branch', jsonb_build_object('id', v_branch.id, 'name', v_branch.name, 'slug', v_branch.slug, 'address', v_branch.address, 'phone', v_branch.phone, 'email', v_branch.email, 'auto', v_branch.reservation_auto_accept));
end $function$
;

-- public.decide_staff
CREATE OR REPLACE FUNCTION public.decide_staff(p_user uuid, p_status staff_status, p_role staff_role DEFAULT NULL::staff_role)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v public.profiles%rowtype;
begin
  select * into v from public.profiles where id = p_user;
  if v.id is null then raise exception 'Profile not found'; end if;
  if not public.is_admin_of(v.branch_id) then raise exception 'Not allowed'; end if;
  if p_role = 'super_admin' and not public.is_super() then raise exception 'Only the owner can grant super admin'; end if;
  update public.profiles set status = p_status, role = coalesce(p_role, role), approved_by = auth.uid(), approved_at = now()
  where id = p_user returning * into v;
  return v;
end $function$
;

-- public.handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_branch public.branches%rowtype;
  v_code text := coalesce(new.raw_user_meta_data->>'registration_code','');
  v_slug text := coalesce(new.raw_user_meta_data->>'branch_slug','');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
  v_role public.staff_role := 'staff';
begin
  if new.raw_user_meta_data->>'seed' = 'true' then
    return new;
  end if;
  select * into v_branch from public.branches where slug = v_slug;
  if v_branch.id is null then
    raise exception 'Unknown branch';
  end if;
  if v_code = '' or v_code <> v_branch.registration_code then
    raise exception 'Invalid registration code for %', v_branch.name;
  end if;
  begin
    v_role := coalesce(nullif(new.raw_user_meta_data->>'requested_role',''),'staff')::public.staff_role;
  exception when others then v_role := 'staff';
  end;
  if v_role in ('super_admin','admin') then v_role := 'staff'; end if;
  insert into public.profiles(id, full_name, email, phone, role, status, branch_id)
  values (new.id, v_name, new.email, new.raw_user_meta_data->>'phone', v_role, 'pending', v_branch.id);
  insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
  values (v_branch.id, '{admin}', 'registration', 'New staff registration', v_name || ' is requesting access as ' || v_role::text || '.', '/admin/staff', new.id);
  return new;
end $function$
;

-- public.is_admin_of
CREATE OR REPLACE FUNCTION public.is_admin_of(b uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
      and (p.role = 'super_admin' or (p.role = 'admin' and p.branch_id = b))
  );
$function$
;

-- public.is_staff_of
CREATE OR REPLACE FUNCTION public.is_staff_of(b uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
      and (p.role = 'super_admin' or p.branch_id = b)
  );
$function$
;

-- public.is_super
CREATE OR REPLACE FUNCTION public.is_super()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin' and p.status = 'approved');
$function$
;

-- public.next_counter
CREATE OR REPLACE FUNCTION public.next_counter(b uuid, k text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v bigint;
begin
  insert into public.counters(branch_id, kind, value) values (b, k, 1)
  on conflict (branch_id, kind) do update set value = public.counters.value + 1
  returning value into v;
  return v;
end $function$
;

-- public.order_status_stamps
CREATE OR REPLACE FUNCTION public.order_status_stamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' and new.confirmed_at is null then new.confirmed_at = now(); end if;
    if new.status = 'preparing' and new.preparing_at is null then new.preparing_at = now(); end if;
    if new.status = 'ready' and new.ready_at is null then new.ready_at = now(); end if;
    if new.status = 'out_for_delivery' and new.dispatched_at is null then new.dispatched_at = now(); end if;
    if new.status = 'completed' and new.completed_at is null then new.completed_at = now(); end if;
    if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at = now(); end if;
  end if;
  return new;
end $function$
;

-- public.place_order
CREATE OR REPLACE FUNCTION public.place_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_branch public.branches%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_subtotal numeric := 0;
  v_fee numeric := 0;
  v_type public.order_type := (payload->>'type')::public.order_type;
  v_qty int;
  v_line numeric;
  v_num bigint;
  v_items jsonb := '[]'::jsonb;
begin
  select * into v_branch from public.branches where slug = payload->>'branch_slug' and is_active;
  if v_branch.id is null then raise exception 'Branch not found'; end if;
  if v_type = 'delivery' and not v_branch.accepts_delivery then raise exception 'This branch does not deliver right now'; end if;
  if v_type = 'pickup' and not v_branch.accepts_pickup then raise exception 'This branch does not accept pickup right now'; end if;
  if jsonb_array_length(coalesce(payload->'items','[]'::jsonb)) = 0 then raise exception 'Your cart is empty'; end if;
  if coalesce(payload->>'customer_name','') = '' or coalesce(payload->>'customer_phone','') = '' then raise exception 'Name and phone are required'; end if;
  if v_type = 'delivery' and coalesce(payload->>'delivery_address','') = '' then raise exception 'Delivery address is required'; end if;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_menu from public.menu_items where id = (v_item->>'menu_item_id')::uuid and is_available;
    if v_menu.id is null then raise exception 'An item in your cart is no longer available'; end if;
    v_qty := greatest(1, least(50, coalesce((v_item->>'quantity')::int,1)));
    v_line := v_menu.price * v_qty;
    v_subtotal := v_subtotal + v_line;
    v_items := v_items || jsonb_build_object('menu_item_id', v_menu.id, 'name', v_menu.name, 'unit_price', v_menu.price, 'quantity', v_qty, 'line_total', v_line, 'notes', v_item->>'notes');
  end loop;

  if v_type = 'delivery' then v_fee := v_branch.delivery_fee; end if;
  v_num := public.next_counter(v_branch.id, 'order');

  insert into public.orders(order_number, branch_id, type, customer_name, customer_phone, customer_email,
    delivery_address, delivery_landmark, pickup_time, payment_method, payment_status, receipt_path, subtotal, delivery_fee, total, notes)
  values (
    'JT-' || v_branch.code || '-' || lpad(v_num::text, 5, '0'), v_branch.id, v_type,
    payload->>'customer_name', payload->>'customer_phone', nullif(payload->>'customer_email',''),
    nullif(payload->>'delivery_address',''), nullif(payload->>'delivery_landmark',''),
    nullif(payload->>'pickup_time','')::timestamptz,
    (payload->>'payment_method')::public.payment_method,
    case when (payload->>'payment_method') = 'cod' then 'unpaid' else 'pending_verification' end::public.payment_status,
    nullif(payload->>'receipt_path',''), v_subtotal, v_fee, v_subtotal + v_fee, nullif(payload->>'notes','')
  ) returning * into v_order;

  insert into public.order_items(order_id, menu_item_id, name, unit_price, quantity, line_total, notes)
  select v_order.id, (i->>'menu_item_id')::uuid, i->>'name', (i->>'unit_price')::numeric, (i->>'quantity')::int, (i->>'line_total')::numeric, i->>'notes'
  from jsonb_array_elements(v_items) i;

  insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
  values (v_branch.id, '{admin,cashier}', 'order',
    'New ' || v_type::text || ' order ' || v_order.order_number,
    v_order.customer_name || ' · ₱' || to_char(v_order.total,'FM999,999,990') || ' · ' || upper(v_order.payment_method::text),
    '/admin/orders/' || v_order.id, v_order.id);
  insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
  values (v_branch.id, '{admin,inventory}', 'inventory',
    'Adjust inventory for ' || v_order.order_number,
    jsonb_array_length(v_items)::text || ' line item(s) ordered. Deduct stock used.',
    '/admin/inventory?order=' || v_order.id, v_order.id);
  if v_type = 'delivery' then
    insert into public.notifications(branch_id, audience, kind, title, body, href, ref_id)
    values (v_branch.id, '{admin,cashier}', 'delivery',
      'Delivery to dispatch ' || v_order.order_number, v_order.delivery_address, '/admin/deliveries', v_order.id);
  end if;

  return jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number, 'tracking_token', v_order.tracking_token,
    'total', v_order.total, 'subtotal', v_order.subtotal, 'delivery_fee', v_order.delivery_fee,
    'type', v_order.type, 'payment_method', v_order.payment_method, 'payment_status', v_order.payment_status,
    'customer_name', v_order.customer_name, 'customer_email', v_order.customer_email, 'customer_phone', v_order.customer_phone,
    'delivery_address', v_order.delivery_address, 'pickup_time', v_order.pickup_time, 'notes', v_order.notes,
    'branch', jsonb_build_object('id', v_branch.id, 'name', v_branch.name, 'slug', v_branch.slug, 'address', v_branch.address, 'phone', v_branch.phone, 'email', v_branch.email, 'courier_emails', v_branch.courier_emails),
    'items', v_items
  );
end $function$
;

-- public.receive_delivery
CREATE OR REPLACE FUNCTION public.receive_delivery(p_branch uuid, p_supplier text, p_category text, p_reference text, p_notes text, p_items jsonb)
 RETURNS purchases
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.purchases%rowtype; it jsonb; v public.inventory_items%rowtype; q numeric; uc numeric; tot numeric := 0;
begin
  if not public.is_staff_of(p_branch) then raise exception 'Not allowed'; end if;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then raise exception 'No items'; end if;
  insert into public.purchases(branch_id, supplier, category, reference, notes, user_id) values (p_branch, coalesce(nullif(p_supplier,''),'Supplier'), nullif(p_category,''), nullif(p_reference,''), nullif(p_notes,''), auth.uid()) returning * into p;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into v from public.inventory_items where id = (it->>'item_id')::uuid and branch_id = p_branch;
    if v.id is null then raise exception 'Item not in this branch'; end if;
    q := coalesce((it->>'qty')::numeric, 0); uc := coalesce((it->>'unit_cost')::numeric, v.unit_cost);
    if q <= 0 then continue; end if;
    tot := tot + q * uc;
    update public.inventory_items set quantity = quantity + q, unit_cost = case when uc > 0 then uc else unit_cost end, updated_at = now(), updated_by = auth.uid() where id = v.id returning * into v;
    insert into public.inventory_logs(inventory_item_id, branch_id, delta, quantity_after, reason, user_id, kind, unit_cost, purchase_id)
    values (v.id, p_branch, q, v.quantity, 'Delivery from ' || p.supplier, auth.uid(), 'delivery', uc, p.id);
  end loop;
  update public.purchases set total = tot where id = p.id returning * into p;
  return p;
end $function$
;

-- public.record_stock_count
CREATE OR REPLACE FUNCTION public.record_stock_count(p_item uuid, p_counted numeric, p_remarks text DEFAULT NULL::text)
 RETURNS stock_counts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v public.inventory_items%rowtype; c public.stock_counts%rowtype; d numeric;
begin
  select * into v from public.inventory_items where id = p_item;
  if v.id is null then raise exception 'Item not found'; end if;
  if not public.is_staff_of(v.branch_id) then raise exception 'Not allowed'; end if;
  d := p_counted - v.quantity;
  insert into public.stock_counts(branch_id, inventory_item_id, system_qty, counted_qty, variance, remarks, user_id)
  values (v.branch_id, v.id, v.quantity, p_counted, d, nullif(p_remarks,''), auth.uid()) returning * into c;
  if d <> 0 then
    update public.inventory_items set quantity = p_counted, updated_at = now(), updated_by = auth.uid() where id = v.id;
    insert into public.inventory_logs(inventory_item_id, branch_id, delta, quantity_after, reason, user_id, kind, unit_cost)
    values (v.id, v.branch_id, d, p_counted, coalesce('Audit count: ' || nullif(p_remarks,''), 'Audit count'), auth.uid(), 'audit', v.unit_cost);
  end if;
  return c;
end $function$
;

-- public.reservation_stamps
CREATE OR REPLACE FUNCTION public.reservation_stamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.status is distinct from old.status then
    if new.status in ('confirmed','declined') and new.decided_at is null then new.decided_at = now(); end if;
    if new.status = 'seated' and new.seated_at is null then new.seated_at = now(); end if;
  end if;
  return new;
end $function$
;

-- public.touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at = now(); return new; end $function$
;

-- public.track_order
CREATE OR REPLACE FUNCTION public.track_order(p_number text, p_token text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'type', o.type, 'payment_status', o.payment_status,
    'payment_method', o.payment_method, 'total', o.total, 'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee,
    'customer_name', o.customer_name, 'delivery_address', o.delivery_address, 'pickup_time', o.pickup_time,
    'created_at', o.created_at, 'branch', jsonb_build_object('name', b.name, 'address', b.address, 'phone', b.phone),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'line_total', i.line_total)), '[]'::jsonb) from public.order_items i where i.order_id = o.id)
  )
  from public.orders o join public.branches b on b.id = o.branch_id
  where o.order_number = upper(p_number) and o.tracking_token = p_token;
$function$
;

-- public.viomi_admin_list
CREATE OR REPLACE FUNCTION public.viomi_admin_list(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not viomi.check_key(p_key, 'admin_key') then raise exception 'unauthorized'; end if;
  return jsonb_build_object(
    'orders', coalesce((select jsonb_agg(viomi.order_json(o) order by o.created_at desc)
      from (select * from viomi.orders order by created_at desc limit 300) o), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg(to_jsonb(b) order by b.scheduled_at)
      from (select * from viomi.bookings order by scheduled_at limit 200) b), '[]'::jsonb));
end $function$
;

-- public.viomi_admin_update_booking
CREATE OR REPLACE FUNCTION public.viomi_admin_update_booking(p_key text, p_id uuid, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare b viomi.bookings;
begin
  if not viomi.check_key(p_key, 'admin_key') then raise exception 'unauthorized'; end if;
  update viomi.bookings set status = p_status where id = p_id returning * into b;
  if b.id is null then raise exception 'not found'; end if;
  return to_jsonb(b);
end $function$
;

-- public.viomi_admin_update_order
CREATE OR REPLACE FUNCTION public.viomi_admin_update_order(p_key text, p_id uuid, p_status text, p_courier_email text DEFAULT NULL::text, p_courier_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o viomi.orders;
begin
  if not viomi.check_key(p_key, 'admin_key') then raise exception 'unauthorized'; end if;
  update viomi.orders set
    status = coalesce(p_status, status::text)::viomi.order_status,
    courier_email = coalesce(lower(trim(nullif(p_courier_email, ''))), courier_email),
    courier_name = coalesce(nullif(trim(p_courier_name), ''), courier_name),
    dispatched_at = case when p_status = 'out_for_delivery' and dispatched_at is null then now() else dispatched_at end,
    delivered_at = case when p_status in ('delivered','installed') and delivered_at is null then now() else delivered_at end,
    updated_at = now()
  where id = p_id
  returning * into o;
  if o.id is null then raise exception 'not found'; end if;
  return jsonb_build_object('order', viomi.order_json(o));
end $function$
;

-- public.viomi_courier_list
CREATE OR REPLACE FUNCTION public.viomi_courier_list(p_key text, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not viomi.check_key(p_key, 'courier_key') then raise exception 'unauthorized'; end if;
  return jsonb_build_object('deliveries', coalesce((
    select jsonb_agg(viomi.order_json(o) order by o.updated_at desc)
    from viomi.orders o
    where o.courier_email = lower(trim(p_email))
      and (o.status in ('confirmed','preparing','out_for_delivery')
           or (o.status in ('delivered','installed') and o.delivered_at > now() - interval '1 day'))
  ), '[]'::jsonb));
end $function$
;

-- public.viomi_courier_update
CREATE OR REPLACE FUNCTION public.viomi_courier_update(p_key text, p_email text, p_id uuid, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o viomi.orders;
begin
  if not viomi.check_key(p_key, 'courier_key') then raise exception 'unauthorized'; end if;
  if p_status not in ('out_for_delivery','delivered') then raise exception 'bad status'; end if;
  update viomi.orders set
    status = p_status::viomi.order_status,
    dispatched_at = case when p_status = 'out_for_delivery' and dispatched_at is null then now() else dispatched_at end,
    delivered_at = case when p_status = 'delivered' and delivered_at is null then now() else delivered_at end,
    updated_at = now()
  where id = p_id and courier_email = lower(trim(p_email))
  returning * into o;
  if o.id is null then raise exception 'not found'; end if;
  return jsonb_build_object('order', viomi.order_json(o));
end $function$
;

-- public.viomi_create_booking
CREATE OR REPLACE FUNCTION public.viomi_create_booking(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v viomi.bookings;
begin
  insert into viomi.bookings (booking_number, kind, unit, scheduled_at, slot, customer_name, customer_phone, customer_email)
  values (viomi.ref('VB'), payload->>'kind', left(payload->>'unit', 60), (payload->>'scheduled_at')::timestamptz,
          left(payload->>'slot', 20), left(trim(payload->>'customer_name'), 120), left(trim(payload->>'customer_phone'), 40),
          nullif(lower(left(trim(payload->>'customer_email'), 200)), ''))
  returning * into v;
  return jsonb_build_object('id', v.id, 'booking_number', v.booking_number);
end $function$
;

-- public.viomi_place_order
CREATE OR REPLACE FUNCTION public.viomi_place_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_order viomi.orders;
  v_item jsonb;
  v_prod viomi.products;
  v_qty int;
  v_subtotal numeric := 0;
begin
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') not between 1 and 20 then
    raise exception 'Your bag is empty';
  end if;
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    select * into v_prod from viomi.products p where p.id = v_item->>'product_id' and p.active;
    if v_prod.id is null then raise exception 'Unknown product %', v_item->>'product_id'; end if;
    v_qty := least(9, greatest(1, coalesce((v_item->>'quantity')::int, 1)));
    v_subtotal := v_subtotal + v_prod.price * v_qty;
  end loop;

  insert into viomi.orders (order_number, payment_method, customer_name, customer_email, customer_phone, address, city, subtotal, total, notes)
  values (viomi.ref('VM'), payload->>'payment_method',
          left(trim(payload->>'customer_name'), 120), lower(left(trim(payload->>'customer_email'), 200)),
          left(trim(payload->>'customer_phone'), 40), left(trim(payload->>'address'), 400),
          left(coalesce(nullif(trim(payload->>'city'), ''), 'Metro Manila'), 120),
          v_subtotal, v_subtotal, nullif(left(payload->>'notes', 1000), ''))
  returning * into v_order;

  insert into viomi.order_items (order_id, product_id, name, unit_price, quantity, line_total)
  select v_order.id, p.id, p.name, p.price, q.qty, p.price * q.qty
  from jsonb_array_elements(payload->'items') i
  cross join lateral (select least(9, greatest(1, coalesce((i->>'quantity')::int, 1))) as qty) q
  join viomi.products p on p.id = i->>'product_id';

  return viomi.order_json(v_order);
end $function$
;

-- public.viomi_track_order
CREATE OR REPLACE FUNCTION public.viomi_track_order(p_number text, p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o viomi.orders;
begin
  select * into o from viomi.orders where order_number = p_number and tracking_token = p_token;
  if o.id is null then return null; end if;
  return jsonb_build_object('order_number', o.order_number, 'status', o.status, 'total', o.total,
    'created_at', o.created_at, 'updated_at', o.updated_at,
    'dispatched_at', o.dispatched_at, 'delivered_at', o.delivered_at,
    'courier_name', o.courier_name, 'city', o.city,
    'items', (viomi.order_json(o))->'items');
end $function$
;

-- viomi.check_key
CREATE OR REPLACE FUNCTION viomi.check_key(p_key text, p_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select exists (select 1 from viomi.config c where c.key = p_name and p_key is not null and c.value = p_key);
$function$
;

-- viomi.order_json
CREATE OR REPLACE FUNCTION viomi.order_json(o viomi.orders)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select to_jsonb(o) || jsonb_build_object('items',
    (select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity,
       'line_total', i.line_total, 'unit_price', i.unit_price)), '[]'::jsonb)
     from viomi.order_items i where i.order_id = o.id));
$function$
;

-- viomi.ref
CREATE OR REPLACE FUNCTION viomi.ref(p_prefix text)
 RETURNS text
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select p_prefix || '-' || to_char(now() at time zone 'Asia/Manila', 'YYMMDD') || '-' ||
         upper(substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 4));
$function$
;

-- ===== Triggers (3) =====
-- public.orders.orders_status_stamps
CREATE TRIGGER orders_status_stamps BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION order_status_stamps();

-- public.orders.orders_touch
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- public.reservations.reservations_stamps
CREATE TRIGGER reservations_stamps BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION reservation_stamps();

-- ===== Schema grants (1) =====
-- viomi
grant usage on schema viomi to anon, authenticated, service_role;

-- ===== Storage buckets (2) =====
-- menu
insert into storage.buckets (id,name,public) values ('menu','menu',true) on conflict do nothing;

-- receipts
insert into storage.buckets (id,name,public) values ('receipts','receipts',false) on conflict do nothing;

-- ===== Storage policies (4) =====
-- menu public read
create policy "menu public read" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'menu'::text));

-- menu super write
create policy "menu super write" on storage.objects as PERMISSIVE for ALL to authenticated using (((bucket_id = 'menu'::text) AND is_super())) with check (((bucket_id = 'menu'::text) AND is_super()));

-- receipts anon upload
create policy "receipts anon upload" on storage.objects as PERMISSIVE for INSERT to anon, authenticated with check ((bucket_id = 'receipts'::text));

-- receipts staff read
create policy "receipts staff read" on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'receipts'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.status = 'approved'::staff_status))))));

