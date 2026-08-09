
REVOKE ALL ON public.email_send_log FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.email_send_state FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.email_unsubscribe_tokens FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.suppressed_emails FROM anon, authenticated, PUBLIC;

GRANT ALL ON public.email_send_log TO service_role;
GRANT ALL ON public.email_send_state TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
GRANT ALL ON public.suppressed_emails TO service_role;

DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
