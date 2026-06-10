"use client";

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-ds-24">
      <h1 className="text-heading-3 font-semibold text-text-primary">This view could not be loaded.</h1>
      <p className="mt-ds-8 text-body-sm text-text-secondary">Your local data is still here.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-ds-16 min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
      >
        Try again
      </button>
    </section>
  );
}

