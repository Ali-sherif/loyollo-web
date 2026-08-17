import * as React from "react";
import { render } from "@react-email/render";

import { EmailChangeEmail } from "@/lib/server/messaging/templates/auth/email-change";
import { InviteEmail } from "@/lib/server/messaging/templates/auth/invite";
import { MagicLinkEmail } from "@/lib/server/messaging/templates/auth/magic-link";
import { ReauthenticationEmail } from "@/lib/server/messaging/templates/auth/reauthentication";
import { RecoveryEmail } from "@/lib/server/messaging/templates/auth/recovery";
import { SignupEmail } from "@/lib/server/messaging/templates/auth/signup";

export const runtime = "nodejs";

const SITE_NAME = "loyaltysystem";
const SAMPLE_PROJECT_URL = "https://loyollo.com";
const SAMPLE_EMAIL = "user@example.test";

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: "123456",
  },
};

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * First-party auth email HTML preview.
 */
export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token || !timingSafeEqualString(token, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type ?? "signup";
  const Template = EMAIL_TEMPLATES[type];
  const sample = SAMPLE_DATA[type];
  if (!Template || !sample) {
    return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 });
  }

  const element = React.createElement(Template, sample as Record<string, unknown>);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return Response.json({ type, html, text });
}
