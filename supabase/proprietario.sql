-- Proprietário do site: só ele pode remover acessos, e o acesso dele nunca pode ser removido por outro admin.
alter table public.admins add column if not exists is_owner boolean not null default false;
update public.admins set is_owner = true
  where lower(email) = 'estiven.uryu@live.com';

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and is_owner)
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

drop policy if exists "admin remove outro admin" on public.admins;
drop policy if exists "proprietario remove admin" on public.admins;
create policy "proprietario remove admin" on public.admins
  for delete to authenticated
  using (public.is_owner() and not is_owner and user_id <> auth.uid());

do $$
begin
  if not exists (select 1 from public.admins where is_owner) then
    raise exception 'nenhum proprietario definido';
  end if;
end $$;
