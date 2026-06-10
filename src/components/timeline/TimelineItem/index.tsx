import { Clock3, Pencil } from "lucide-react";

import CategoryBadge from "@/components/activity/CategoryBadge";
import type { TimelineItemProps } from "@/components/timeline/TimelineItem/TimelineItem.types";
import { cn, formatDuration, formatTimeRange } from "@/lib/utils";
import type { CategoryKey } from "@/types";

const categoryStyles: Record<CategoryKey, string> = {
  "deep-work": "bg-activity-deep-work-bg border-activity-deep-work-border",
  learning: "bg-activity-learning-bg border-activity-learning-border",
  reflection: "bg-activity-reflection-bg border-activity-reflection-border",
  exercise: "bg-activity-exercise-bg border-activity-exercise-border",
  social: "bg-activity-social-bg border-activity-social-border",
  meeting: "bg-activity-meeting-bg border-activity-meeting-border",
  admin: "bg-activity-admin-bg border-activity-admin-border",
  break: "bg-activity-break-bg border-activity-break-border",
  personal: "bg-activity-personal-bg border-activity-personal-border",
};

export default function TimelineItem({ activity, top, height, onEdit }: TimelineItemProps) {
  const lanes = Math.min(activity.totalLanes, 3);
  const width = activity.totalLanes > 3 ? 100 : 100 / lanes;
  const left = activity.totalLanes > 3 ? 0 : width * activity.laneIndex;
  return (
    <article
      role="article"
      aria-label={`${activity.title}, ${activity.categoryName}, ${formatTimeRange(activity.startTime, activity.endTime)}`}
      tabIndex={0}
      className={cn(
        "absolute overflow-hidden rounded-lg border px-ds-8 py-ds-4 text-text-primary transition-shadow hover:shadow-sm focus-visible:shadow-sm",
        categoryStyles[activity.categoryKey],
        activity.endTime === null && "border-dashed",
      )}
      style={{
        top,
        height,
        left: `calc(${left}% + ${activity.laneIndex > 0 ? "0.125rem" : "0rem"})`,
        width: `calc(${width}% - 0.25rem)`,
      }}
      onClick={() => onEdit?.(activity)}
      onDoubleClick={() => onEdit?.(activity)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit?.(activity);
        }
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-ds-8">
        <p className="truncate text-label font-[550]">{activity.title}</p>
        <div className="flex shrink-0 items-center gap-ds-4">
          <span className="text-caption tabular-nums text-text-secondary">
            {formatDuration(activity.duration)}
          </span>
          {onEdit && (
            <button
              type="button"
              aria-label={`Edit ${activity.title}`}
              className="flex size-touch-target items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(activity);
              }}
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {height >= 52 && (
        <div className="mt-ds-4 flex items-center justify-between gap-ds-8">
          <CategoryBadge categoryKey={activity.categoryKey} compact />
          <span className="flex items-center gap-ds-4 truncate text-caption text-text-muted">
            <Clock3 size={12} aria-hidden="true" />
            {formatTimeRange(activity.startTime, activity.endTime)}
          </span>
        </div>
      )}
      {activity.endTime === null && (
        <span className="text-caption font-[550] text-text-secondary">In progress</span>
      )}
    </article>
  );
}
