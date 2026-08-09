import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SENDER_DOMAIN = "notify.loyollo.com";
const FROM_DOMAIN = "loyollo.com";
const SITE_NAME = "Loyollo";

const sendSchema = z.object({ campaignId: z.string().uuid() });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function personalize(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => ctx[k] ?? "");
}

function buildHtml(businessName: string, message: string): string {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.55;color:#0a152f;font-size:15px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #eef1f7;">
      <h1 style="margin:0 0 20px 0;font-size:20px;color:#0a152f;">${escapeHtml(businessName)}</h1>
      ${paragraphs}
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#8698bb;">Sent by ${escapeHtml(businessName)} via Loyollo</p>
  </div>
</body></html>`;
}

function isCurrentMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getMonth() === new Date().getMonth();
}

export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => sendSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load campaign, verify ownership
    const { data: campaign, error: cErr } = await supabaseAdmin
      .from("campaigns")
      .select(
        "id, owner_id, loyalty_program_id, name, channel, audience, subject, message, status",
      )
      .eq("id", data.campaignId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.owner_id !== context.userId) throw new Error("Forbidden");
    if (campaign.status === "sending" || campaign.status === "active")
      throw new Error("Campaign is already sending or has been sent");

    // Owner profile for personalization / from name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("business_name, full_name")
      .eq("id", campaign.owner_id)
      .maybeSingle();
    const businessName =
      (profile?.business_name && profile.business_name.trim()) ||
      (profile?.full_name && profile.full_name.trim()) ||
      SITE_NAME;

    // Resolve audience
    let query = supabaseAdmin
      .from("customers")
      .select("id, full_name, email, phone, tier, status, birth_date, created_at")
      .eq("loyalty_program_id", campaign.loyalty_program_id);

    const aud = (campaign.audience ?? "").toLowerCase();
    if (aud.includes("vip")) query = query.ilike("tier", "vip");
    else if (aud.includes("gold")) query = query.ilike("tier", "gold");
    else if (aud.includes("silver")) query = query.ilike("tier", "silver");
    else if (aud.includes("at risk")) query = query.eq("status", "at-risk");
    else if (aud.includes("new")) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", cutoff);
    }

    const { data: allCustomers, error: custErr } = await query;
    if (custErr) throw new Error(custErr.message);

    let recipients = allCustomers ?? [];
    if (aud.includes("birthday")) {
      recipients = recipients.filter((c) => isCurrentMonth(c.birth_date as unknown as string));
    }

    // Channel-based contact filter
    if (campaign.channel === "email") {
      recipients = recipients.filter((c) => !!c.email);
    } else {
      recipients = recipients.filter((c) => !!c.phone);
    }

    if (recipients.length === 0) {
      throw new Error(
        `No recipients match this audience${
          campaign.channel === "email" ? " with an email address" : " with a phone number"
        }.`,
      );
    }

    // Mark campaign as sending
    await supabaseAdmin
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", campaign.id);

    // Insert recipient rows (pending), idempotent via UNIQUE (campaign_id, customer_id)
    const rows = recipients.map((c) => ({
      campaign_id: campaign.id,
      customer_id: c.id,
      channel: campaign.channel,
      status: "pending",
    }));
    await supabaseAdmin
      .from("campaign_recipients")
      .upsert(rows, { onConflict: "campaign_id,customer_id", ignoreDuplicates: true });

    // Load recipient rows back so we can update by id
    const { data: recRows } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id, customer_id, status")
      .eq("campaign_id", campaign.id);
    const recIdByCustomer = new Map<string, string>();
    for (const r of recRows ?? []) recIdByCustomer.set(r.customer_id as string, r.id as string);

    let sentCount = 0;
    let failedCount = 0;

    for (const c of recipients) {
      const recId = recIdByCustomer.get(c.id);
      if (!recId) continue;

      try {
        if (campaign.channel === "sms") {
          throw new Error("SMS provider not configured");
        }

        // Email path — enqueue via Lovable Emails transactional queue
        if (!c.email) throw new Error("Missing email address");
        const messageId = `campaign-${campaign.id}-${recId}`;
        const ctx = {
          name: (c.full_name as string) ?? "",
          first_name: ((c.full_name as string) ?? "").split(/\s+/)[0] ?? "",
          business_name: businessName,
        };
        const subject = personalize(
          campaign.subject?.trim() || `A message from ${businessName}`,
          ctx,
        );
        const bodyText = personalize(campaign.message ?? "", ctx);
        const html = buildHtml(businessName, bodyText);

        // Pending log row for observability
        await supabaseAdmin.from("email_send_log").insert({
          message_id: messageId,
          template_name: `campaign:${campaign.id}`,
          recipient_email: c.email,
          status: "pending",
        });

        const { data: unsubToken, error: tokErr } = await supabaseAdmin.rpc("mint_unsubscribe_token", {
          p_email: c.email,
        });
        if (tokErr) throw new Error(tokErr.message);

        const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            idempotency_key: messageId,
            to: c.email,
            from: `${businessName} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: bodyText,
            purpose: "transactional",
            label: `campaign:${campaign.id}`,
            unsubscribe_token: unsubToken,
            queued_at: new Date().toISOString(),
          },
        });
        if (enqErr) throw new Error(enqErr.message);

        await supabaseAdmin
          .from("campaign_recipients")
          .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
          .eq("id", recId);
        sentCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabaseAdmin
          .from("campaign_recipients")
          .update({ status: "failed", error_message: msg })
          .eq("id", recId);
        failedCount++;
      }
    }

    const finalStatus = sentCount > 0 ? "active" : "failed";
    await supabaseAdmin
      .from("campaigns")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", campaign.id);

    return {
      sentCount,
      failedCount,
      total: recipients.length,
      status: finalStatus,
    };
  });
