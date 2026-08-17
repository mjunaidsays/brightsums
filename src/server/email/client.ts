import "server-only";
import { sendEmail as sendViaResend, type SendEmailInput } from "./resend-client";
import { sendEmail as sendViaBrevo } from "./brevo-client";

/**
 * Provider-selecting facade so callers (currently just auth.ts's
 * sendResetPassword) never need to know which email provider is active.
 * Same "one active implementation, chosen by env var" pattern as the DB
 * driver switch in server/db/client.ts.
 *
 * Defaults to Resend when EMAIL_PROVIDER is unset — preserves existing
 * behavior for anyone who hasn't opted into Brevo. Set EMAIL_PROVIDER=brevo
 * while no domain is verified with Resend yet (Brevo allows sending to any
 * recipient via single-sender verification, no DNS needed); switch back by
 * unsetting it once a domain is verified with Resend.
 */
export async function sendEmail(input: SendEmailInput) {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (provider === "brevo") return sendViaBrevo(input);
  return sendViaResend(input);
}
