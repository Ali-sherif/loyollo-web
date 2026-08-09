ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter'
  CHECK (plan IN ('starter','growth','premium'));