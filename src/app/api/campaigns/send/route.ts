import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { sendCampaign } from "@/lib/server/campaigns-service";
import { logger } from "@/lib/server/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { campaignId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.campaignId) {
    return Response.json({ error: "campaignId required" }, { status: 400 });
  }

  try {
    const result = await sendCampaign({ campaignId: body.campaignId }, user.id);
    return Response.json(result);
  } catch (error) {
    logger.error("campaigns.send.failed", { error: String(error) });
    return Response.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 400 },
    );
  }
}
