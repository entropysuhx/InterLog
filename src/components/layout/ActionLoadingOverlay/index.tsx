"use client";

import { Loader2 } from "lucide-react";

type ActionLoadingOverlayProps = {
  title: string;
  subtitle: string;
};

export default function ActionLoadingOverlay({ title, subtitle }: ActionLoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-tooltip flex items-center justify-center bg-overlay p-ds-16"
      role="presentation"
    >
      <section
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        aria-busy="true"
        className="w-full max-w-lg rounded-xl bg-surface-elevated p-ds-24 text-center shadow-xl animate-in motion-reduce:animate-none"
      >
        <Loader2
          size={28}
          aria-hidden="true"
          className="mx-auto animate-spin text-interactive-primary motion-reduce:animate-none"
        />
        <h2 className="mt-ds-16 text-heading-3 font-semibold text-text-primary">{title}</h2>
        <p className="mt-ds-8 text-body-sm text-text-secondary">{subtitle}</p>
      </section>
    </div>
  );
}
