-- ==============================================================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS Y POLÍTICAS (SUPABASE)
-- Copia y pega este script completo en el SQL Editor de tu panel de Supabase
-- ==============================================================================

-- 1. Tabla de Categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz default now()
);

-- 2. Tabla de Productos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  in_stock boolean default true,
  featured boolean default false,
  created_at timestamptz default now()
);

-- 3. Tabla de Cotizaciones / Órdenes
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

-- 4. Habilitar Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- 5. Eliminar políticas previas para evitar duplicados
drop policy if exists "permitir lectura publica categorias" on public.categories;
drop policy if exists "permitir lectura publica productos" on public.products;
drop policy if exists "permitir crud productos" on public.products;
drop policy if exists "admins manage products" on public.products;
drop policy if exists "permitir insertar cotizaciones" on public.orders;
drop policy if exists "customers create quotations" on public.orders;
drop policy if exists "permitir lectura ordenes" on public.orders;
drop policy if exists "admins read orders" on public.orders;

-- 6. Políticas de Acceso (Permitir lectura y administración en el catálogo)
create policy "permitir lectura publica categorias" on public.categories 
  for select using (true);

create policy "permitir lectura publica productos" on public.products 
  for select using (true);

create policy "permitir crud productos" on public.products 
  for all using (true) with check (true);

create policy "permitir insertar cotizaciones" on public.orders 
  for insert with check (true);

create policy "permitir lectura ordenes" on public.orders 
  for select using (true);

-- 7. Configuración del Bucket de Almacenamiento para Imágenes
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images upload" on storage.objects;
drop policy if exists "product images delete" on storage.objects;

create policy "product images public read" on storage.objects 
  for select using (bucket_id = 'product-images');

create policy "product images upload" on storage.objects 
  for insert with check (bucket_id = 'product-images');

create policy "product images delete" on storage.objects 
  for delete using (bucket_id = 'product-images');

-- 8. Datos iniciales de categorías (Seed Data)
insert into public.categories (name, slug, icon) values
  ('Escritura y Corrección', 'escritura-correccion', '✏️'),
  ('Cuadernos y Libretas', 'cuadernos-libretas', '📓'),
  ('Geometría y Dibujo', 'geometria-dibujo', '📐'),
  ('Arte y Manualidades', 'arte-manualidades', '🎨'),
  ('Papelería y Archivo', 'papeleria-archivo', '📂'),
  ('Accesorios Escolares', 'accesorios-escolares', '🎒')
on conflict (name) do nothing;
