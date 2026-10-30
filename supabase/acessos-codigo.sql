-- Convite por código de uso único (sem depender de e-mail).
-- 1) um administrador convida um e-mail e recebe um código (vale 7 dias, aparece uma vez);
-- 2) a pessoa cria a senha no painel informando e-mail + código;
-- 3) redeem_invite confere e-mail e código e só então concede acesso.
-- Ordem importa: o gatilho antigo (promoção só por e-mail) sai ANTES de qualquer outra coisa.

drop trigger if exists promote_invited_admin on auth.users;
drop function if exists public.promote_invited_admin();

alter table public.admin_invites add column if not exists code_hash text;
alter table public.admin_invites add column if not exists expires_at timestamptz not null default now() + interval '7 days';
delete from public.admin_invites where code_hash is null;

create or replace function public.invite_admin(p_email text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  e text := lower(trim(p_email));
  raw text;
begin
  if not public.is_admin() then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email_invalido';
  end if;
  if exists (select 1 from public.admins where lower(email) = e) then
    raise exception 'ja_admin';
  end if;
  raw := left(replace(gen_random_uuid()::text, '-', ''), 20);
  insert into public.admin_invites(email, invited_by, code_hash, expires_at)
    values (e, auth.uid(), encode(sha256(convert_to(raw, 'UTF8')), 'hex'), now() + interval '7 days')
    on conflict (email) do update
      set code_hash = excluded.code_hash,
          expires_at = excluded.expires_at,
          invited_by = excluded.invited_by,
          created_at = now();
  return substr(raw,1,4) || '-' || substr(raw,5,4) || '-' || substr(raw,9,4) || '-'
      || substr(raw,13,4) || '-' || substr(raw,17,4);
end $$;
revoke all on function public.invite_admin(text) from public, anon;
grant execute on function public.invite_admin(text) to authenticated;

create or replace function public.redeem_invite(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  e text := lower(coalesce(auth.jwt() ->> 'email', ''));
  c text := lower(regexp_replace(coalesce(p_code, ''), '[^0-9a-fA-F]', '', 'g'));
  uid uuid := auth.uid();
begin
  if uid is null or e = '' then
    raise exception 'sem_sessao' using errcode = '42501';
  end if;
  perform 1 from public.admin_invites
    where email = e
      and expires_at > now()
      and code_hash = encode(sha256(convert_to(c, 'UTF8')), 'hex')
    for update;
  if not found then
    raise exception 'codigo_invalido';
  end if;
  insert into public.admins(user_id, email) values (uid, e) on conflict (user_id) do nothing;
  delete from public.admin_invites where email = e;
  return true;
end $$;
revoke all on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- Limpeza: conta de diagnóstico e contas que ficaram sem confirmação por causa do limite de e-mails.
delete from auth.users where lower(email) = 'diagnostico-uryu-9f3k@mailinator.com';
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

-- Se algo acima falhar, nada é aplicado (script atômico). Estas checagens garantem o resultado.
do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'promote_invited_admin') then
    raise exception 'gatilho antigo ainda existe';
  end if;
  if not exists (select 1 from pg_proc where proname = 'redeem_invite') then
    raise exception 'redeem_invite não foi criada';
  end if;
end $$;
