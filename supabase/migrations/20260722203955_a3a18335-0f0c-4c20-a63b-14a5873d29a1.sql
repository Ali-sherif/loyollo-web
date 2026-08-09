
CREATE OR REPLACE FUNCTION public.tg_campaign_automations_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.campaign_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'birthday_rewards','welcome_new_customers','vip_tier_upgrade',
    're_engagement','points_expiry','promotional_offer','feedback_request'
  )),
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_automations TO authenticated;
GRANT ALL ON public.campaign_automations TO service_role;

ALTER TABLE public.campaign_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their automations"
ON public.campaign_automations FOR ALL
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER tg_campaign_automations_updated_at
BEFORE UPDATE ON public.campaign_automations
FOR EACH ROW EXECUTE FUNCTION public.tg_campaign_automations_set_updated_at();
