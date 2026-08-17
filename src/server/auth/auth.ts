import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { sendEmail } from "@/server/email/client";

/**
 * Better Auth server config — email/password only for launch. Owns its own
 * user/session/account/verification tables (schema/auth.ts). BrightSums'
 * domain profile (grade, school, role, etc.) lives on the separate `users`
 * table in schema/users.ts, linked by betterAuthUserId — see
 * src/actions/auth.actions.ts for where that link is created at signup.
 *
 * transaction: false because Neon's HTTP driver (used in the Cloudflare
 * Workers deployment) has historically had limited multi-statement
 * transaction support — see the plan's "open technical risks" #2. Revisit
 * once that's spiked.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your BrightSums password",
        html: `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${url}">Reset Password</a></p>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once/day of activity
    // Without this, auth.api.getSession() hits the DB on every single call —
    // and it's called on every navigation/API request via getAuthSession().
    // A short signed-cookie cache removes that round trip for the vast
    // majority of requests; 60s keeps staleness (e.g. a role change) low risk.
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
