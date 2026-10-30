-- Gestão de acessos ao painel: um admin convida um e-mail; quando a pessoa cria a conta
-- e confirma o e-mail, vira admin automaticamente. Rodar uma vez no SQL Editor do Supabase.

alter table public.admins add column if not exists email text;
update public.admins a set email = lower(u.email)
  from auth.users u where u.id = a.user_id and a.email is null;

create table if not exists public.admin_invites (
  email text primary key check (email = lower(email)),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from anon;

drop policy if exists "admin gerencia convites" on public.admin_invites;
create policy "admin gerencia convites" on public.admin_invites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin lista admins" on public.admins;
create policy "admin lista admins" on public.admins
  for select to authenticated using (public.is_admin());
drop policy if exists "admin remove outro admin" on public.admins;
create policy "admin remove outro admin" on public.admins
  for delete to authenticated using (public.is_admin() and user_id <> auth.uid());

create or replace function public.invite_admin(p_email text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  e text := lower(trim(p_email));
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email_invalido';
  end if;
  select id into uid from auth.users
    where lower(email) = e and email_confirmed_at is not null;
  if uid is not null then
    insert into public.admins(user_id, email) values (uid, e) on conflict (user_id) do nothing;
    return 'ativo';
  end if;
  insert into public.admin_invites(email, invited_by) values (e, auth.uid())
    on conflict (email) do nothing;
  return 'convidado';
end $$;
revoke all on function public.invite_admin(text) from public, anon;
grant execute on function public.invite_admin(text) to authenticated;

-- Só promove depois que o e-mail é confirmado, para ninguém tomar um convite alheio.
create or replace function public.promote_invited_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from public.admin_invites where email = lower(new.email)) then
    insert into public.admins(user_id, email) values (new.id, lower(new.email))
      on conflict (user_id) do nothing;
    delete from public.admin_invites where email = lower(new.email);
  end if;
  return new;
end $$;
drop trigger if exists promote_invited_admin on auth.users;
create trigger promote_invited_admin
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.promote_invited_admin();
