
CREATE TABLE public.referral_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_program_id UUID NOT NULL UNIQUE REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  referrer_bonus_points INTEGER NOT NULL DEFAULT 300,
  new_customer_discount_pct INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_settings TO authenticated;
GRANT ALL ON public.referral_settings TO service_role;

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their referral settings"
  ON public.referral_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = referral_settings.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can insert their referral settings"
  ON public.referral_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = referral_settings.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can update their referral settings"
  ON public.referral_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = referral_settings.loyalty_program_id AND lp.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = referral_settings.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can delete their referral settings"
  ON public.referral_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = referral_settings.loyalty_program_id AND lp.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_referral_settings_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER referral_settings_set_updated_at
BEFORE UPDATE ON public.referral_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_referral_settings_set_updated_at();
