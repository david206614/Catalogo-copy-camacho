-- Execute this script in Supabase SQL Editor before enabling the admin panel.
-- Create the administrator first in Authentication > Users, then run the final INSERT
-- with that user's UUID.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  delivery_method text not null check (delivery_method in ('recogida', 'domicilio')),
  address text,
  notes text,
  items jsonb not null,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'cotizacion' check (status in ('cotizacion', 'pedido')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.products enable row level security;

create policy "admins read profiles" on public.profiles for select using (public.is_admin());
create policy "customers create quotations" on public.orders for insert with check (true);
create policy "admins read orders" on public.orders for select using (public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Replace the UUID with the Auth user id of your administrator.
-- insert into public.profiles (id, role) values ('00000000-0000-0000-0000-000000000000', 'admin');
