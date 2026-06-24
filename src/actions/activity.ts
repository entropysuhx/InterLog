"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createActivityForUser, findActivityOverlaps } from "@/lib/activity/service";
import { toActivityView } from "@/lib/activity/transform";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateDuration } from "@/lib/utils";
import {
  CATEGORY_IDS,
  CreateActivitySchema,
  DeleteActivitySchema,
  UpdateActivityCategorySchema,
  UpdateActivitySchema,
  type ActionResult,
  type ActivityMutationResult,
  type ActivityView,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/types";

export async function createActivity(
  input: CreateActivityInput,
): Promise<ActionResult<ActivityMutationResult>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = CreateActivitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid activity details." };
  try {
    const result = await createActivityForUser(session.user.id, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create activity", { userId: session.user.id, error });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        error:
          "We couldn't save this activity because its category is unavailable. Please refresh and try again.",
      };
    }
    return { success: false, error: "We could not save this entry. Your draft is still here." };
  }
}

export async function updateActivity(
  input: UpdateActivityInput,
): Promise<ActionResult<ActivityMutationResult>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdateActivitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid activity details." };
  const startTime = new Date(parsed.data.startTime);
  const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : null;
  try {
    const overlaps = await findActivityOverlaps(
      session.user.id,
      startTime,
      endTime,
      parsed.data.id,
    );
    const activity = await prisma.activity.update({
      where: { id_userId: { id: parsed.data.id, userId: session.user.id } },
      data: {
        title: parsed.data.title,
        notes: parsed.data.notes ?? null,
        startTime,
        endTime,
        duration: endTime ? calculateDuration(startTime, endTime) : null,
        categoryId: parsed.data.categoryKey ? CATEGORY_IDS[parsed.data.categoryKey] : undefined,
        categorizationSource: parsed.data.categoryKey ? "USER" : undefined,
      },
      include: { category: true },
    });
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return {
      success: true,
      data: {
        activity: toActivityView(activity),
        overlappingActivities: overlaps.map(toActivityView),
      },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, error: "Activity not found." };
    }
    return { success: false, error: "We could not update this activity." };
  }
}

export async function deleteActivity(input: { id: string }): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = DeleteActivitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid activity." };
  try {
    await prisma.activity.delete({
      where: { id_userId: { id: parsed.data.id, userId: session.user.id } },
    });
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/calendar");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Activity not found." };
  }
}

export async function updateActivityCategory(input: {
  id: string;
  categoryKey: ActivityView["categoryKey"];
}): Promise<ActionResult<ActivityView>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = UpdateActivityCategorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid category." };
  try {
    const activity = await prisma.activity.update({
      where: { id_userId: { id: parsed.data.id, userId: session.user.id } },
      data: {
        categoryId: CATEGORY_IDS[parsed.data.categoryKey],
        categorizationSource: "USER",
        aiConfidence: null,
      },
      include: { category: true },
    });
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidatePath("/analytics");
    revalidatePath("/wrapped");
    return { success: true, data: toActivityView(activity) };
  } catch {
    return { success: false, error: "Activity not found." };
  }
}
