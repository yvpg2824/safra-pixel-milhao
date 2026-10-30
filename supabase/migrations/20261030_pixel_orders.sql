-- SAFRA Pixel do Milhão: esquema inicial para integração futura (não habilita compras).
-- Execute manualmente em um banco PostgreSQL/Supabase de testes após revisar suas políticas.
create extension if not exists btree_gist;
create table if not exists public.safra_pixel_orders (
 id uuid primary key default gen_random_uuid(),
 pi_uid text not null,
 x integer not null check (x>=0 and x<1000),
 y integer not null check (y>=0 and y<1000),
 size integer not null check (size in (1,2,5,10,20,50,100)),
 zone text not null check (zone in ('bronze','prata','ouro')),
 amount_pi numeric(18,7) not null check(amount_pi>0),
 payment_id text unique,
 txid text unique,
 status text not null default 'pending' check(status in ('pending','reserved','sold','cancelled','expired')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (x+size<=1000 and y+size<=1000),
 constraint no_active_pixel_overlap exclude using gist (
   int4range(x,x+size,'[)') with &&,
   int4range(y,y+size,'[)') with &&
 ) where (status in ('reserved','sold'))
);
create index if not exists safra_pixel_orders_uid_idx on public.safra_pixel_orders(pi_uid);
create index if not exists safra_pixel_orders_status_idx on public.safra_pixel_orders(status);
alter table public.safra_pixel_orders enable row level security;
-- Sem políticas públicas: acesso apenas pelo backend autorizado com credencial secreta.
-- IMPORTANTE: o backend deverá validar zona, preço, user uid, status do pagamento
-- e transicionar status atomicamente, incluindo expiração de reservas pendentes.
