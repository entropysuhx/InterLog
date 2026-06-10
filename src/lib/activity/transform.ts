import type { Prisma } from "@prisma/client";

import { CATEGORY_NAMES, type ActivityView, type CategoryKey } from "@/types";

type ActivityWithCategory = Prisma.ActivityGetPayload<{ include: { category: true } }>;

export function toActivityView(activity: ActivityWithCategory): ActivityView {
  const categoryKey = activity.category.key as CategoryKey;
  return {
    id: activity.id,
    title: activity.title,
    notes: activity.notes,
    startTime: activity.startTime.toISOString(),
    endTime: activity.endTime?.toISOString() ?? null,
    duration: activity.duration,
    categoryKey,
    categoryName: CATEGORY_NAMES[categoryKey],
    categorizationSource: activity.categorizationSource,
    aiConfidence: activity.aiConfidence,
  };
}
