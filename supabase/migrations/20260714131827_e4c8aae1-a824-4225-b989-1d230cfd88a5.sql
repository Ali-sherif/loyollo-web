ALTER TABLE public.loyalty_programs
  ALTER COLUMN tier_measured_by DROP NOT NULL,
  ALTER COLUMN tier_reset_period DROP NOT NULL,
  ALTER COLUMN tier_measured_by DROP DEFAULT,
  ALTER COLUMN tier_reset_period DROP DEFAULT;