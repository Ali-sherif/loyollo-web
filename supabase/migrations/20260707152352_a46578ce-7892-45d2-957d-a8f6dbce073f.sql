
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS num_locations text,
  ADD COLUMN IF NOT EXISTS main_location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS avg_customers_per_day text,
  ADD COLUMN IF NOT EXISTS avg_cheque_per_day numeric,
  ADD COLUMN IF NOT EXISTS cheque_currency text DEFAULT 'USD';
