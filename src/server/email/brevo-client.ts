import "server-only";
import type { SendEmailInput } from "./resend-client";

const apiKey = process.env.BREVO_API_KEY;

// Unlike Resend, Brevo has no sandbox sender that works with zero setup — it
// requires a single-sender email verified in the Brevo dashboard (Senders ->
// Add a sender -> click the confirmation link Brevo emails you). No DNS/
// domain ownership needed, which is why this exists alongside resend-client
// as the no-domain-required option — see .env.local.example.
const fromEmail = process.env.BREVO_FROM_EMAIL;
const fromName = process.env.BREVO_FROM_NAME || "BrightSums";

/**
 * Sends via Brevo's transactional email REST API when BREVO_API_KEY is
 * configured; otherwise logs to the console, matching resend-client's local-
 * dev fallback so switching EMAIL_PROVIDER never breaks local dev either way.
 *
 * Plain fetch rather than Brevo's SDK — keeps this dependency-free and
 * portable to the Cloudflare Workers deploy target from CLAUDE.md §6.
 */
export async function sendEmail(input: SendEmailInput) {
  if (!apiKey) {
    console.log(`[email:dev-fallback:brevo] To: ${input.to} | Subject: ${input.subject}\n${input.html}`);
    return;
  }
  if (!fromEmail) {
    throw new Error(
      "BREVO_FROM_EMAIL is not set — required when EMAIL_PROVIDER=brevo. Verify a " +
        "single sender at app.brevo.com/senders and set its address here."
    );
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo failed to send "${input.subject}" to ${input.to}: ${res.status} ${body}`);
  }
}
