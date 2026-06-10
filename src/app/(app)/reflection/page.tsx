"use client";

import ReflectionCard from "@/components/reflection/ReflectionCard";
import TimelineView from "@/components/timeline/TimelineView";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { toDateKey } from "@/lib/utils";

export default function ReflectionPage() {
  const { activities, reflections, reflectionDays, isAuthenticated, isReady, refresh } = useProductData();
  const date = toDateKey(new Date());
  const today = activities.filter((activity) => toDateKey(new Date(activity.startTime)) === date);
  return (
    <div className="space-y-ds-24">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Reflection</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">{reflectionDays} reflection days.</p>
      </header>
      {isReady ? (
        <div className="grid gap-ds-20 xl:grid-cols-2">
          <ReflectionCard
            activities={today}
            date={date}
            isAuthenticated={isAuthenticated}
            savedReflections={reflections.filter((reflection) => reflection.activityDate === date)}
            onSaved={refresh}
          />
          <TimelineView activities={today} showActions={false} />
        </div>
      ) : (
        <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />
      )}
    </div>
  );
}
