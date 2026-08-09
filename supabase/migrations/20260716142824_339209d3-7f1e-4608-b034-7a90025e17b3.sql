
REVOKE EXECUTE ON FUNCTION public.tg_customer_rewards_set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_customer_rewards_set_updated_at() TO service_role;
