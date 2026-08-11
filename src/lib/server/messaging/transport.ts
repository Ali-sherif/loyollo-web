import "server-only";

import type {
  MessagingTransport,
  SendEmailInput,
  SendResult,
  SendSmsInput,
} from "@/lib/server/messaging/contracts";
import { logger } from "@/lib/server/logger";

/**
 * Email stub policy (ACCEPTED RISK — docs/frontend/17-messaging-templates.md):
 * - Does **not** silently succeed in production paths.
 * - Logs the intent and returns a structured failure so callers can enqueue/retry
 *   or surface an explicit error until a real provider is wired.
 *
 * SMS stub: fails explicitly (`SMS provider not configured` parity).
 */
export const stubMessagingTransport: MessagingTransport = {
  async sendEmail(input: SendEmailInput): Promise<SendResult> {
    logger.warn("messaging.email.stub_refused", {
      to: redactEmail(input.to),
      subject: input.subject,
      templateName: input.templateName ?? null,
      messageId: input.messageId ?? null,
      policy: "EMAIL_TRANSPORT_STUB",
    });
    return {
      ok: false,
      code: "EMAIL_TRANSPORT_STUB",
      error:
        "Email transport stub: no delivery provider configured. Render succeeded; send refused (ACCEPTED RISK).",
    };
  },

  async sendSms(input: SendSmsInput): Promise<SendResult> {
    logger.warn("messaging.sms.stub_refused", {
      to: redactPhone(input.to),
      templateName: input.templateName ?? null,
      messageId: input.messageId ?? null,
      policy: "SMS_TRANSPORT_NOT_CONFIGURED",
    });
    return {
      ok: false,
      code: "SMS_TRANSPORT_NOT_CONFIGURED",
      error: "SMS provider not configured",
    };
  },
};

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local[0] ?? "*"}***@${domain}`;
}

function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

/** Default transport until a real provider replaces stubs. */
export function getMessagingTransport(): MessagingTransport {
  return stubMessagingTransport;
}
