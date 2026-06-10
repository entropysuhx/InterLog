"use client";

import { Pause, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cancelFocusSession, completeFocusSession } from "@/actions/focus";
import CategoryBadge from "@/components/activity/CategoryBadge";
import { guestStore } from "@/lib/guest/store";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { formatTimerDuration } from "@/lib/utils";
import { CATEGORY_KEYS, type CategoryKey, type FocusSessionView, type GuestFocusSession } from "@/types";

type FocusTimerProps = {
  session: GuestFocusSession | FocusSessionView;
  isAuthenticated?: boolean;
  onComplete: () => void;
};

export default function FocusTimer({
  session,
  isAuthenticated = false,
  onComplete,
}: FocusTimerProps) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)),
  );
  const [stoppedAt, setStoppedAt] = useState<string | null>(null);
  const [title, setTitle] = useState(session.title);
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("deep-work");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useDialogFocus(Boolean(stoppedAt), dialogRef, () => setStoppedAt(null));

  useEffect(() => {
    if (stoppedAt) return;
    const interval = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session.startTime, stoppedAt]);

  useEffect(() => {
    if (stoppedAt) window.setTimeout(() => closeButtonRef.current?.focus(), 0);
  }, [stoppedAt]);

  async function handleConfirm() {
    if (!stoppedAt || !title.trim()) return;
    setIsSaving(true);
    if (isAuthenticated) {
      const result = await completeFocusSession({
        id: session.id,
        endTime: stoppedAt,
        title: title.trim(),
        categoryKey,
        notes: notes.trim() || null,
      });
      if (!result.success) {
        setStatus(result.error);
        setIsSaving(false);
        return;
      }
    } else {
      guestStore.completeFocusSession(session.id, {
        endTime: stoppedAt,
        title: title.trim(),
        categoryKey,
        notes: notes.trim() || null,
      });
    }
    onComplete();
  }

  async function handleCancelSession() {
    if (isAuthenticated) {
      await cancelFocusSession({ id: session.id });
    } else {
      guestStore.cancelFocusSession(session.id);
    }
    onComplete();
  }

  return (
    <>
      <section className="rounded-xl border border-border-active bg-surface p-ds-20" aria-label="Active focus session">
        <div className="flex flex-col gap-ds-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-caption font-[550] uppercase text-interactive-primary">Focus in progress</p>
            <h2 className="mt-ds-4 text-heading-4 font-semibold text-text-primary">{session.title}</h2>
          </div>
          <div className="text-display-m font-[650] tabular-nums text-text-primary" aria-live="off">
            {formatTimerDuration(elapsed)}
          </div>
          <div className="flex gap-ds-8">
            <button
              type="button"
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-12 text-label text-text-secondary"
              disabled
            >
              <Pause size={16} aria-hidden="true" />
              Pause
            </button>
            <button
              type="button"
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse"
              onClick={() => setStoppedAt(new Date().toISOString())}
            >
              <Square size={16} aria-hidden="true" />
              Stop
            </button>
            <button
              type="button"
              aria-label="Cancel focus session"
              className="flex size-touch-target items-center justify-center rounded-md border border-border text-text-muted"
              onClick={() => void handleCancelSession()}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{stoppedAt ? "Focus timer stopped. Review before saving." : ""}</p>
      </section>

      {stoppedAt && (
        <div className="fixed inset-0 z-modal flex items-end justify-center bg-overlay p-ds-16 sm:items-center">
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-complete-title"
            className="max-h-full w-full max-w-reading overflow-y-auto rounded-xl bg-surface-elevated p-ds-20 shadow-xl animate-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="focus-complete-title" className="text-heading-3 font-semibold text-text-primary">
                  Review focus activity
                </h2>
                <p className="mt-ds-4 text-body-sm text-text-muted">
                  Nothing is saved until you confirm.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Resume focus timer"
                className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
                onClick={() => setStoppedAt(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-ds-20 space-y-ds-16">
              <label className="block">
                <span className="mb-ds-8 block text-label font-[550] text-text-secondary">Activity title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
                />
              </label>
              <fieldset>
                <legend className="text-label font-[550] text-text-secondary">Category</legend>
                <div className="mt-ds-8 flex flex-wrap gap-ds-8">
                  {CATEGORY_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={categoryKey === key}
                      onClick={() => setCategoryKey(key)}
                      className="min-h-touch-target rounded-full"
                    >
                      <CategoryBadge categoryKey={key} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-ds-8 block text-label font-[550] text-text-secondary">
                  Notes <span className="text-caption text-text-muted">(optional)</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-md border border-border bg-background p-ds-12 text-body-sm text-text-primary"
                />
              </label>
              <p className="text-caption tabular-nums text-text-muted">
                Duration: {formatTimerDuration(Math.max(0, Math.floor((new Date(stoppedAt).getTime() - new Date(session.startTime).getTime()) / 1000)))}
              </p>
            </div>
            {status && <p role="status" className="mt-ds-12 text-body-sm text-status-error">{status}</p>}
            <div className="mt-ds-20 flex justify-end gap-ds-8">
              <button
                type="button"
                onClick={() => setStoppedAt(null)}
                className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
              >
                Resume timer
              </button>
              <button
                type="button"
                disabled={isSaving || !title.trim()}
                onClick={() => void handleConfirm()}
                className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
              >
                {isSaving ? "Saving..." : "Save activity"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
