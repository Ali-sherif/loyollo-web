
ALTER TABLE public.loyalty_programs
  ADD COLUMN IF NOT EXISTS tier_measured_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tier_reset_period text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_tier_upgrade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier_downgrade_protection boolean NOT NULL DEFAULT false;

ALTER TABLE public.loyalty_program_tiers
  ADD COLUMN IF NOT EXISTS points_multiplier numeric NOT NULL DEFAULT 1.0;
