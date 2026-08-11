import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { logger } from "@/lib/server/logger";
import { sendPasswordChangedEmail } from "@/lib/server/security-service";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sendPasswordChangedEmail(user.id);
    return Response.json(result);
  } catch (error) {
    logger.error("account.password_changed_email.failed", { error: String(error) });
    return Response.json({ error: "Failed to queue email" }, { status: 500 });
  }
}
