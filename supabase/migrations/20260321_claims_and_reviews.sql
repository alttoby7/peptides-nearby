-- Phase 3: Provider claiming + review system

-- 3A: Provider claims
create table if not exists public.provider_claims (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  claimant_name text not null,
  claimant_email text not null,
  claimant_phone text not null default '',
  claimant_role text not null check (claimant_role in ('owner', 'manager', 'staff', 'other')),
  verification_method text not null default 'email' check (verification_method in ('email', 'phone', 'document')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_claims_provider_idx on public.provider_claims (provider_id);
create index if not exists provider_claims_status_idx on public.provider_claims (status, created_at desc);

-- Allow anonymous claim submissions (reviewed manually)
alter table public.provider_claims enable row level security;

drop policy if exists "Allow anonymous inserts for provider claims" on public.provider_claims;
create policy "Allow anonymous inserts for provider claims"
on public.provider_claims
for insert
to anon
with check (true);

-- Trigger for updated_at
drop trigger if exists provider_claims_set_updated_at on public.provider_claims;
create trigger provider_claims_set_updated_at
before update on public.provider_claims
for each row execute procedure public.set_updated_at();


-- 3B: Provider reviews (verified-visit only)
create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  reviewer_name text not null,
  reviewer_email text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  visit_date date not null,
  visit_type text not null default 'in-person' check (visit_type in ('in-person', 'telehealth')),
  title text not null default '',
  body text not null,
  peptides_used text[] not null default '{}',
  would_recommend boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes text not null default '',
  verified_visit boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_reviews_provider_idx on public.provider_reviews (provider_id, status);
create index if not exists provider_reviews_status_idx on public.provider_reviews (status, created_at desc);

-- Allow anonymous review submissions (moderated before display)
alter table public.provider_reviews enable row level security;

drop policy if exists "Allow anonymous inserts for provider reviews" on public.provider_reviews;
create policy "Allow anonymous inserts for provider reviews"
on public.provider_reviews
for insert
to anon
with check (true);

-- Trigger for updated_at
drop trigger if exists provider_reviews_set_updated_at on public.provider_reviews;
create trigger provider_reviews_set_updated_at
before update on public.provider_reviews
for each row execute procedure public.set_updated_at();


-- 3D: Data freshness tracking
alter table public.providers
  add column if not exists freshness_checked_at timestamptz,
  add column if not exists website_status text default null
    check (website_status is null or website_status in ('live', 'dead', 'redirect', 'timeout', 'unknown'));
