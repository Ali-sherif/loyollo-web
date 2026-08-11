import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SENDER_DOMAIN = "notify.loyollo.com";
const FROM_DOMAIN = "loyollo.com";
const APP_ORIGIN = "https://www.loyollo.com";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

type PrefKey = "campaign_created" | "branch_added";

type Input = {
  prefKey: PrefKey;
  type: string;
  title: string;
  message: string;
  linkPath: string;
  ctaLabel: string;
  emailSubject: string;
  messageId: string;
};

const ALLOWED_PREFS: PrefKey[] = ["campaign_created", "branch_added"];

function sanitizeLinkPath(p: unknown): string {
  if (typeof p !== "string") return "/";
  if (!p.startsWith("/") || p.startsWith("//")) return "/";
  return p.slice(0, 512);
}

function sanitizeText(s: unknown, max = 300): string {
  return String(s ?? "").slice(0, max);
}

function validate(input: unknown): Input {
  const o = input as Record<string, unknown>;
  if (!o || typeof o !== "object") throw new Error("Invalid input");
  const prefKey = o.prefKey as PrefKey;
  if (!ALLOWED_PREFS.includes(prefKey)) throw new Error("Invalid prefKey");
  return {
    prefKey,
    type: sanitizeText(o.type, 64),
    title: sanitizeText(o.title, 200),
    message: sanitizeText(o.message, 500),
    linkPath: sanitizeLinkPath(o.linkPath),
    ctaLabel: sanitizeText(o.ctaLabel, 60),
    emailSubject: sanitizeText(o.emailSubject, 200),
    messageId: sanitizeText(o.messageId, 128),
  };
}

export const sendOwnerNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check preference (user-scoped RLS)
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select(data.prefKey)
      .eq("id", userId)
      .maybeSingle();
    if (!prefs || !(prefs as Record<string, boolean>)[data.prefKey]) {
      return { sent: false, reason: "pref_off" as const };
    }

    // In-app notification (user has insert policy for self)
    try {
      await supabase.from("notifications").insert({
        recipient_id: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.linkPath,
      });
    } catch (err) {
      console.error(`[notify:${data.type}] in-app insert failed:`, err);
    }

    // Owner email lookup (user-scoped RLS)
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, business_name")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email) return { sent: false, reason: "no_email" as const };

    const businessName =
      (profile.business_name && profile.business_name.trim()) ||
      (profile.full_name && profile.full_name.trim()) ||
      "Loyollo";
    const url = `${APP_ORIGIN}${data.linkPath}`;
    const text = `${data.message}\n\n${data.ctaLabel}: ${url}`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">
      <h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">${esc(data.title)}</h1>
      <p style="margin:0 0 20px 0;line-height:1.55;color:#0a152f;font-size:15px;">${esc(data.message)}</p>
      <p style="margin:0 0 24px 0;"><a href="${esc(url)}" style="display:inline-block;background:#0a152f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">${esc(data.ctaLabel)}</a></p>
      <p style="margin:0;color:#8698bb;font-size:13px;">Or open this link: <a href="${esc(url)}" style="color:#3b6cff;">${esc(url)}</a></p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${esc(businessName)} via Loyollo</p>
  </div>
</body></html>`;

    // Privileged calls (RPCs are no longer executable by authenticated).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: unsubToken, error: tokErr } = await supabaseAdmin.rpc("mint_unsubscribe_token", {
      p_email: profile.email,
    });
    if (tokErr) throw new Error(tokErr.message);

    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: data.messageId,
        idempotency_key: data.messageId,
        to: profile.email,
        from: `${businessName} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: data.emailSubject,
        html,
        text,
        purpose: "transactional",
        label: `notification:${data.type}`,
        unsubscribe_token: unsubToken,
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) throw new Error(enqErr.message);

    return { sent: true as const };
  });
