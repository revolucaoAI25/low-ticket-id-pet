-- Clube do Focinho · Kit Identidade Pet
-- Rode este arquivo uma vez no Supabase: SQL Editor → New query → colar → Run.
-- Todas as tabelas ficam fechadas para o público (RLS sem políticas):
-- só o servidor do site acessa, com a service role key.

create extension if not exists pgcrypto;

-- Tutor (cada vez que alguém deixa o contato no quiz vira um registro;
-- o pagamento aprovado marca o registro mais recente com aquele e-mail/telefone).
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  name text,
  access_token text unique not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  extra_pet_slots int not null default 0,
  -- order bumps de conteúdo comprados (ids configurados no painel)
  bumps text[] not null default '{}',
  consent_at timestamptz,
  utms jsonb,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_email_idx on customers (lower(email));
create index if not exists customers_phone_idx on customers (phone);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  slug text unique not null,
  data jsonb not null default '{}',
  photo_url text,
  -- Arquivos gerados na confirmação (PDFs, imagens, identidade do QR)
  files jsonb,
  -- Quando a pessoa confirmou os dados e o kit foi gerado (depois disso não edita mais)
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pets_customer_idx on pets (customer_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'kiwify',
  provider_order_id text not null,
  status text,
  event text,
  email text,
  phone text,
  product_name text,
  amount numeric,
  extra_pets int not null default 0,
  customer_id uuid references customers(id) on delete set null,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create table if not exists webhook_logs (
  id bigserial primary key,
  provider text,
  payload jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists funnel_events (
  id bigserial primary key,
  session_id text,
  event text not null,
  step int,
  meta jsonb,
  utms jsonb,
  path text,
  created_at timestamptz not null default now()
);
create index if not exists funnel_events_created_idx on funnel_events (created_at);
create index if not exists funnel_events_event_idx on funnel_events (event, created_at);

create table if not exists settings (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table customers enable row level security;
alter table pets enable row level security;
alter table orders enable row level security;
alter table webhook_logs enable row level security;
alter table funnel_events enable row level security;
alter table settings enable row level security;

-- Funil por etapa (usado no painel)
create or replace function funnel_summary(since timestamptz)
returns table (event text, step int, sessions bigint)
language sql stable as $$
  select event, step, count(distinct session_id) as sessions
  from funnel_events
  where created_at >= since
  group by event, step
  order by step nulls last, event;
$$;

-- Storage: fotos dos pets, imagens do painel e kits gerados (leitura pública por URL não adivinhável)
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true), ('site-assets', 'site-assets', true), ('kits', 'kits', true)
on conflict (id) do nothing;

-- Para quem rodou uma versão anterior deste arquivo:
alter table pets add column if not exists files jsonb;
alter table pets add column if not exists submitted_at timestamptz;
alter table customers add column if not exists bumps text[] not null default '{}';
