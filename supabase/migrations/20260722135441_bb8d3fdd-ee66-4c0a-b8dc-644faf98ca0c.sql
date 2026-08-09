ALTER TABLE public.qr_page_settings ADD COLUMN button_text_color TEXT NOT NULL DEFAULT '#0A152F';

COMMENT ON COLUMN public.qr_page_settings.button_text_color IS 'Color of the CTA button text on the customer QR join page.';