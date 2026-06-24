"use server";

import { createHash, randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, signOut } from "@/lib/auth";
import { sendEmailChangeVerification } from "@/lib/auth/email";
import { prisma } from "@/lib/db";
import { ImportExportDataSchema } from "@/lib/import/export-schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { type ActionResult } from "@/types";

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
const ResetUserDataSchema = z.object({ confirmation: z.literal("DELETE") }).strict();

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function importedActivityKey(activity: {
  title: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  categoryId: string;
}): string {
  return [
    activity.title,
    activity.startTime.toISOString(),
    activity.endTime?.toISOString() ?? "",
    activity.duration ?? "",
    activity.categoryId,
  ].join("|");
}

function importedFocusSessionKey(session: {
  title: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
}): string {
  return [
    session.title,
    session.status,
    session.startTime.toISOString(),
    session.endTime?.toISOString() ?? "",
    session.duration ?? "",
  ].join("|");
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
  if (!limit.allowed)
    return { success: false, error: "Please wait before requesting another email change." };

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
    return {
      success: false,
      error: "We couldn't send the verification email right now. Please try again.",
    };
  }
  return { success: true, data: { email } };
}

export async function confirmEmailChange(input: {
  email: string;
  token: string;
}): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, error: "Sign in to confirm your new email address." };
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
    return {
      success: false,
      error: "This email-change link has expired. Please request a new one.",
    };
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

export async function importExportedData(input: unknown): Promise<
  ActionResult<{
    activities: number;
    focusSessions: number;
    skippedActivities: number;
    skippedFocusSessions: number;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = ImportExportDataSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Invalid InterLog export file", {
      issues: parsed.error.issues.map((issue) => ({ code: issue.code, path: issue.path })),
    });
    return { success: false, error: "Choose a valid InterLog export file." };
  }
  try {
    const existingActivities = await prisma.activity.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        duration: true,
        categoryId: true,
      },
    });
    const activityIdsByKey = new Map(
      existingActivities.map((activity) => [importedActivityKey(activity), activity.id]),
    );
    const importedActivityIds = new Map<string, string>();
    let activityCount = 0;
    let skippedActivities = 0;

    for (const activity of parsed.data.activities) {
      const activityData = {
        title: activity.title,
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : null,
        duration: activity.duration,
        categoryId: activity.categoryId,
      };
      const key = importedActivityKey(activityData);
      const existingId = activityIdsByKey.get(key);
      if (existingId) {
        importedActivityIds.set(activity.id, existingId);
        continue;
      }
      try {
        const created = await prisma.activity.create({
          data: {
            userId: session.user.id,
            ...activityData,
            notes: activity.notes ?? null,
            categorizationSource: activity.categorizationSource,
            aiConfidence: activity.aiConfidence,
            createdAt: new Date(activity.createdAt),
            updatedAt: new Date(activity.updatedAt),
          },
          select: { id: true },
        });
        activityIdsByKey.set(key, created.id);
        importedActivityIds.set(activity.id, created.id);
        activityCount += 1;
      } catch (error) {
        skippedActivities += 1;
        console.error("Failed to import activity", {
          userId: session.user.id,
          sourceActivityId: activity.id,
          error,
        });
      }
    }

    const existingFocusSessions = await prisma.focusSession.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
      },
    });
    const focusIdsByKey = new Map(
      existingFocusSessions.map((focus) => [importedFocusSessionKey(focus), focus.id]),
    );
    let focusSessionCount = 0;
    let skippedFocusSessions = 0;

    for (const focus of parsed.data.focusSessions) {
      const focusData = {
        title: focus.title,
        status: focus.status,
        startTime: new Date(focus.startTime),
        endTime: focus.endTime ? new Date(focus.endTime) : null,
        duration: focus.duration,
      };
      const key = importedFocusSessionKey(focusData);
      if (focusIdsByKey.has(key)) continue;
      try {
        const created = await prisma.focusSession.create({
          data: {
            userId: session.user.id,
            ...focusData,
            activityId: focus.activityId
              ? (importedActivityIds.get(focus.activityId) ?? null)
              : null,
            createdAt: new Date(focus.createdAt),
            updatedAt: new Date(focus.updatedAt),
          },
          select: { id: true },
        });
        focusIdsByKey.set(key, created.id);
        focusSessionCount += 1;
      } catch (error) {
        skippedFocusSessions += 1;
        console.error("Failed to import focus session", {
          userId: session.user.id,
          sourceFocusSessionId: focus.id,
          error,
        });
      }
    }

    const imported = {
      activities: activityCount,
      focusSessions: focusSessionCount,
      skippedActivities,
      skippedFocusSessions,
    };
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: imported };
  } catch (error) {
    console.error("Failed to import exported data", {
      userId: session.user.id,
      error,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        error:
          "This account is missing InterLog activity categories. Please contact support before importing.",
      };
    }
    return {
      success: false,
      error: "We couldn't import that file. Your existing data is unchanged.",
    };
  }
}

export async function requestDataExport(): Promise<ActionResult<{ downloadUrl: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  return { success: true, data: { downloadUrl: "/api/export" } };
}

export async function resetUserData(input: { confirmation: string }): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = ResetUserDataSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Type DELETE to reset your data." };

  try {
    await prisma.$transaction([
      prisma.focusSession.deleteMany({ where: { userId: session.user.id } }),
      prisma.activity.deleteMany({ where: { userId: session.user.id } }),
      prisma.moodEntry.deleteMany({ where: { userId: session.user.id } }),
      prisma.reflection.deleteMany({ where: { userId: session.user.id } }),
      prisma.reflectionDay.deleteMany({ where: { userId: session.user.id } }),
      prisma.insightFeedback.deleteMany({ where: { userId: session.user.id } }),
      prisma.insight.deleteMany({ where: { userId: session.user.id } }),
      prisma.wrappedSummary.deleteMany({ where: { userId: session.user.id } }),
      prisma.guestMigration.deleteMany({ where: { userId: session.user.id } }),
    ]);
  } catch (error) {
    console.error("Failed to reset user data", { userId: session.user.id, error });
    return { success: false, error: "We couldn't reset your data right now. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/calendar");
  revalidatePath("/reflection");
  revalidatePath("/analytics");
  revalidatePath("/wrapped");
  revalidatePath("/settings");
  return { success: true, data: undefined };
}

export async function deleteAccount(): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  await prisma.user.delete({ where: { id: session.user.id } });
  await signOut({ redirect: false });
  return { success: true, data: undefined };
}
