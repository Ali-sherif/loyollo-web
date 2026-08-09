import { sendOwnerNotification } from "@/lib/notifications.functions";

export function notifyCampaignCreated(args: {
  userId: string;
  campaignId: string;
  campaignName: string;
}) {
  void sendOwnerNotification({
    data: {
      prefKey: "campaign_created",
      type: "campaign_created",
      title: "New campaign created",
      message: `New campaign created: ${args.campaignName}`,
      linkPath: `/campaigns/${args.campaignId}`,
      ctaLabel: "View campaign",
      emailSubject: `New campaign created: ${args.campaignName}`,
      messageId: `campaign-created-${args.campaignId}`,
    },
  }).catch((err) => console.error("[notifyCampaignCreated] failed:", err));
}

export function notifyBranchAdded(args: {
  userId: string;
  branchId: string;
  branchName: string;
}) {
  void sendOwnerNotification({
    data: {
      prefKey: "branch_added",
      type: "branch_added",
      title: "New branch added",
      message: `New branch added: ${args.branchName}`,
      linkPath: `/branches/${args.branchId}`,
      ctaLabel: "View branch",
      emailSubject: `New branch added: ${args.branchName}`,
      messageId: `branch-added-${args.branchId}`,
    },
  }).catch((err) => console.error("[notifyBranchAdded] failed:", err));
}
