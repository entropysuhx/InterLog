import { endOfDay, startOfDay } from "date-fns";

import { categorizeActivity } from "@/lib/ai/categorize";
import { toActivityView } from "@/lib/activity/transform";
import { prisma } from "@/lib/db";
import { calculateDuration } from "@/lib/utils";
import { CATEGORY_IDS, type ActivityMutationResult, type CreateActivityInput } from "@/types";

export async function findActivityOverlaps(
  userId: string,
  startTime: Date,
  endTime: Date | null,
  excludeId?: string,
) {
  const comparisonEnd = endTime ?? new Date(startTime.getTime() + 60000);
  return prisma.activity.findMany({
    where: {
      userId,
      id: excludeId ? { not: excludeId } : undefined,
      startTime: { lt: comparisonEnd },
      OR: [{ endTime: { gt: startTime } }, { endTime: null }],
    },
    include: { category: true },
    orderBy: { startTime: "asc" },
  });
}

export async function createActivityForUser(
  userId: string,
  input: CreateActivityInput,
): Promise<ActivityMutationResult> {
  const startTime = new Date(input.startTime);
  const endTime = input.endTime ? new Date(input.endTime) : null;
  const category = input.categoryKey
    ? {
        categoryId: CATEGORY_IDS[input.categoryKey],
        confidence: null,
        source: "USER" as const,
      }
    : await categorizeActivity(input.title);
  const overlaps = await findActivityOverlaps(userId, startTime, endTime);
  const activity = await prisma.activity.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      startTime,
      endTime,
      duration: endTime ? calculateDuration(startTime, endTime) : null,
      categoryId: category.categoryId,
      categorizationSource: category.source,
      aiConfidence: category.confidence,
    },
    include: { category: true },
  });
  return {
    activity: toActivityView(activity),
    overlappingActivities: overlaps.map(toActivityView),
  };
}

export async function getActivitiesForDay(userId: string, date: Date) {
  return prisma.activity.findMany({
    where: {
      userId,
      startTime: { gte: startOfDay(date), lte: endOfDay(date) },
    },
    include: { category: true },
    orderBy: { startTime: "asc" },
  });
}
