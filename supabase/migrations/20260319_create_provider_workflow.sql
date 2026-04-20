create extension if not exists pgcrypto;

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('clinic', 'pharmacy', 'wellness-center')),
  status text not null default 'active' check (status in ('active', 'pending', 'closed')),
  address jsonb not null,
  phone text,
  website text,
  email text,
  description text not null,
  booking_url text,
  google_maps_url text,
  services text[] not null default '{}',
  peptides text[] not null default '{}',
  insurance text not null default 'unknown' check (insurance in ('accepted', 'not-accepted', 'varies', 'unknown')),
  hours jsonb,
  featured boolean not null default false,
  verified boolean not null default false,
  last_verified_at timestamptz,
  review_status text not null default 'draft' check (review_status in ('draft', 'reviewing', 'approved', 'rejected')),
  source_notes text not null default '',
  submitted_by text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_evidence (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('website', 'address', 'phone', 'services', 'peptides', 'review')),
  source_url text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('clinic', 'pharmacy', 'wellness-center')),
  city text not null,
  state text not null,
  address text not null default '',
  phone text not null default '',
  website text not null default '',
  services text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'rejected', 'merged')),
  raw_payload jsonb not null,
  review_notes text not null default '',
  canonical_provider_id uuid references public.providers(id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists providers_review_status_idx on public.providers (review_status, is_published);
create index if not exists providers_state_city_idx on public.providers ((address->>'stateCode'), (address->>'city'));
create index if not exists provider_submissions_status_idx on public.provider_submissions (status, submitted_at desc);
create index if not exists provider_evidence_provider_idx on public.provider_evidence (provider_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row execute procedure public.set_updated_at();

drop trigger if exists provider_submissions_set_updated_at on public.provider_submissions;
create trigger provider_submissions_set_updated_at
before update on public.provider_submissions
for each row execute procedure public.set_updated_at();

alter table public.provider_submissions enable row level security;

drop policy if exists "Allow anonymous inserts for provider submissions" on public.provider_submissions;
create policy "Allow anonymous inserts for provider submissions"
on public.provider_submissions
for insert
to anon
with check (true);
