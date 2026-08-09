CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_customer_joined BOOLEAN NOT NULL DEFAULT false,
  reward_redeemed BOOLEAN NOT NULL DEFAULT true,
  campaign_completed BOOLEAN NOT NULL DEFAULT true,
  branch_added BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT false,
  monthly_report BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own notification prefs"
  ON public.notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "Owners can insert own notification prefs"
  ON public.notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can update own notification prefs"
  ON public.notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can delete own notification prefs"
  ON public.notification_preferences FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.tg_notification_preferences_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_notification_preferences_set_updated_at();
