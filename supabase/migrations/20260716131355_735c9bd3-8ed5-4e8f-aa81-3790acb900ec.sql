-- Backfill profiles.full_name / business_name / phone from auth signup metadata
-- for users whose handle_new_user trigger did not populate those columns
-- (e.g. because a row was inserted by another path first, so the trigger's
-- ON CONFLICT DO NOTHING skipped the seed).
UPDATE public.profiles p
SET
  full_name = COALESCE(NULLIF(p.full_name, ''), u.raw_user_meta_data ->> 'full_name'),
  business_name = COALESCE(NULLIF(p.business_name, ''), u.raw_user_meta_data ->> 'business_name'),
  phone = COALESCE(NULLIF(p.phone, ''), u.raw_user_meta_data ->> 'phone')
FROM auth.users u
WHERE u.id = p.id
  AND (
    p.full_name IS NULL OR p.full_name = ''
    OR p.business_name IS NULL OR p.business_name = ''
    OR p.phone IS NULL OR p.phone = ''
  );