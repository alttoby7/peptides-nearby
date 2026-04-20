-- Expand provider schema for comprehensive database
-- All new columns are nullable/defaulted so existing rows are unaffected

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS telehealth jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pharmacy_details jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS consultation jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'listed'
    CHECK (verification_tier IN ('listed', 'verified', 'claimed', 'trusted')),
  ADD COLUMN IF NOT EXISTS treatment_goals text[] NOT NULL DEFAULT '{}';

-- Backfill verification_tier from existing verified boolean
UPDATE public.providers
SET verification_tier = 'verified'
WHERE verified = true AND verification_tier = 'listed';
