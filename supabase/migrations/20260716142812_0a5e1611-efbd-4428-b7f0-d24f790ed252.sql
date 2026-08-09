
CREATE TABLE public.customer_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  reward_name_snapshot TEXT NOT NULL,
  milestone INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN ('earned','redeemed')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, loyalty_program_id, milestone)
);
CREATE INDEX customer_rewards_customer_idx ON public.customer_rewards(customer_id);
CREATE INDEX customer_rewards_program_idx ON public.customer_rewards(loyalty_program_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_rewards TO authenticated;
GRANT ALL ON public.customer_rewards TO service_role;

ALTER TABLE public.customer_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their customer rewards" ON public.customer_rewards
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customer_rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can insert their customer rewards" ON public.customer_rewards
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customer_rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can update their customer rewards" ON public.customer_rewards
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customer_rewards.loyalty_program_id AND lp.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customer_rewards.loyalty_program_id AND lp.owner_id = auth.uid()));
CREATE POLICY "Owners can delete their customer rewards" ON public.customer_rewards
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customer_rewards.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_customer_rewards_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_customer_rewards_set_updated_at() FROM PUBLIC;

CREATE TRIGGER customer_rewards_set_updated_at
  BEFORE UPDATE ON public.customer_rewards
  FOR EACH ROW EXECUTE FUNCTION public.tg_customer_rewards_set_updated_at();

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS reward_earned BOOLEAN NOT NULL DEFAULT true;
