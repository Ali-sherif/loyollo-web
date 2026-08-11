"use client";

import CampaignDetailPage from "@/features/campaigns/campaign-detail-page";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const resolved = use(params);
  return <CampaignDetailPage campaignId={resolved.campaignId} />;
}
