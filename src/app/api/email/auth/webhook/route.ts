import * as React from "react";
import { render } from "@react-email/render";

import { createAdminSupabaseClient } from "@/integrations/supabase/admin";
import { logger } from "@/lib/server/logger";
import {
  AUTH_EMAIL_SUBJECTS,
  type AuthEmailType,
} from "@/lib/server/messaging/templates/auth/subjects";
import { EmailChangeEmail } from "@/lib/server/messaging/templates/auth/email-change";
import { InviteEmail } from "@/lib/server/messaging/templates/auth/invite";
import { MagicLinkEmail } from "@/lib/server/messaging/templates/auth/magic-link";
import { ReauthenticationEmail } from "@/lib/server/messaging/templates/auth/reauthentication";
import { RecoveryEmail } from "@/lib/server/messaging/templates/auth/recovery";
import { SignupEmail } from "@/lib/server/messaging/templates/auth/signup";

export const runtime = "nodejs";

const SITE_NAME = "loyaltysystem";
const SENDER_DOMAIN = "notify.loyollo.com";
const ROOT_DOMAIN = "loyollo.com";
const FROM_DOMAIN = "loyollo.com";

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * First-party auth email webhook (replaces `/lovable/email/auth/webhook`).
 * Auth: `Authorization: Bearer <EMAIL_WEBHOOK_SECRET|LOVABLE_API_KEY>`.
 * Renders preserved templates and enqueues via Supabase RPC (no Lovable SDK).
 */
export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET || process.env.LOVABLE_API_KEY;
  if (!secret) {
    logger.error("email.auth.webhook.missing_secret");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token || !timingSafeEqualString(token, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    version?: string;
    run_id?: string;
    data?: {
      action_type?: string;
      email?: string;
      url?: string;
      token?: string;
      old_email?: string;
      new_email?: string;
    };
  };

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const run_id = payload.run_id ?? "";
  if (!run_id) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
  if (payload.version !== "1") {
    return Response.json(
      { error: `Unsupported payload version: ${payload.version}` },
      { status: 400 },
    );
  }

  const emailType = payload.data?.action_type as AuthEmailType | undefined;
  const EmailTemplate = emailType ? EMAIL_TEMPLATES[emailType] : undefined;
  if (!emailType || !EmailTemplate) {
    return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 });
  }

  const recipient = payload.data?.email ?? "";
  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient,
    confirmationUrl: payload.data?.url ?? "",
    token: payload.data?.token ?? "",
    email: recipient,
    oldEmail: payload.data?.old_email ?? "",
    newEmail: payload.data?.new_email ?? "",
  };

  const element = React.createElement(EmailTemplate, templateProps);
  const html = await render(element);
  const text = await render(element, { plainText: true });

  let supabase;
  try {
    supabase = createAdminSupabaseClient();
  } catch (error) {
    logger.error("email.auth.webhook.supabase_config", { error: String(error) });
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const messageId = crypto.randomUUID();
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: recipient,
    status: "pending",
  });

  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "auth_emails",
    payload: {
      run_id,
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: AUTH_EMAIL_SUBJECTS[emailType] || "Notification",
      html,
      text,
      purpose: "transactional",
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    logger.error("email.auth.webhook.enqueue_failed", {
      error: enqueueError.message,
      run_id,
      emailType,
    });
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: recipient,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return Response.json({ error: "Failed to enqueue email" }, { status: 500 });
  }

  logger.info("email.auth.webhook.enqueued", {
    emailType,
    email_redacted: redactEmail(recipient),
    run_id,
  });

  return Response.json({ success: true, queued: true });
}
