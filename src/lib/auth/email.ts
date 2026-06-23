import nodemailer from "nodemailer";

import { env } from "@/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function assertSmtpConfig() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new Error("SMTP email is not configured.");
  }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  assertSmtpConfig();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "Verify your InterLog account",
    text: `Verify your email to finish creating your InterLog account: ${url}`,
    html: `<p>Verify your email to finish creating your InterLog account.</p><p><a href="${url}">Verify email</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "Reset your InterLog password",
    text: `A password reset was requested for your InterLog account. Reset your password here: ${url}`,
    html: `<p>A password reset was requested for your InterLog account.</p><p><a href="${url}">Reset password</a></p>`,
  });
}

export async function sendEmailChangeVerification(email: string, token: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email-change?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: "Confirm your new InterLog email address",
    text: `Confirm this email address for your InterLog account: ${url}`,
    html: `<p>Confirm this email address for your InterLog account.</p><p><a href="${url}">Confirm new email</a></p>`,
  });
}
