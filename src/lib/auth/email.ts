import { Resend } from "resend";

import { env } from "@/env";

function getClient(): Resend | null {
  return env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const client = getClient();
  if (!client || !env.RESEND_FROM_EMAIL) return;
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Verify your InterLog account",
    html: `<p>Verify your email to finish creating your InterLog account.</p><p><a href="${url}">Verify email</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const client = getClient();
  if (!client || !env.RESEND_FROM_EMAIL) return;
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Reset your InterLog password",
    html: `<p>A password reset was requested for your InterLog account.</p><p><a href="${url}">Reset password</a></p>`,
  });
}

