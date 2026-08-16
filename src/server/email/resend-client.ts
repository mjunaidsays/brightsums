import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Resend only accepts sends from a domain you've verified (DNS records) in
// your Resend dashboard — "onboarding@resend.dev" is Resend's own sandbox
// sender that works with zero setup, but it can only deliver to the email
// address on your Resend account, not arbitrary recipients. Once a real
// domain is verified, set RESEND_FROM_EMAIL to an address on it (see
// .env.local.example) — until then this falls back to the sandbox sender
// instead of failing on every send with an unverified-domain error.
const fromAddress = process.env.RESEND_FROM_EMAIL || "BrightSums <onboarding@resend.dev>";

/**
 * Sends via Resend when RESEND_API_KEY is configured; otherwise logs to the
 * console instead of throwing, so local dev works without a real email
 * provider wired up yet (per .env.local.example's guidance).
 *
 * The Resend SDK does NOT throw on a failed send — it resolves with
 * `{ data, error }` even for 4xx/5xx responses — so `error` must be checked
 * explicitly and re-thrown, or a failure (bad domain, rate limit, invalid
 * recipient, etc.) silently vanishes and every caller wrongly believes the
 * email went out.
 */
export async function sendEmail(input: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[email:dev-fallback] To: ${input.to} | Subject: ${input.subject}\n${input.html}`);
    return;
  }
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    throw new Error(`Resend failed to send "${input.subject}" to ${input.to}: ${error.message}`);
  }
}
