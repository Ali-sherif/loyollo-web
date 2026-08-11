import "server-only";

export type {
  EmailTransport,
  MessagingChannel,
  MessagingErrorCode,
  MessagingTransport,
  RenderedMessage,
  SendEmailInput,
  SendResult,
  SendSmsInput,
  SmsTransport,
} from "@/lib/server/messaging/contracts";

export {
  renderAuthEmail,
  renderCampaignEmail,
  renderCampaignSms,
  AUTH_EMAIL_SUBJECTS,
  type AuthEmailType,
  type CampaignRenderInput,
} from "@/lib/server/messaging/render";

export { getMessagingTransport, stubMessagingTransport } from "@/lib/server/messaging/transport";
