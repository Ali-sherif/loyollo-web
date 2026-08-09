REVOKE EXECUTE ON FUNCTION public.tg_integrations_set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_integrations_set_updated_at() TO service_role;