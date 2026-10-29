-- Uryu Imóveis no Supabase: catálogo público só lê anúncios publicados (sem notas internas);
-- escrita e leitura completa só para usuários listados em public.admins.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Za-z0-9-]{1,30}$'),
  status text not null default 'rascunho'
    check (status in ('rascunho','publicado','reservado','vendido','alugado','arquivado')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  private_notes text not null default '' check (length(private_notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publicar_exige_descricao_e_foto check (
    status <> 'publicado' or (
      coalesce(payload->>'descricao', '') <> ''
      and jsonb_typeof(payload->'fotos') = 'array'
      and jsonb_array_length(payload->'fotos') > 0
    )
  )
);
create index if not exists properties_status_idx on public.properties(status);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.properties enable row level security;
alter table public.admins enable row level security;

-- Visitantes: só colunas públicas, só anúncios publicados.
revoke all on public.properties from anon;
grant select (id, codigo, status, payload, created_at, updated_at) on public.properties to anon;
drop policy if exists "catalogo publico" on public.properties;
create policy "catalogo publico" on public.properties
  for select to anon, authenticated using (status = 'publicado');

drop policy if exists "admin gerencia imoveis" on public.properties;
create policy "admin gerencia imoveis" on public.properties
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.admins from anon;
drop policy if exists "admin ve a si mesmo" on public.admins;
create policy "admin ve a si mesmo" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Fotos: leitura pública (nomes são UUID aleatórios), escrita só de admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 12582912, array['image/webp','image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin envia fotos" on storage.objects;
create policy "admin envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and public.is_admin());
drop policy if exists "admin altera fotos" on storage.objects;
create policy "admin altera fotos" on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and public.is_admin());
drop policy if exists "admin remove fotos" on storage.objects;
create policy "admin remove fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.is_admin());
