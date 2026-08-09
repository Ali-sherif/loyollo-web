
CREATE TYPE public.loyalty_program_type AS ENUM ('points', 'visit', 'tier');

CREATE TABLE public.loyalty_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Loyalty Program',
  description TEXT,
  program_type public.loyalty_program_type NOT NULL DEFAULT 'points',
  spend_amount NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  points_earned INTEGER NOT NULL DEFAULT 1,
  minimum_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  points_expiry_months INTEGER NOT NULL DEFAULT 0,
  grace_period_months INTEGER NOT NULL DEFAULT 0,
  bonus_signup_points BOOLEAN NOT NULL DEFAULT false,
  double_points_birthdays BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_programs_owner_unique UNIQUE (owner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_programs TO authenticated;
GRANT ALL ON public.loyalty_programs TO service_role;

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their loyalty program"
  ON public.loyalty_programs FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their loyalty program"
  ON public.loyalty_programs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their loyalty program"
  ON public.loyalty_programs FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their loyalty program"
  ON public.loyalty_programs FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.tg_loyalty_programs_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

REVOKE ALL ON FUNCTION public.tg_loyalty_programs_set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER loyalty_programs_set_updated_at
BEFORE UPDATE ON public.loyalty_programs
FOR EACH ROW EXECUTE FUNCTION public.tg_loyalty_programs_set_updated_at();
