
REVOKE ALL ON FUNCTION public.send_owner_period_report(text,text,timestamptz,timestamptz,text,text,text,boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_weekly_summary_emails() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_monthly_report_emails() FROM PUBLIC, anon, authenticated;
