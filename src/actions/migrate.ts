"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  CATEGORY_IDS,
  GuestActivitySchema,
  GuestFocusSessionSchema,
  GuestReflectionSchema,
  type ActionResult,
} from "@/types";

const MigrateGuestDataSchema = z
  .object({
    version: z.literal(1),
    guestId: z.string().min(1).max(64),
    idempotencyKey: z.string().min(16).max(128),
    activities: z.array(GuestActivitySchema).max(5000),
    reflections: z.array(GuestReflectionSchema).max(1000),
    focusSessions: z.array(GuestFocusSessionSchema).max(2000),
  })
  .strict();

export type MigrateGuestDataInput = z.infer<typeof MigrateGuestDataSchema>;

export async function migrateGuestData(
  input: MigrateGuestDataInput,
): Promise<ActionResult<{ importedCount: number; alreadyImported: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = MigrateGuestDataSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Guest migration validation failed", parsed.error.flatten());
    return { success: false, error: "We couldn't import your guest data right now." };
  }
  const existing = await prisma.guestMigration.findUnique({
    where: { idempotencyKey: parsed.data.idempotencyKey },
  });
  if (existing) {
    return {
      success: true,
      data: { importedCount: existing.importedCount, alreadyImported: true },
    };
  }
  try {
    const activityIds = new Set(parsed.data.activities.map((activity) => activity.id));
    const importedCount = await prisma.$transaction(async (transaction) => {
      const activities = await transaction.activity.createMany({
        data: parsed.data.activities.map((activity) => ({
          id: activity.id,
          userId: session.user.id,
          title: activity.title,
          startTime: new Date(activity.startTime),
          endTime: activity.endTime ? new Date(activity.endTime) : null,
          duration: activity.duration,
          categoryId: CATEGORY_IDS[activity.categoryKey],
          categorizationSource: activity.categorizationSource,
          aiConfidence: activity.aiConfidence,
          createdAt: new Date(activity.createdAt),
          updatedAt: new Date(activity.updatedAt),
        })),
        skipDuplicates: true,
      });
      const reflections = await transaction.reflection.createMany({
        data: parsed.data.reflections.map((reflection) => ({
          id: reflection.id,
          userId: session.user.id,
          activityDate: reflection.activityDate,
          prompt: reflection.prompt,
          answer: reflection.answer,
          createdAt: new Date(reflection.createdAt),
          updatedAt: new Date(reflection.updatedAt),
        })),
        skipDuplicates: true,
      });
      const focuses = await transaction.focusSession.createMany({
        data: parsed.data.focusSessions.map((focus) => ({
          id: focus.id,
          userId: session.user.id,
          activityId:
            focus.activityId && activityIds.has(focus.activityId) ? focus.activityId : null,
          title: focus.title,
          startTime: new Date(focus.startTime),
          endTime: focus.endTime ? new Date(focus.endTime) : null,
          duration: focus.duration,
          status: focus.status,
        })),
        skipDuplicates: true,
      });
      const count = activities.count + reflections.count + focuses.count;
      await transaction.guestMigration.create({
        data: {
          userId: session.user.id,
          guestId: parsed.data.guestId,
          idempotencyKey: parsed.data.idempotencyKey,
          importedCount: count,
        },
      });
      return count;
    });
    return { success: true, data: { importedCount, alreadyImported: false } };
  } catch (error) {
    console.error("Guest migration failed", error);
    return { success: false, error: "We couldn't import your guest data right now." };
  }
}
