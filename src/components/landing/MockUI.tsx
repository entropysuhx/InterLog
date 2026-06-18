import { BarChart3, CalendarDays, Clock3, NotebookPen, Sparkles, TrendingUp } from "lucide-react";
import CategoryBadge from "@/components/activity/CategoryBadge";

export function MockTimelineCard() {
  return (
    <article className="relative flex h-ds-96 w-full max-w-full flex-col justify-start overflow-hidden rounded-lg border border-activity-deep-work-border bg-activity-deep-work-bg px-ds-8 py-ds-4 text-text-primary shadow-sm sm:max-w-sm">
      <div className="flex min-w-0 items-start justify-between gap-ds-8">
        <div className="flex min-w-0 flex-1 flex-col gap-ds-4">
          <p className="truncate text-label font-[550] leading-tight pt-[2px]">
            Deep Work: Landing Page
          </p>
          <div className="flex items-center">
            <CategoryBadge categoryKey="deep-work" compact />
          </div>
        </div>
        <div className="flex min-w-0 max-w-[48%] shrink flex-col items-end gap-ds-4 sm:max-w-none sm:shrink-0">
          <div className="flex items-center gap-ds-4">
            <span className="text-caption tabular-nums text-text-secondary mt-[2px]">2h 45m</span>
          </div>
          <span className="flex max-w-full items-center gap-ds-4 truncate text-caption text-text-muted">
            <Clock3 size={12} aria-hidden="true" />
            <span className="truncate">09:00 AM - 11:45 AM</span>
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
            You consistently scheduled deep work sessions before noon this week. This rhythm seems
            to protect your energy for harder tasks.
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
            When you log &ldquo;Learning React&rdquo; after 4 PM, your sessions are typically 50%
            shorter than when you log them in the morning.
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
          It was a week of quiet progress. You spent over 12 hours doing focused work, yet you still
          made time to step away and reflect. You&rsquo;re building a sustainable pace.
        </p>
      </div>
    </article>
  );
}

const chartBars = [
  "h-ds-24",
  "h-ds-40",
  "h-ds-32",
  "h-ds-64",
  "h-ds-48",
  "h-ds-80",
  "h-ds-56",
];

export function MockInsightsChartCard() {
  return (
    <article className="rounded-xl border border-border bg-surface p-ds-20 shadow-md">
      <div className="flex items-start justify-between gap-ds-16">
        <div>
          <p className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
            <BarChart3 size={18} className="text-interactive-primary" aria-hidden="true" />
            Weekly Time Tracked
          </p>
          <p className="mt-ds-4 text-caption text-text-muted">Patterns across your logged week</p>
        </div>
        <span className="rounded-full bg-surface-subtle px-ds-12 py-ds-4 text-caption text-text-secondary">
          +12%
        </span>
      </div>
      <div className="mt-ds-24 flex h-ds-96 items-end gap-ds-8 border-b border-border pb-ds-8">
        {chartBars.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-ds-8">
            <span
              className={`${height} w-full rounded-t-md bg-interactive-primary/20 ring-1 ring-interactive-primary/30`}
            />
          </div>
        ))}
      </div>
      <div className="mt-ds-8 grid grid-cols-7 gap-ds-4 text-center text-caption text-text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-ds-20 grid gap-ds-8 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-subtle p-ds-12">
          <p className="text-caption text-text-muted">Deep work</p>
          <p className="mt-ds-4 text-heading-4 font-semibold tabular-nums text-text-primary">
            12h 40m
          </p>
        </div>
        <div className="rounded-lg bg-surface-subtle p-ds-12">
          <p className="text-caption text-text-muted">Best rhythm</p>
          <p className="mt-ds-4 text-label font-[550] text-text-primary">Before noon</p>
        </div>
      </div>
    </article>
  );
}

export function MockReflectionJournalCard() {
  return (
    <article className="rounded-xl border border-border bg-surface p-ds-20 shadow-md">
      <div className="flex items-center justify-between gap-ds-16 border-b border-border pb-ds-12">
        <p className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
          <NotebookPen size={18} className="text-interactive-primary" aria-hidden="true" />
          End-of-day reflection
        </p>
        <span className="rounded-full bg-surface-subtle px-ds-12 py-ds-4 text-caption text-text-muted">
          Saved
        </span>
      </div>
      <div className="mt-ds-16 space-y-ds-12">
        <p className="text-body-sm text-text-primary">What felt meaningful today?</p>
        <div className="rounded-lg border border-border bg-background p-ds-16">
          <p className="text-body-sm leading-relaxed text-text-secondary">
            The best part of the day was noticing that my focused work felt easier after a slower
            morning. I want to remember that pace helped more than pressure.
          </p>
        </div>
        <div className="flex items-center gap-ds-8 text-caption text-text-muted">
          <CalendarDays size={14} aria-hidden="true" />
          6 reflection days this month
        </div>
      </div>
    </article>
  );
}

export function MockPatternCard() {
  return (
    <article className="rounded-xl border border-border bg-surface p-ds-20 shadow-md">
      <div className="flex items-center gap-ds-8">
        <span className="flex size-ds-40 items-center justify-center rounded-lg bg-surface-subtle text-interactive-primary">
          <TrendingUp size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-label font-[550] text-text-primary">One Thing Worth Noticing</p>
          <p className="text-caption text-text-muted">Across 8 focus sessions</p>
        </div>
      </div>
      <p className="mt-ds-16 text-body-sm leading-relaxed text-text-secondary">
        Your learning sessions were{" "}
        <span className="rounded-md bg-interactive-primary/10 px-ds-4 font-[550] text-interactive-primary">
          50% shorter
        </span>{" "}
        after 4 PM than in the morning.
      </p>
      <div className="mt-ds-16 rounded-lg bg-surface-subtle p-ds-12">
        <p className="flex items-center gap-ds-8 text-caption text-text-secondary">
          <Sparkles size={14} className="text-interactive-primary" aria-hidden="true" />
          A small experiment: protect one morning block for learning next week.
        </p>
      </div>
    </article>
  );
}

export function MockWeekLetterCard() {
  return (
    <article className="rounded-xl border border-border bg-surface p-ds-20 shadow-md">
      <div className="flex items-center gap-ds-8 border-b border-border pb-ds-12">
        <NotebookPen size={18} className="text-interactive-primary" aria-hidden="true" />
        <h3 className="text-label font-[550] text-text-primary">Letter From Your Week</h3>
      </div>
      <div className="mt-ds-12 space-y-ds-8">
        <p className="text-body-sm leading-relaxed text-text-secondary">
          It was a week of quiet progress. You spent over 12 hours doing focused work, yet you still
          made time to step away and reflect. You&rsquo;re building a sustainable pace.
        </p>
      </div>
    </article>
  );
}
