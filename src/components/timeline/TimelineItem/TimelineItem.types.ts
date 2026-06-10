import type { TimelineActivity } from "@/lib/timeline/layout";

export type TimelineItemProps = {
  activity: TimelineActivity;
  top: number;
  height: number;
  onEdit?: (activity: TimelineActivity) => void;
};

