"use client";

import WrappedExperience from "@/components/wrapped/WrappedExperience";
import { useProductData } from "@/components/providers/ProductDataProvider";

export default function WrappedPage() {
  const { activities, reflectionDays, isAuthenticated, isReady } = useProductData();
  return (
    <div className="space-y-ds-24">
      <header className="text-center">
        <h1 className="text-heading-2 font-[650] text-text-primary">Wrapped</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">
          A factual story of your month{isAuthenticated ? "." : ", generated locally in guest mode."}
        </p>
      </header>
      {isReady ? (
        <WrappedExperience
          activities={activities}
          reflectionDays={reflectionDays}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <div className="mx-auto min-h-panel-lg max-w-reading animate-pulse rounded-2xl bg-surface-subtle" />
      )}
    </div>
  );
}
