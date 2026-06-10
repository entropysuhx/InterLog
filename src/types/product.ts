import type { ActivityView } from "@/types/activity";
import type { FocusSessionView } from "@/types/focus";
import type { InsightView } from "@/types/insight";
import type { ReflectionView } from "@/types/reflection";

export type ProductSnapshot = {
  activities: ActivityView[];
  activeFocusSession: FocusSessionView | null;
  reflectionDays: number;
  insights: InsightView[];
  reflections: ReflectionView[];
};
