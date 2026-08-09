import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SENDER_DOMAIN = "notify.loyollo.com";
const FROM_DOMAIN = "loyollo.com";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendPasswordChangedEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, business_name")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.email) return { sent: false as const, reason: "no_email" };

    const businessName =
      (profile.business_name && profile.business_name.trim()) ||
      (profile.full_name && profile.full_name.trim()) ||
      "Loyollo";

    const whenStr = new Date().toUTCString();
    const subject = "Your password was changed";
    const heading = "Your password was changed";
    const body = `We're letting you know the password on your ${businessName} account was just changed at ${whenStr}. If this was you, no action is needed. If this wasn't you, please contact support immediately at support@loyollo.com and reset your password.`;

    const text = `${heading}\n\n${body}`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">
      <h1 style="margin:0 0 12px 0;font-size:20px;color:#0a152f;">${esc(heading)}</h1>
      <p style="margin:0 0 16px 0;line-height:1.55;color:#0a152f;font-size:15px;">${esc(body)}</p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${esc(businessName)} via Loyollo</p>
  </div>
</body></html>`;

    const messageId = `pw-changed-${userId}-${Date.now()}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: unsubToken, error: tokErr } = await supabaseAdmin.rpc(
      "mint_unsubscribe_token",
      { p_email: profile.email },
    );
    if (tokErr) throw new Error(tokErr.message);

    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        idempotency_key: messageId,
        to: profile.email,
        from: `${businessName} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "notification:password_changed",
        unsubscribe_token: unsubToken,
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) throw new Error(enqErr.message);
    return { sent: true as const };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { deleted: true as const };
  });
