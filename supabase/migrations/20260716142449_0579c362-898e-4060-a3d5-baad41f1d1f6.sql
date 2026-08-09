
CREATE OR REPLACE FUNCTION public.mint_unsubscribe_token(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_token text;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email required';
  END IF;

  SELECT token INTO v_token FROM public.email_unsubscribe_tokens WHERE email = v_email;
  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.email_unsubscribe_tokens (email, token)
  VALUES (v_email, v_token)
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mint_unsubscribe_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mint_unsubscribe_token(text) TO authenticated, service_role;

-- Patch the shared owner report function to mint and include unsubscribe_token
CREATE OR REPLACE FUNCTION public.send_owner_period_report(period_label text, pref_column text, window_start timestamp with time zone, window_end timestamp with time zone, subject_line text, heading_text text, period_human text, include_branches boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  unsub_token text;
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

    SELECT COUNT(*)::int INTO new_customers
      FROM public.customers c
      JOIN public.loyalty_programs lp ON lp.id = c.loyalty_program_id
     WHERE lp.owner_id = r.owner_id
       AND c.created_at >= window_start AND c.created_at < window_end;

    SELECT COALESCE(SUM(c.points), 0)::bigint INTO points_issued
      FROM public.customers c
      JOIN public.loyalty_programs lp ON lp.id = c.loyalty_program_id
     WHERE lp.owner_id = r.owner_id
       AND c.created_at >= window_start AND c.created_at < window_end;

    SELECT COUNT(*)::int INTO active_campaigns
      FROM public.campaigns cm
     WHERE cm.owner_id = r.owner_id AND cm.status = 'active';

    IF include_branches THEN
      SELECT COUNT(*)::int INTO branch_count FROM public.branches b WHERE b.owner_id = r.owner_id;
    ELSE
      branch_count := NULL;
    END IF;

    business_name := COALESCE(NULLIF(TRIM(r.business_name), ''), NULLIF(TRIM(r.full_name), ''), 'Loyollo');
    from_line := business_name || ' <noreply@loyollo.com>';

    metrics_html := ''
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">New customers</td><td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || new_customers::text || '</td></tr>'
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Points issued</td><td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || points_issued::text || '</td></tr>'
      || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Active campaigns</td><td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || active_campaigns::text || '</td></tr>';

    metrics_text := 'New customers: ' || new_customers::text || E'\n'
                 || 'Points issued: ' || points_issued::text || E'\n'
                 || 'Active campaigns: ' || active_campaigns::text;

    IF include_branches AND branch_count IS NOT NULL THEN
      metrics_html := metrics_html || '<tr><td style="padding:8px 0;color:#0a152f;font-size:15px;">Branches</td><td style="padding:8px 0;text-align:right;color:#0a152f;font-size:15px;font-weight:600;">' || branch_count::text || '</td></tr>';
      metrics_text := metrics_text || E'\nBranches: ' || branch_count::text;
    END IF;

    html_body := '<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px 16px;"><div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;"><h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">' || heading_text || '</h1><p style="margin:0 0 20px 0;color:#5a6b8f;font-size:14px;">Summary for ' || period_human || '.</p><table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' || metrics_html || '</table><p style="margin:0 0 8px 0;"><a href="https://www.loyollo.com/analytics" style="display:inline-block;background:#0a152f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">Open analytics</a></p></div><p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ' || business_name || ' via Loyollo</p></div></body></html>';

    text_body := heading_text || E'\nSummary for ' || period_human || E'.\n\n' || metrics_text
              || E'\n\nOpen analytics: https://www.loyollo.com/analytics';

    msg_id := 'report-' || period_label || '-' || r.owner_id::text || '-' || to_char(window_start, 'YYYYMMDD');

    unsub_token := public.mint_unsubscribe_token(r.email);

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
        'unsubscribe_token', unsub_token,
        'queued_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    );

    BEGIN
      INSERT INTO public.notifications (recipient_id, type, title, message, link)
      VALUES (r.owner_id, period_label || '_report', subject_line, heading_text || ' for ' || period_human || '.', '/analytics');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    sent_count := sent_count + 1;
  END LOOP;

  RETURN sent_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.send_owner_period_report(text,text,timestamptz,timestamptz,text,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_owner_period_report(text,text,timestamptz,timestamptz,text,text,text,boolean) TO service_role;
