# Supabase Workflow

## Purpose

Supabase is the operational source of truth for provider submissions, editorial review, evidence tracking, and canonical provider records. The public site remains static and continues to serve JSON build artifacts.

## Setup

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/20260319_create_provider_workflow.sql`.
3. Deploy the edge function in `supabase/functions/submit-provider/`.
4. Copy `.env.example` values into your local `.env` and set real credentials.

## Data Flow

1. Public `/submit` posts to the `submit-provider` edge function.
2. The edge function inserts a row into `provider_submissions`.
3. Editors review submissions in Supabase Studio.
4. Approved canonical providers are stored in `providers` with:
   - `review_status = 'approved'`
   - `is_published = true`
5. Run `npm run sync-data` to export approved providers into `data/raw/providers.json` and regenerate derived JSON files.

## Required Columns For Export

The export script expects the `providers` table to expose:

- `slug`, `name`, `type`, `status`
- `address` as a JSON object matching the current frontend provider shape
- `phone`, `website`, `email`, `description`
- `booking_url`, `google_maps_url`
- `services`, `peptides`
- `insurance`, `hours`
- `featured`, `verified`, `last_verified_at`
- `review_status`, `is_published`
