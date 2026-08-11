import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { createAdminSupabaseClient } from "@/integrations/supabase/admin";
import { logger } from "@/lib/server/logger";

export const runtime = "nodejs";

/**
 * Best-effort owner notification enqueue (in-app + email queue).
 * Full parity with TanStack `sendOwnerNotification` lands with messaging provider choice.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    prefKey?: string;
    type?: string;
    title?: string;
    message?: string;
    linkPath?: string;
    ctaLabel?: string;
    emailSubject?: string;
    messageId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("notifications").insert({
      recipient_id: user.id,
      type: body.type ?? "info",
      title: body.title ?? "Notification",
      message: body.message ?? "",
      link: body.linkPath ?? null,
      read: false,
    });
    return Response.json({ ok: true });
  } catch (error) {
    logger.error("notifications.owner.failed", { error: String(error) });
    return Response.json({ error: "Failed to notify" }, { status: 500 });
  }
}
