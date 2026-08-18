/**
 * DG-08 — SMS campaigns stay visible in Product MVP (Ship 1) / trial.
 * Bulk send is refused with one shared message (visible-fail stub).
 * OTP SMS is a separate path (messaging transport stub until a provider is chosen).
 */

export const SMS_CAMPAIGNS_NOT_AVAILABLE_CODE =
  "SMS_CAMPAIGNS_NOT_AVAILABLE_PHASE1" as const;

export const SMS_CAMPAIGNS_NOT_AVAILABLE_MESSAGE =
  "SMS sending isn't available during the trial. You can save this campaign as a draft; messages will not be delivered until SMS is enabled.";
