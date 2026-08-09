
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('square','clover','toast','lightspeed','shopify_pos','mailchimp','klaviyo','twilio','apple_wallet','google_wallet')),
  status text NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','connected','disconnected','pending')),
  connected_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.integrations FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own_insert" ON public.integrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own_update" ON public.integrations FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own_delete" ON public.integrations FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.tg_integrations_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER integrations_set_updated_at BEFORE UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();
