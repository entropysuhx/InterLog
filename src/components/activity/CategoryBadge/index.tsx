import {
  BookOpen,
  Brain,
  Coffee,
  Dumbbell,
  Heart,
  Inbox,
  NotebookPen,
  Users,
  Video,
} from "lucide-react";

import type { CategoryBadgeProps } from "@/components/activity/CategoryBadge/CategoryBadge.types";
import { cn } from "@/lib/utils";
import { CATEGORY_NAMES, type CategoryKey } from "@/types";

const styles: Record<CategoryKey, string> = {
  "deep-work": "bg-activity-deep-work-bg border-activity-deep-work-border text-activity-deep-work-icon",
  learning: "bg-activity-learning-bg border-activity-learning-border text-activity-learning-icon",
  reflection: "bg-activity-reflection-bg border-activity-reflection-border text-activity-reflection-icon",
  exercise: "bg-activity-exercise-bg border-activity-exercise-border text-activity-exercise-icon",
  social: "bg-activity-social-bg border-activity-social-border text-activity-social-icon",
  meeting: "bg-activity-meeting-bg border-activity-meeting-border text-activity-meeting-icon",
  admin: "bg-activity-admin-bg border-activity-admin-border text-activity-admin-icon",
  break: "bg-activity-break-bg border-activity-break-border text-activity-break-icon",
  personal: "bg-activity-personal-bg border-activity-personal-border text-activity-personal-icon",
};

const icons: Record<CategoryKey, typeof Brain> = {
  "deep-work": Brain,
  learning: BookOpen,
  reflection: NotebookPen,
  exercise: Dumbbell,
  social: Users,
  meeting: Video,
  admin: Inbox,
  break: Coffee,
  personal: Heart,
};

const selectedStyles: Record<CategoryKey, string> = {
  "deep-work": "bg-activity-deep-work-icon text-white border-activity-deep-work-icon",
  learning: "bg-activity-learning-icon text-white border-activity-learning-icon",
  reflection: "bg-activity-reflection-icon text-white border-activity-reflection-icon",
  exercise: "bg-activity-exercise-icon text-white border-activity-exercise-icon",
  social: "bg-activity-social-icon text-white border-activity-social-icon",
  meeting: "bg-activity-meeting-icon text-white border-activity-meeting-icon",
  admin: "bg-activity-admin-icon text-white border-activity-admin-icon",
  break: "bg-activity-break-icon text-white border-activity-break-icon",
  personal: "bg-activity-personal-icon text-white border-activity-personal-icon",
};

export default function CategoryBadge({ categoryKey, compact = false, selected = false }: CategoryBadgeProps) {
  const Icon = icons[categoryKey];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-ds-4 rounded-full border px-ds-8 py-ds-4 text-caption font-[550]",
        selected ? selectedStyles[categoryKey] : styles[categoryKey],
      )}
    >
      <Icon size={compact ? 12 : 14} aria-hidden="true" />
      {!compact && CATEGORY_NAMES[categoryKey]}
    </span>
  );
}

