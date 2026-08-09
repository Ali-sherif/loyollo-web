
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS failed_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, customer_id)
);

CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_idx ON public.campaign_recipients(campaign_id);

GRANT SELECT ON public.campaign_recipients TO authenticated;
GRANT ALL ON public.campaign_recipients TO service_role;

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their campaign recipients" ON public.campaign_recipients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_recipients.campaign_id AND c.owner_id = auth.uid()
  ));
