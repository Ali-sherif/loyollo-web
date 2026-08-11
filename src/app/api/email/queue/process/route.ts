import { createAdminSupabaseClient } from "@/integrations/supabase/admin";
import { logger } from "@/lib/server/logger";
import { getMessagingTransport } from "@/lib/server/messaging/transport";

export const runtime = "nodejs";

const DEFAULT_BATCH_SIZE = 10;

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * First-party email queue worker (replaces `/lovable/email/queue/process`).
 * Uses messaging transport stubs until a provider is chosen (ACCEPTED RISK).
 */
export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }

    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token || !timingSafeEqualString(token, serviceKey)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: state } = await supabase
      .from("email_send_state")
      .select(
        "retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes",
      )
      .single();

    if (state?.retry_after_until && new Date(state.retry_after_until) > new Date()) {
      return Response.json({ skipped: true, reason: "rate_limited" });
    }

    const batchSize = Number(state?.batch_size ?? DEFAULT_BATCH_SIZE);
    const transport = getMessagingTransport();
    const queues = ["auth_emails", "transactional_emails"] as const;

    let processed = 0;
    let failed = 0;
    let read = 0;

    for (const queue of queues) {
      const { data: messages, error } = await supabase.rpc("read_email_batch", {
        queue_name: queue,
        batch_size: batchSize,
        vt: 60,
      });
      if (error) {
        logger.error("email.queue.read_failed", { queue, error: error.message });
        continue;
      }

      const rows =
        (messages as Array<{
          msg_id: number;
          message: {
            to?: string;
            subject?: string;
            html?: string;
            text?: string;
            from?: string;
            message_id?: string;
            label?: string;
          };
        }> | null) ?? [];
      read += rows.length;

      for (const msg of rows) {
        const payload = msg.message;
        const to = String(payload.to ?? "");
        const subject = String(payload.subject ?? "Notification");
        const html = String(payload.html ?? "");
        const messageId = String(payload.message_id ?? crypto.randomUUID());
        const templateName = String(payload.label ?? queue);

        const result = await transport.sendEmail({
          to,
          subject,
          html,
          text: payload.text,
          from: payload.from,
          messageId,
          templateName,
        });

        if (!result.ok) {
          failed += 1;
          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: to,
            status: "failed",
            error_message: result.error,
          });
          continue;
        }

        processed += 1;
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: to,
          status: "sent",
        });
        await supabase.rpc("delete_email", {
          queue_name: queue,
          message_id: msg.msg_id,
        });
      }
    }

    return Response.json({ processed, failed, read });
  } catch (error) {
    logger.error("email.queue.process_failed", { error: String(error) });
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }
}
