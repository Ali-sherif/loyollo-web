REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mint_unsubscribe_token(text) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.mint_unsubscribe_token(text) TO service_role;