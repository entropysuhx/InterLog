"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, signOut } from "@/lib/auth";
import { sendEmailChangeVerification } from "@/lib/auth/email";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { CATEGORY_IDS, type ActionResult } from "@/types";

const UpdatePreferencesSchema = z
  .object({
    timezone: z.string().min(1).max(64),
    weekStartsOn: z.number().int().min(0).max(6),
    theme: z.enum(["LIGHT", "DARK", "FOCUS"]),
    showMoodInHistory: z.boolean(),
  })
  .strict();

const UpdateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    image: z.string().max(750000).nullable(),
  })
  .strict();

const UpdateWeekStartsOnSchema = z
  .object({ weekStartsOn: z.union([z.literal(0), z.literal(1)]) })
  .strict();

const ChangeEmailSchema = z.object({ email: z.string().trim().email().max(254) }).strict();

const ImportedActivitySchema = z
  .object({
    id: z.string().cuid(),
    userId: z.string().optional(),
    title: z.string().trim().min(1).max(200),
    notes: z.string().max(2000).nullable().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    categoryId: z.string().refine((value) => Object.values(CATEGORY_IDS).includes(value)),
    categorizationSource: z.enum(["AI", "USER", "FALLBACK"]),
    aiConfidence: z.number().min(0).max(1).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const ImportedFocusSessionSchema = z
  .object({
    id: z.string().cuid(),
    userId: z.string().optional(),
    activityId: z.string().cuid().nullable(),
    title: z.string().trim().min(1).max(200),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const ImportExportDataSchema = z
  .object({
    exportedAt: z.string().datetime(),
    activities: z.array(ImportedActivitySchema).max(5000),
    focusSessions: z.array(ImportedFocusSessionSchema).max(2000),
    wrappedSummaries: z.unknown().optional(),
    privacyNote: z.string().optional(),
  })
  .strict();

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function updateProfile(
  input: z.infer<typeof UpdateProfileSchema>,
): Promise<ActionResult<{ name: string | null; image: string | null }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Check your profile details." };
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      image: parsed.data.image,
    },
    select: { name: true, image: true },
  });
  return { success: true, data: user };
}

export async function updatePreferences(
  input: z.infer<typeof UpdatePreferencesSchema>,
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdatePreferencesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid preferences." };
  await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  });
  return { success: true, data: undefined };
}

export async function updateWeekStartsOn(
  input: z.infer<typeof UpdateWeekStartsOnSchema>,
): Promise<ActionResult<{ weekStartsOn: 0 | 1 }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdateWeekStartsOnSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Choose Sunday or Monday." };
  const preference = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: { weekStartsOn: parsed.data.weekStartsOn },
    create: { userId: session.user.id, weekStartsOn: parsed.data.weekStartsOn },
    select: { weekStartsOn: true },
  });
  revalidatePath("/settings");
  revalidatePath("/timeline");
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  return { success: true, data: { weekStartsOn: preference.weekStartsOn as 0 | 1 } };
}

export async function requestEmailChange(
  input: z.infer<typeof ChangeEmailSchema>,
): Promise<ActionResult<{ email: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = ChangeEmailSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };
  const email = parsed.data.email.toLowerCase();
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!currentUser) return { success: false, error: "Account not found." };
  if (currentUser.email?.toLowerCase() === email) {
    return { success: false, error: "That is already your current email address." };
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { success: false, error: "An account already uses that email address." };

  const limit = await consumeRateLimit(session.user.id, "change-email", 3, 15 * 60);
  if (!limit.allowed) return { success: false, error: "Please wait before requesting another email change." };

  const token = randomBytes(32).toString("hex");
  const identifier = `change-email:${session.user.id}:${email}`;
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: tokenHash(token),
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    }),
  ]);
  try {
    await sendEmailChangeVerification(email, token);
  } catch (error) {
    console.error("Failed to send email-change verification", error);
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { success: false, error: "We couldn't send the verification email right now. Please try again." };
  }
  return { success: true, data: { email } };
}

export async function confirmEmailChange(input: {
  email: string;
  token: string;
}): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in to confirm your new email address." };
  const parsed = z
    .object({ email: z.string().email().max(254), token: z.string().min(32) })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid email-change link." };
  const email = parsed.data.email.toLowerCase();
  const identifier = `change-email:${session.user.id}:${email}`;
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: tokenHash(parsed.data.token) } },
  });
  if (!verification || verification.expires < new Date()) {
    return { success: false, error: "This email-change link has expired. Please request a new one." };
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.id !== session.user.id) {
    return { success: false, error: "An account already uses that email address." };
  }
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { email, emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token: verification.token } },
      }),
    ]);
  } catch (error) {
    console.error("Failed to confirm email change", error);
    return { success: false, error: "We couldn't update your email address. Please try again." };
  }
  revalidatePath("/settings");
  return { success: true, data: undefined };
}

export async function importExportedData(
  input: unknown,
): Promise<ActionResult<{ activities: number; focusSessions: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = ImportExportDataSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Choose a valid InterLog export file." };
  try {
    const imported = await prisma.$transaction(async (transaction) => {
      const existingActivities = await transaction.activity.findMany({
        where: { userId: session.user.id, id: { in: parsed.data.activities.map((activity) => activity.id) } },
        select: { id: true },
      });
      const existingActivityIds = new Set(existingActivities.map((activity) => activity.id));
      const activityResult = await transaction.activity.createMany({
        data: parsed.data.activities
          .filter((activity) => !existingActivityIds.has(activity.id))
          .map((activity) => ({
            id: activity.id,
            userId: session.user.id,
            title: activity.title,
            notes: activity.notes ?? null,
            startTime: new Date(activity.startTime),
            endTime: activity.endTime ? new Date(activity.endTime) : null,
            duration: activity.duration,
            categoryId: activity.categoryId,
            categorizationSource: activity.categorizationSource,
            aiConfidence: activity.aiConfidence,
            createdAt: new Date(activity.createdAt),
            updatedAt: new Date(activity.updatedAt),
          })),
        skipDuplicates: true,
      });
      const availableActivities = await transaction.activity.findMany({
        where: { userId: session.user.id, id: { in: parsed.data.activities.map((activity) => activity.id) } },
        select: { id: true },
      });
      const availableActivityIds = new Set(availableActivities.map((activity) => activity.id));
      const existingFocusSessions = await transaction.focusSession.findMany({
        where: { userId: session.user.id, id: { in: parsed.data.focusSessions.map((focus) => focus.id) } },
        select: { id: true },
      });
      const existingFocusSessionIds = new Set(existingFocusSessions.map((focus) => focus.id));
      const focusResult = await transaction.focusSession.createMany({
        data: parsed.data.focusSessions
          .filter((focus) => !existingFocusSessionIds.has(focus.id))
          .map((focus) => ({
            id: focus.id,
            userId: session.user.id,
            activityId: focus.activityId && availableActivityIds.has(focus.activityId) ? focus.activityId : null,
            title: focus.title,
            status: focus.status,
            startTime: new Date(focus.startTime),
            endTime: focus.endTime ? new Date(focus.endTime) : null,
            duration: focus.duration,
            createdAt: new Date(focus.createdAt),
            updatedAt: new Date(focus.updatedAt),
          })),
        skipDuplicates: true,
      });
      return { activities: activityResult.count, focusSessions: focusResult.count };
    });
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: imported };
  } catch (error) {
    console.error("Failed to import exported data", error);
    return { success: false, error: "We couldn't import that file. Your existing data is unchanged." };
  }
}

export async function requestDataExport(): Promise<ActionResult<{ downloadUrl: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  return { success: true, data: { downloadUrl: "/api/export" } };
}

export async function deleteAccount(): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirect: false });
  return { success: true, data: undefined };
}
