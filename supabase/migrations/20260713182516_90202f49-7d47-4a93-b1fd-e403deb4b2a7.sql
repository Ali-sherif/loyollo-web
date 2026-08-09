ALTER TABLE public.loyalty_programs
  ADD COLUMN IF NOT EXISTS visits_required integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_on_completion text,
  ADD COLUMN IF NOT EXISTS min_spend_per_visit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_expiry_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_visits_per_day integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS after_reward_action text,
  ADD COLUMN IF NOT EXISTS bonus_stamp_signup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS double_stamp_weekends boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_one_visit_away boolean NOT NULL DEFAULT false;