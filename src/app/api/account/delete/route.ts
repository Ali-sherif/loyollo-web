import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { logger } from "@/lib/server/logger";
import { deleteMyAccount } from "@/lib/server/security-service";

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
    const result = await deleteMyAccount(user.id);
    return Response.json(result);
  } catch (error) {
    logger.error("account.delete.failed", { error: String(error) });
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
