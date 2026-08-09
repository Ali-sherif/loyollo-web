
-- =========================================================
-- Weekly + Monthly scheduled report emails
-- =========================================================

CREATE OR REPLACE FUNCTION public.send_owner_period_report(
  period_label text,      -- 'week' | 'month'
  pref_column text,       -- 'weekly_summary' | 'monthly_report'
  window_start timestamptz,
  window_end timestamptz,
  subject_line text,
  heading_text text,
  period_human text,      -- e.g. "the past 7 days" or "October 2026"
  include_branches boolean
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  r RECORD;
  sent_count integer := 0;
  pref_enabled boolean;
  new_customers integer;
  points_issued bigint;
  active_campaigns integer;
  branch_count integer;
  business_name text;
  from_line text;
  html_body text;
  text_body text;
  msg_id text;
  metrics_html text;
  metrics_text text;
BEGIN
  FOR r IN
    SELECT p.id AS owner_id, p.email, p.full_name, p.business_name
    FROM public.profiles p
    WHERE p.email IS NOT NULL AND p.email <> ''
  LOOP
    EXECUTE format(
      'SELECT COALESCE((SELECT %I FROM public.notification_preferences WHERE id = $1), false)',
      pref_column
    ) INTO pref_enabled USING r.owner_id;

    IF NOT pref_enabled THEN
      CONTINUE;
    END IF;

    -- Aggregate over owner's loyalty programs
    SELECT COUNT(*)::int
      INTO new_customers
      FROM public.customers c
      JOIN public.loyalty_programs lp ON lp.id = c.loyalty_program_id
     WHERE lp.owner_id = r.owner_id
       AND c.created_at >= window_start
       AND c.created_at <  window_end;

    -- Points issued proxy (matches Analytics dashboard: sum of new customers' points in window)
    SELECT COALESCE(SUM(c.points), 0)::bigint
      INTO points_issued
      FROM public.customers c
      JOIN public.loyalty_programs lp ON lp.id = c.loyalty_program_id
     WHERE lp.owner_id = r.owner_id
       AND c.created_at >= window_start
       AND c.created_at <  window_end;

    -- Active campaigns currently running
    SELECT COUNT(*)::int
      INTO active_campaigns
      FROM public.campaigns cm
     WHERE cm.owner_id = r.owner_id
       AND cm.status = 'active';

    IF include_branches THEN
      SELECT COUNT(*)::int INTO branch_count
        FROM public.branches b WHERE b.owner_id = r.owner_id;
    ELSE
      branch_count := NULL;
    END IF;

    business_name := COALESCE(NULLIF(TRIM(r.business_name), ''), NULLIF(TRIM(r.full_name), ''), 'Loyollo');
    from_line := business_name || ' <noreply@loyollo.com>';

    -- Build metrics blocks (omit any we don't have real data for)
    metrics_html := ''
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">New customers</td>'
      || '<td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || new_customers::text || '</td></tr>'
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Points issued</td>'
      || '<td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || points_issued::text || '</td></tr>'
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Active campaigns</td>'
      || '<td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || active_campaigns::text || '</td></tr>';

    metrics_text := 'New customers: ' || new_customers::text || E'\n'
                 || 'Points issued: ' || points_issued::text || E'\n'
                 || 'Active campaigns: ' || active_campaigns::text;

    IF include_branches AND branch_count IS NOT NULL THEN
      metrics_html := metrics_html
        || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Branches</td>'
        || '<td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || branch_count::text || '</td></tr>';
      metrics_text := metrics_text || E'\nBranches: ' || branch_count::text;
    END IF;

    html_body := '<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">'
      || '<div style="max-width:560px;margin:0 auto;padding:32px 16px;">'
      || '<div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">'
      || '<h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">' || heading_text || '</h1>'
      || '<p style="margin:0 0 20px 0;color:#5a6b8f;font-size:14px;">Summary for ' || period_human || '.</p>'
      || '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' || metrics_html || '</table>'
      || '<p style="margin:0 0 8px 0;"><a href="https://www.loyollo.com/analytics" style="display:inline-block;background:#0a152f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">Open analytics</a></p>'
      || '</div>'
      || '<p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ' || business_name || ' via Loyollo</p>'
      || '</div></body></html>';

    text_body := heading_text || E'\nSummary for ' || period_human || E'.\n\n' || metrics_text
              || E'\n\nOpen analytics: https://www.loyollo.com/analytics';

    msg_id := 'report-' || period_label || '-' || r.owner_id::text || '-' || to_char(window_start, 'YYYYMMDD');

    BEGIN
      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (msg_id, 'notification:' || period_label || '_report', r.email, 'pending');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    PERFORM public.enqueue_email(
      'transactional_emails',
      jsonb_build_object(
        'message_id', msg_id,
        'idempotency_key', msg_id,
        'to', r.email,
        'from', from_line,
        'sender_domain', 'notify.loyollo.com',
        'subject', subject_line,
        'html', html_body,
        'text', text_body,
        'purpose', 'transactional',
        'label', 'notification:' || period_label || '_report',
        'queued_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    );

    -- In-app notification
    BEGIN
      INSERT INTO public.notifications (recipient_id, type, title, message, link)
      VALUES (
        r.owner_id,
        period_label || '_report',
        subject_line,
        heading_text || ' for ' || period_human || '.',
        '/analytics'
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    sent_count := sent_count + 1;
  END LOOP;

  RETURN sent_count;
END;
$fn$;

REVOKE ALL ON FUNCTION public.send_owner_period_report(text,text,timestamptz,timestamptz,text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_owner_period_report(text,text,timestamptz,timestamptz,text,text,text,boolean) TO service_role;

-- Wrapper: weekly (past 7 days ending at scheduled run time)
CREATE OR REPLACE FUNCTION public.send_weekly_summary_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  win_end timestamptz := date_trunc('day', now() AT TIME ZONE 'America/Toronto') AT TIME ZONE 'America/Toronto';
  win_start timestamptz := win_end - INTERVAL '7 days';
BEGIN
  RETURN public.send_owner_period_report(
    'week',
    'weekly_summary',
    win_start,
    win_end,
    'Your weekly performance summary',
    'Your weekly performance summary',
    'the past 7 days (' || to_char(win_start AT TIME ZONE 'America/Toronto', 'Mon DD') || ' – ' || to_char((win_end - INTERVAL '1 day') AT TIME ZONE 'America/Toronto', 'Mon DD') || ')',
    false
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.send_weekly_summary_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_weekly_summary_emails() TO service_role;

-- Wrapper: monthly (previous calendar month in America/Toronto)
CREATE OR REPLACE FUNCTION public.send_monthly_report_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  tz constant text := 'America/Toronto';
  this_month_start timestamptz := date_trunc('month', now() AT TIME ZONE tz) AT TIME ZONE tz;
  win_start timestamptz := (date_trunc('month', now() AT TIME ZONE tz) - INTERVAL '1 month') AT TIME ZONE tz;
BEGIN
  RETURN public.send_owner_period_report(
    'month',
    'monthly_report',
    win_start,
    this_month_start,
    'Your monthly analytics report',
    'Your monthly analytics report',
    to_char(win_start AT TIME ZONE tz, 'FMMonth YYYY'),
    true
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.send_monthly_report_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_monthly_report_emails() TO service_role;

-- Schedule via pg_cron. Cron runs in UTC; 8am America/Toronto is 12:00 UTC (EST=13:00 UTC, EDT=12:00 UTC).
-- We schedule at 12:00 UTC and gate to the correct local day/date inside the job.
SELECT cron.unschedule('weekly-summary-emails') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-summary-emails');
SELECT cron.unschedule('monthly-report-emails') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-report-emails');

SELECT cron.schedule(
  'weekly-summary-emails',
  '0 12 * * *',
  $cron$
  DO $$
  BEGIN
    IF EXTRACT(ISODOW FROM (now() AT TIME ZONE 'America/Toronto')) = 1
       AND EXTRACT(HOUR FROM (now() AT TIME ZONE 'America/Toronto')) = 8 THEN
      PERFORM public.send_weekly_summary_emails();
    END IF;
  END $$;
  $cron$
);

SELECT cron.schedule(
  'monthly-report-emails',
  '0 12 * * *',
  $cron$
  DO $$
  BEGIN
    IF EXTRACT(DAY FROM (now() AT TIME ZONE 'America/Toronto')) = 1
       AND EXTRACT(HOUR FROM (now() AT TIME ZONE 'America/Toronto')) = 8 THEN
      PERFORM public.send_monthly_report_emails();
    END IF;
  END $$;
  $cron$
);
