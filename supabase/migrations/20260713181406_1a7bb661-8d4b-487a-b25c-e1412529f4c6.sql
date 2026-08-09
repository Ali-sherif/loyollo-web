
CREATE TABLE public.loyalty_program_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'silver',
  points_threshold integer NOT NULL DEFAULT 0 CHECK (points_threshold >= 0),
  benefits text[] NOT NULL DEFAULT ARRAY[]::text[],
  bonus_percentage numeric(6,2) NOT NULL DEFAULT 0 CHECK (bonus_percentage >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_program_tiers TO authenticated;
GRANT ALL ON public.loyalty_program_tiers TO service_role;

ALTER TABLE public.loyalty_program_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their tiers"
  ON public.loyalty_program_tiers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_program_tiers.loyalty_program_id
      AND lp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert their tiers"
  ON public.loyalty_program_tiers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_program_tiers.loyalty_program_id
      AND lp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update their tiers"
  ON public.loyalty_program_tiers FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_program_tiers.loyalty_program_id
      AND lp.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_program_tiers.loyalty_program_id
      AND lp.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete their tiers"
  ON public.loyalty_program_tiers FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_program_tiers.loyalty_program_id
      AND lp.owner_id = auth.uid()
  ));

CREATE INDEX loyalty_program_tiers_program_idx
  ON public.loyalty_program_tiers (loyalty_program_id, sort_order);

CREATE OR REPLACE FUNCTION public.tg_loyalty_program_tiers_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_loyalty_program_tiers_updated_at
BEFORE UPDATE ON public.loyalty_program_tiers
FOR EACH ROW EXECUTE FUNCTION public.tg_loyalty_program_tiers_set_updated_at();
