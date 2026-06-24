"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";

type ActionToastProps = {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
};

export default function ActionToast({ message, tone, onDismiss }: ActionToastProps) {
  if (!message) return null;

  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className="fixed right-ds-16 top-ds-80 z-toast flex w-full max-w-sm items-start gap-ds-12 rounded-lg bg-surface-elevated p-ds-16 shadow-lg animate-in motion-reduce:animate-none"
    >
      {isError ? (
        <CircleAlert size={20} aria-hidden="true" className="shrink-0 text-status-error" />
      ) : (
        <CheckCircle2 size={20} aria-hidden="true" className="shrink-0 text-status-success" />
      )}
      <p className="min-w-0 flex-1 text-body-sm text-text-primary">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="flex size-touch-target shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
