import { Clock3, Sparkles } from "lucide-react";
import CategoryBadge from "@/components/activity/CategoryBadge";

export function MockTimelineCard() {
  return (
    <article className="flex w-full max-w-sm flex-col justify-start overflow-hidden rounded-lg border border-activity-deep-work-border bg-activity-deep-work-bg px-ds-8 py-ds-4 text-text-primary shadow-sm h-ds-96 relative">
      <div className="flex min-w-0 items-start justify-between gap-ds-8">
        <div className="flex min-w-0 flex-col gap-ds-4">
          <p className="truncate text-label font-[550] leading-tight pt-[2px]">Deep Work: Landing Page</p>
          <div className="flex items-center">
            <CategoryBadge categoryKey="deep-work" compact />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-ds-4">
          <div className="flex items-center gap-ds-4">
            <span className="text-caption tabular-nums text-text-secondary mt-[2px]">
              2h 45m
            </span>
          </div>
          <span className="flex items-center gap-ds-4 truncate text-caption text-text-muted">
            <Clock3 size={12} aria-hidden="true" />
            09:00 AM - 11:45 AM
          </span>
        </div>
      </div>
    </article>
  );
}

export function MockInsightCard({ type }: { type: "reflection" | "noticing" | "letter" }) {
  if (type === "reflection") {
    return (
      <article className="rounded-xl border border-border bg-surface p-ds-16 shadow-sm">
        <div className="flex items-center gap-ds-8 border-b border-border pb-ds-12">
          <Sparkles size={16} className="text-interactive-primary" aria-hidden="true" />
          <h3 className="text-label font-[550] text-text-primary">AI Reflection</h3>
        </div>
        <div className="mt-ds-12 space-y-ds-8">
          <p className="text-body-sm text-text-secondary">
            You consistently scheduled deep work sessions before noon this week. This rhythm seems to protect your energy for harder tasks.
          </p>
        </div>
      </article>
    );
  }
  
  if (type === "noticing") {
    return (
      <article className="rounded-xl border border-border bg-surface p-ds-16 shadow-sm">
        <div className="flex items-center gap-ds-8 border-b border-border pb-ds-12">
          <span className="text-interactive-primary">👀</span>
          <h3 className="text-label font-[550] text-text-primary">One Thing Worth Noticing</h3>
        </div>
        <div className="mt-ds-12 space-y-ds-8">
          <p className="text-body-sm text-text-secondary">
            When you log "Learning React" after 4 PM, your sessions are typically 50% shorter than when you log them in the morning.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-ds-16 shadow-sm">
      <div className="flex items-center gap-ds-8 border-b border-border pb-ds-12">
        <span className="text-interactive-primary">💌</span>
        <h3 className="text-label font-[550] text-text-primary">Letter From Your Week</h3>
      </div>
      <div className="mt-ds-12 space-y-ds-8">
        <p className="text-body-sm text-text-secondary">
          It was a week of quiet progress. You spent over 12 hours doing focused work, yet you still made time to step away and reflect. You're building a sustainable pace.
        </p>
      </div>
    </article>
  );
}
