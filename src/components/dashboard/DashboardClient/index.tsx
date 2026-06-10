"use client";

import { Brain, Clock3, NotebookPen } from "lucide-react";
import { useMemo } from "react";

import { startFocusSession } from "@/actions/focus";
import ActivityComposer from "@/components/activity/ActivityComposer";
import RegistrationPrompt from "@/components/guest/RegistrationPrompt";
import { useProductData } from "@/components/providers/ProductDataProvider";
import ReflectionCard from "@/components/reflection/ReflectionCard";
import FocusTimer from "@/components/timer/FocusTimer";
import TimelineView from "@/components/timeline/TimelineView";
import { calculateAnalytics } from "@/lib/analytics/calculate";
import { guestStore } from "@/lib/guest/store";
import { formatDuration, toDateKey } from "@/lib/utils";

export default function DashboardClient() {
  const {
    activities,
    reflections,
    reflectionDays,
    activeFocusSession,
    isAuthenticated,
    isReady,
    refresh,
  } = useProductData();
  const today = toDateKey(new Date());
  const todayActivities = activities.filter(
    (activity) => toDateKey(new Date(activity.startTime)) === today,
  );
  const analytics = useMemo(
    () => calculateAnalytics(todayActivities, 1),
    [todayActivities],
  );
  const stats = [
    { label: "Tracked", value: formatDuration(analytics.totalTrackedSeconds), icon: Clock3 },
    { label: "Focus", value: formatDuration(analytics.focusSeconds), icon: Brain },
    { label: "Reflection days", value: String(reflectionDays), icon: NotebookPen },
  ];

  if (!isReady) {
    return <div className="min-h-ds-96 animate-pulse rounded-lg bg-surface-subtle" />;
  }

  return (
    <div className="space-y-ds-20">
      <header>
        <p className="text-body-sm text-text-muted">{new Date().toLocaleDateString(undefined, { dateStyle: "full" })}</p>
        <h1 className="mt-ds-4 text-heading-2 font-[650] text-text-primary">Good to see you.</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">Notice your time, then decide what it means.</p>
      </header>
      {!isAuthenticated && <RegistrationPrompt />}
      <div className="dashboard-grid gap-ds-12">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="col-span-12 rounded-lg border border-border bg-surface p-ds-20 sm:col-span-4">
              <div className="flex items-center gap-ds-8 text-label text-text-muted">
                <Icon size={18} className="text-interactive-primary" aria-hidden="true" />
                {stat.label}
              </div>
              <p className="mt-ds-8 text-heading-2 font-[650] tabular-nums text-text-primary">{stat.value}</p>
            </article>
          );
        })}
      </div>
      {activeFocusSession ? (
        <FocusTimer
          session={activeFocusSession}
          isAuthenticated={isAuthenticated}
          onComplete={refresh}
        />
      ) : (
        <ActivityComposer
          isAuthenticated={isAuthenticated}
          onActivityCreated={refresh}
          onStartFocus={async (title) => {
            if (isAuthenticated) {
              await startFocusSession({ title, startTime: new Date().toISOString() });
            } else {
              guestStore.createFocusSession(title);
            }
            refresh();
          }}
        />
      )}
      <div className="app-main-grid gap-ds-20">
        <TimelineView
          activities={activities}
          isAuthenticated={isAuthenticated}
          onChanged={refresh}
        />
        <div className="space-y-ds-20">
          <ReflectionCard
            activities={todayActivities}
            date={today}
            isAuthenticated={isAuthenticated}
            savedReflections={reflections.filter((reflection) => reflection.activityDate === today)}
            compact
            onSaved={refresh}
          />
          <article className="rounded-xl border border-border bg-surface p-ds-20">
            <p className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
              <Brain size={18} className="text-interactive-primary" aria-hidden="true" />
              Today&apos;s pattern
            </p>
            <p className="mt-ds-12 text-body-sm text-text-secondary">
              {analytics.focusSeconds > 0
                ? `${Math.round((analytics.focusSeconds / Math.max(1, analytics.totalTrackedSeconds)) * 100)}% of your tracked time was deep work.`
                : "Log a few activities and a useful pattern will appear here."}
            </p>
            <p className="mt-ds-12 text-caption text-text-muted">Based only on activity timing and categories.</p>
          </article>
        </div>
      </div>
    </div>
  );
}
