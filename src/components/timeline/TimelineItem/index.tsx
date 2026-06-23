import { Pencil } from "lucide-react";

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
  const isCompact = height < 52;

  return (
    <article
      role="article"
      aria-label={`${activity.title}, ${activity.categoryName}, ${formatTimeRange(activity.startTime, activity.endTime)}`}
      tabIndex={0}
      className={cn(
        "absolute z-raised overflow-hidden rounded-lg border px-ds-8 py-ds-4 text-text-primary transition-shadow hover:shadow-sm focus-visible:shadow-sm",
        isCompact ? "flex items-center" : "flex flex-col justify-start",
        categoryStyles[activity.categoryKey],
        activity.isInProgress && "border-dashed",
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
      {isCompact ? (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-ds-8">
          <p className="min-w-0 flex-1 truncate text-label font-[550] leading-tight">{activity.title}</p>
          <span className="shrink-0 text-caption tabular-nums text-text-secondary">
            {formatDuration(activity.duration)}
          </span>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-start justify-between gap-ds-8">
            <div className="flex min-w-0 flex-col gap-ds-4">
              <p className="truncate text-label font-[550] leading-tight pt-[2px]">{activity.title}</p>
              <div className="flex items-center">
                <CategoryBadge categoryKey={activity.categoryKey} compact />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-ds-4">
              <div className="flex items-center gap-ds-4">
                <span className="text-caption tabular-nums text-text-secondary mt-[2px]">
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
              <span className="flex items-center gap-ds-4 truncate text-caption text-text-muted">
                {formatTimeRange(activity.startTime, activity.endTime)}
              </span>
            </div>
          </div>
          {activity.isInProgress && (
            <span className="mt-ds-4 text-caption font-[550] text-text-secondary">In progress</span>
          )}
          {activity.continuesFromPreviousDay && (
            <span className="mt-ds-4 text-caption font-[550] text-text-secondary">
              Continues from previous day
            </span>
          )}
          {activity.continuesIntoNextDay && (
            <span className="mt-ds-4 text-caption font-[550] text-text-secondary">
              Continues into next day
            </span>
          )}
        </>
      )}
    </article>
  );
}
