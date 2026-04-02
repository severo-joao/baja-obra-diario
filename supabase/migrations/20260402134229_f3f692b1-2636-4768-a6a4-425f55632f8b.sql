create table public.print_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  client_id uuid references public.clients(id),
  date_from date,
  date_to date,
  expires_at timestamptz not null default now() + interval '10 minutes',
  used boolean default false,
  created_at timestamptz default now()
);

alter table public.print_tokens enable row level security;

create policy "Service role only" on public.print_tokens for all using (false);