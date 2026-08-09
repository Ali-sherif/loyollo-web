CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'gift',
  point_cost INTEGER,
  monthly_limit INTEGER,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their rewards" ON public.rewards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can insert their rewards" ON public.rewards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can update their rewards" ON public.rewards FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = rewards.loyalty_program_id AND lp.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can delete their rewards" ON public.rewards FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = rewards.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_rewards_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER rewards_set_updated_at BEFORE UPDATE ON public.rewards
FOR EACH ROW EXECUTE FUNCTION public.tg_rewards_set_updated_at();

CREATE INDEX rewards_program_idx ON public.rewards(loyalty_program_id);