"use server";

import { revalidatePath } from "next/cache";

import { toActivityView } from "@/lib/activity/transform";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateDuration } from "@/lib/utils";
import {
  CancelFocusSessionSchema,
  CATEGORY_IDS,
  CompleteFocusSessionSchema,
  StartFocusSessionSchema,
  type ActionResult,
  type ActivityView,
  type FocusSessionView,
} from "@/types";

export async function startFocusSession(input: {
  title: string;
  startTime: string;
}): Promise<ActionResult<FocusSessionView>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = StartFocusSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a focus activity." };
  const existing = await prisma.focusSession.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });
  if (existing) return { success: false, error: "A focus session is already running." };
  const focus = await prisma.focusSession.create({
    data: { userId: session.user.id, ...parsed.data, startTime: new Date(parsed.data.startTime) },
  });
  return {
    success: true,
    data: {
      ...focus,
      startTime: focus.startTime.toISOString(),
      endTime: null,
      status: focus.status,
    },
  };
}

export async function completeFocusSession(input: {
  id: string;
  endTime: string;
  title: string;
  categoryKey: ActivityView["categoryKey"];
  notes?: string | null;
}): Promise<ActionResult<ActivityView>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = CompleteFocusSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid focus session." };
  const focus = await prisma.focusSession.findUnique({
    where: { id_userId: { id: parsed.data.id, userId: session.user.id } },
  });
  if (!focus || focus.status !== "ACTIVE") {
    return { success: false, error: "Focus session not found." };
  }
  const endTime = new Date(parsed.data.endTime);
  if (endTime <= focus.startTime) return { success: false, error: "Invalid end time." };
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const activity = await transaction.activity.create({
        data: {
          userId: session.user.id,
          title: parsed.data.title,
          notes: parsed.data.notes ?? null,
          startTime: focus.startTime,
          endTime,
          duration: calculateDuration(focus.startTime, endTime),
          categoryId: CATEGORY_IDS[parsed.data.categoryKey],
          categorizationSource: "USER",
          aiConfidence: null,
        },
        include: { category: true },
      });
      await transaction.focusSession.update({
        where: { id_userId: { id: focus.id, userId: session.user.id } },
        data: {
          activityId: activity.id,
          status: "COMPLETED",
          endTime,
          duration: calculateDuration(focus.startTime, endTime),
        },
      });
      return activity;
    });
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    return { success: true, data: toActivityView(result) };
  } catch {
    return { success: false, error: "We could not complete this focus session." };
  }
}

export async function cancelFocusSession(input: { id: string }): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = CancelFocusSessionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid focus session." };
  try {
    await prisma.focusSession.update({
      where: { id_userId: { id: parsed.data.id, userId: session.user.id } },
      data: { status: "CANCELLED", endTime: new Date() },
    });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Focus session not found." };
  }
}
