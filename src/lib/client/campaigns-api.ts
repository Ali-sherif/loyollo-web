"use client";

export async function sendCampaign(data: { campaignId: string }) {
  const res = await fetch("/api/campaigns/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || "Failed to send campaign");
  }
  return body;
}
