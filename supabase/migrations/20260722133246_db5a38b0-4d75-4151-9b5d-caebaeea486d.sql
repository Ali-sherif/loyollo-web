
-- 1) qr_page_settings table
CREATE TABLE public.qr_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_program_id UUID NOT NULL UNIQUE REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#FEB602',
  secondary_color TEXT NOT NULL DEFAULT '#44B678',
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  business_name_override TEXT,
  welcome_headline TEXT,
  short_description TEXT,
  form_fields JSONB NOT NULL DEFAULT '{
    "first_name": {"enabled": true, "required": true},
    "last_name":  {"enabled": true, "required": false},
    "email":      {"enabled": true, "required": true},
    "phone":      {"enabled": true, "required": false},
    "birthday":   {"enabled": false, "required": false},
    "gender":     {"enabled": false, "required": false},
    "city":       {"enabled": false, "required": false},
    "custom_field": {"enabled": false, "required": false}
  }'::jsonb,
  custom_field_label TEXT,
  show_welcome_message BOOLEAN NOT NULL DEFAULT true,
  show_rewards_preview BOOLEAN NOT NULL DEFAULT true,
  show_program_description BOOLEAN NOT NULL DEFAULT true,
  show_referral_section BOOLEAN NOT NULL DEFAULT true,
  show_terms BOOLEAN NOT NULL DEFAULT true,
  button_color TEXT NOT NULL DEFAULT '#FEB602',
  button_text TEXT NOT NULL DEFAULT 'Join Loyalty Program',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_page_settings TO authenticated;
GRANT SELECT ON public.qr_page_settings TO anon;
GRANT ALL ON public.qr_page_settings TO service_role;

ALTER TABLE public.qr_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their qr settings"
  ON public.qr_page_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp
                 WHERE lp.id = qr_page_settings.loyalty_program_id
                   AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can insert their qr settings"
  ON public.qr_page_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp
                      WHERE lp.id = qr_page_settings.loyalty_program_id
                        AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can update their qr settings"
  ON public.qr_page_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp
                 WHERE lp.id = qr_page_settings.loyalty_program_id
                   AND lp.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs lp
                      WHERE lp.id = qr_page_settings.loyalty_program_id
                        AND lp.owner_id = auth.uid()));

CREATE POLICY "Owners can delete their qr settings"
  ON public.qr_page_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs lp
                 WHERE lp.id = qr_page_settings.loyalty_program_id
                   AND lp.owner_id = auth.uid()));

-- Anonymous customers on /join need to read the branding config.
CREATE POLICY "Public can view qr settings"
  ON public.qr_page_settings FOR SELECT
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION public.tg_qr_page_settings_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER qr_page_settings_set_updated_at
  BEFORE UPDATE ON public.qr_page_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_qr_page_settings_set_updated_at();

-- 2) qr-branding storage policies (bucket created via storage tool)
CREATE POLICY "QR branding assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-branding');

CREATE POLICY "Users can upload their own qr branding"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'qr-branding'
              AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can update their own qr branding"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'qr-branding'
         AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'qr-branding'
              AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete their own qr branding"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'qr-branding'
         AND (storage.foldername(name))[1] = (auth.uid())::text);
