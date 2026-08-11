"use client";

/**
 * Fire-and-forget owner notification helpers for Next.
 * Prefer messaging contracts / Backend enqueue; this client path is best-effort UX.
 */

export function notifyCampaignCreated(args: {
  userId: string;
  campaignId: string;
  campaignName: string;
}) {
  void fetch("/api/notifications/owner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prefKey: "campaign_created",
      type: "campaign_created",
      title: "New campaign created",
      message: `New campaign created: ${args.campaignName}`,
      linkPath: `/app/campaigns/${args.campaignId}`,
      ctaLabel: "View campaign",
      emailSubject: `New campaign created: ${args.campaignName}`,
      messageId: `campaign-created-${args.campaignId}`,
    }),
  }).catch((err) => console.error("[notifyCampaignCreated] failed:", err));
}

export function notifyBranchAdded(args: {
  userId: string;
  branchId: string;
  branchName: string;
}) {
  void fetch("/api/notifications/owner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prefKey: "branch_added",
      type: "branch_added",
      title: "New branch added",
      message: `New branch added: ${args.branchName}`,
      linkPath: `/app/branches/${args.branchId}`,
      ctaLabel: "View branch",
      emailSubject: `New branch added: ${args.branchName}`,
      messageId: `branch-added-${args.branchId}`,
    }),
  }).catch((err) => console.error("[notifyBranchAdded] failed:", err));
}
