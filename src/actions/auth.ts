"use server";

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { consumeRateLimit, getRateLimitStatus } from "@/lib/rate-limit";
import type { ActionResult } from "@/types";

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;

const RegisterSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
  })
  .strict();

const EmailSchema = z.object({ email: z.string().email().max(254) }).strict();

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerWithPassword(
  input: z.infer<typeof RegisterSchema>,
): Promise<ActionResult<{ verificationRequired: true; email: string }>> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Check your registration details." };
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: "An account already exists for this email." };
  const passwordHash = await hashPassword(parsed.data.password);
  const token = randomBytes(32).toString("hex");
  let createdUserId: string | null = null;
  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: parsed.data.name,
          email,
          credential: { create: { passwordHash } },
          preference: { create: {} },
        },
      });
      await transaction.verificationToken.create({
        data: {
          identifier: `verify:${email}`,
          token: tokenHash(token),
          expires: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });
      return createdUser;
    });
    createdUserId = user.id;
    await sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Failed to create account verification email", error);
    if (createdUserId) {
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: `verify:${email}` } }),
        prisma.user.delete({ where: { id: createdUserId } }),
      ]).catch((cleanupError) => {
        console.error("Failed to clean up unverified account after email error", cleanupError);
      });
    }
    return { success: false, error: "We couldn't send the email right now. Please try again." };
  }
  return { success: true, data: { verificationRequired: true, email } };
}

export async function verifyEmail(input: {
  email: string;
  token: string;
}): Promise<ActionResult<void>> {
  const parsed = z
    .object({ email: z.string().email(), token: z.string().min(32) })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid verification link." };
  const email = parsed.data.email.toLowerCase();
  const verification = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: { identifier: `verify:${email}`, token: tokenHash(parsed.data.token) },
    },
  });
  if (!verification || verification.expires < new Date()) {
    return { success: false, error: "This verification code has expired. Please request a new one." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: verification.identifier, token: verification.token },
      },
    }),
  ]);
  return { success: true, data: undefined };
}

export async function resendVerificationEmail(input: { email: string }): Promise<ActionResult<void>> {
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };
  const email = parsed.data.email.toLowerCase();
  const limit = await consumeRateLimit(email, "verification-email", 3, 15 * 60);
  if (!limit.allowed) {
    return { success: false, error: "Please wait before requesting another verification email." };
  }
  const user = await prisma.user.findUnique({ where: { email }, include: { credential: true } });
  if (!user?.credential) return { success: true, data: undefined };
  if (user.emailVerified) return { success: true, data: undefined };

  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: `verify:${email}` } }),
    prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token: tokenHash(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);
  try {
    await sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Failed to resend verification email", error);
    await prisma.verificationToken.deleteMany({ where: { identifier: `verify:${email}` } }).catch(
      (cleanupError) => {
        console.error("Failed to clean up verification token after email error", cleanupError);
      },
    );
    return { success: false, error: "We couldn't send the email right now. Please try again." };
  }
  return { success: true, data: undefined };
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult<void>> {
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { success: true, data: undefined };
  const email = parsed.data.email.toLowerCase();
  const limit = await consumeRateLimit(email, "password-reset", 3, 3600);
  if (!limit.allowed) return { success: true, data: undefined };
  const user = await prisma.user.findUnique({ where: { email }, include: { credential: true } });
  if (user?.credential) {
    const token = randomBytes(32).toString("hex");
    const verification = await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: tokenHash(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    try {
      await sendPasswordResetEmail(email, token);
    } catch (error) {
      console.error("Failed to send password reset email", error);
      await prisma.verificationToken
        .delete({
          where: {
            identifier_token: { identifier: verification.identifier, token: verification.token },
          },
        })
        .catch((cleanupError) => {
          console.error("Failed to clean up password reset token after email error", cleanupError);
        });
      return { success: false, error: "We couldn't send the email right now. Please try again." };
    }
  }
  return { success: true, data: undefined };
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}): Promise<ActionResult<void>> {
  const parsed = z
    .object({
      email: z.string().email(),
      token: z.string().min(32),
      password: z.string().min(8).max(128),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid reset request." };
  const email = parsed.data.email.toLowerCase();
  const verification = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: { identifier: `reset:${email}`, token: tokenHash(parsed.data.token) },
    },
  });
  if (!verification || verification.expires < new Date()) {
    return { success: false, error: "This reset link has expired. Please request a new one." };
  }
  await prisma.$transaction([
    prisma.credential.update({
      where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email } })).id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: verification.identifier, token: verification.token },
      },
    }),
  ]);
  return { success: true, data: undefined };
}

export async function checkLoginRateLimit(input: { email: string }): Promise<ActionResult<void>> {
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { success: true, data: undefined };
  const email = parsed.data.email.toLowerCase();
  const status = await getRateLimitStatus(email, "login", LOGIN_LIMIT, LOGIN_WINDOW_SECONDS);
  if (!status.allowed) {
    return { success: false, error: "Too many login attempts. Please try again in 15 minutes." };
  }
  return { success: true, data: undefined };
}
