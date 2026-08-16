import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Sends via Resend when RESEND_API_KEY is configured; otherwise logs to the
 * console instead of throwing, so local dev works without a real email
 * provider wired up yet (per .env.local.example's guidance).
 */
export async function sendEmail(input: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[email:dev-fallback] To: ${input.to} | Subject: ${input.subject}\n${input.html}`);
    return;
  }
  await resend.emails.send({
    from: "BrightSums <no-reply@brightsums.app>",
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
