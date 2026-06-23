import type { TimelineActivity, TimelineDisplayActivity } from "@/lib/timeline/layout";

export type TimelineItemProps = {
  activity: TimelineActivity<TimelineDisplayActivity>;
  top: number;
  height: number;
  onEdit?: (activity: TimelineActivity<TimelineDisplayActivity>) => void;
};
