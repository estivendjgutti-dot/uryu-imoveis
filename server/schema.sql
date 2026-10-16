create table if not exists properties (
 id uuid primary key,
 codigo text not null unique,
 status text not null default 'rascunho' check (status in ('rascunho','publicado','reservado','vendido','alugado','arquivado')),
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 private_notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists properties_status_idx on properties(status);
create table if not exists media (
 filename text primary key,
 created_at timestamptz not null default now()
);
create table if not exists admin_users (
 id uuid primary key,
 name text not null,
 email text not null unique,
 password_hash text not null,
 session_version uuid not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
