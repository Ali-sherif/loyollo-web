import "server-only";

/**
 * Provider-agnostic messaging contracts (ADR-010 / docs/frontend/17-messaging-templates.md).
 * Features must import from here — never from a delivery vendor SDK.
 */

export type MessagingChannel = "email" | "sms";

export type RenderedMessage = {
  subject?: string;
  html?: string;
  text: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  /** Observability / idempotency correlation (optional). */
  messageId?: string;
  templateName?: string;
};

export type SendSmsInput = {
  to: string;
  body: string;
  messageId?: string;
  templateName?: string;
};

export type SendResult =
  { ok: true; providerMessageId?: string } | { ok: false; error: string; code: MessagingErrorCode };

export type MessagingErrorCode =
  "EMAIL_TRANSPORT_STUB" | "SMS_TRANSPORT_NOT_CONFIGURED" | "RENDER_FAILED" | "INVALID_INPUT";

export type EmailTransport = {
  sendEmail(input: SendEmailInput): Promise<SendResult>;
};

export type SmsTransport = {
  sendSms(input: SendSmsInput): Promise<SendResult>;
};

export type MessagingTransport = EmailTransport & SmsTransport;
