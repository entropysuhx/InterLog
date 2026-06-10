"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createActivity, deleteActivity, updateActivity } from "@/actions/activity";
import CategoryBadge from "@/components/activity/CategoryBadge";
import { guestStore } from "@/lib/guest/store";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { CATEGORY_KEYS, type ActivityView, type CategoryKey } from "@/types";

type ActivityEditorProps = {
  isOpen: boolean;
  isAuthenticated: boolean;
  activity?: ActivityView | null;
  initialStartTime?: string;
  initialEndTime?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

function toLocalInput(value: string | Date): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function ActivityEditor({
  isOpen,
  isAuthenticated,
  activity,
  initialStartTime,
  initialEndTime,
  onClose,
  onSaved,
}: ActivityEditorProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isInProgress, setIsInProgress] = useState(false);
  const [categoryKey, setCategoryKey] = useState<CategoryKey | "">("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 60 * 1000);
    setTitle(activity?.title ?? "");
    setStartTime(toLocalInput(activity?.startTime ?? initialStartTime ?? defaultStart));
    setEndTime(toLocalInput(activity?.endTime ?? initialEndTime ?? now));
    setIsInProgress(activity?.endTime === null || initialEndTime === null);
    setCategoryKey(activity?.categoryKey ?? "");
    setNotes(activity?.notes ?? "");
    setStatus("");
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
  }, [activity, initialEndTime, initialStartTime, isOpen]);

  useDialogFocus(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  async function resolveGuestCategory(): Promise<{
    categoryKey: CategoryKey;
    confidence: number;
    source: "AI" | "FALLBACK";
  }> {
    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (response.ok) return await response.json() as Awaited<ReturnType<typeof resolveGuestCategory>>;
    } catch {
      // Admin remains the deterministic fallback.
    }
    return { categoryKey: "admin", confidence: 0, source: "FALLBACK" };
  }

  async function handleSave() {
    if (!title.trim() || !startTime || (!isInProgress && !endTime)) return;
    const startIso = toIso(startTime);
    const endIso = isInProgress ? null : toIso(endTime);
    if (endIso && new Date(endIso) <= new Date(startIso)) {
      setStatus("End time must be after start time.");
      return;
    }
    setIsSaving(true);
    setStatus("");

    if (isAuthenticated) {
      const result = activity
        ? await updateActivity({
            id: activity.id,
            title: title.trim(),
            startTime: startIso,
            endTime: endIso,
            categoryKey: categoryKey || activity.categoryKey,
            notes: notes.trim() || null,
          })
        : await createActivity({
            title: title.trim(),
            startTime: startIso,
            endTime: endIso,
            categoryKey: categoryKey || undefined,
            notes: notes.trim() || null,
          });
      if (!result.success) {
        setStatus(result.error);
        setIsSaving(false);
        return;
      }
      if (result.data.overlappingActivities.length > 0) {
        setStatus(`Saved. This overlaps with ${result.data.overlappingActivities[0].title}.`);
      }
    } else if (activity) {
      guestStore.updateActivity(activity.id, {
        title: title.trim(),
        startTime: startIso,
        endTime: endIso,
        categoryKey: categoryKey || activity.categoryKey,
        categorizationSource: categoryKey ? "USER" : activity.categorizationSource,
        aiConfidence: categoryKey ? null : activity.aiConfidence,
        notes: notes.trim() || null,
      });
    } else {
      const suggestion = categoryKey ? null : await resolveGuestCategory();
      guestStore.createActivity({
        title: title.trim(),
        startTime: startIso,
        endTime: endIso,
        categoryKey: categoryKey || suggestion?.categoryKey || "admin",
        categorizationSource: categoryKey ? "USER" : suggestion?.source ?? "FALLBACK",
        aiConfidence: categoryKey ? null : suggestion?.confidence ?? 0,
        notes: notes.trim() || null,
      });
    }

    setIsSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!activity || !window.confirm(`Delete “${activity.title}”?`)) return;
    setIsSaving(true);
    if (isAuthenticated) {
      const result = await deleteActivity({ id: activity.id });
      if (!result.success) {
        setStatus(result.error);
        setIsSaving(false);
        return;
      }
    } else {
      guestStore.deleteActivity(activity.id);
    }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-overlay p-ds-16 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-editor-title"
        className="max-h-full w-full max-w-reading overflow-y-auto rounded-xl bg-surface-elevated p-ds-20 shadow-xl animate-in"
      >
        <div className="flex items-center justify-between gap-ds-12">
          <div>
            <h2 id="activity-editor-title" className="text-heading-3 font-semibold text-text-primary">
              {activity ? "Edit activity" : "Add activity"}
            </h2>
            <p className="mt-ds-4 text-body-sm text-text-muted">
              Set the time explicitly or leave the activity in progress.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close activity editor"
            className="flex size-touch-target items-center justify-center rounded-md text-text-muted hover:bg-surface-hover"
            onClick={onClose}
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
              autoFocus
            />
          </label>
          <div className="grid gap-ds-12 sm:grid-cols-2">
            <label>
              <span className="mb-ds-8 block text-label font-[550] text-text-secondary">Start time</span>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
              />
            </label>
            <label>
              <span className="mb-ds-8 block text-label font-[550] text-text-secondary">End time</span>
              <input
                type="datetime-local"
                value={endTime}
                disabled={isInProgress}
                onChange={(event) => setEndTime(event.target.value)}
                className="min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary disabled:text-text-disabled"
              />
            </label>
          </div>
          <label className="flex min-h-touch-target items-center gap-ds-8 text-body-sm text-text-secondary">
            <input
              type="checkbox"
              checked={isInProgress}
              onChange={(event) => setIsInProgress(event.target.checked)}
              className="size-ds-16 accent-interactive-primary"
            />
            This activity is still in progress
          </label>
          <fieldset>
            <legend className="text-label font-[550] text-text-secondary">Category</legend>
            <div className="mt-ds-8 flex flex-wrap gap-ds-8">
              {!activity && (
                <button
                  type="button"
                  onClick={() => setCategoryKey("")}
                  className={
                    categoryKey === ""
                      ? "min-h-touch-target rounded-full border border-border-active bg-surface-active px-ds-12 text-caption text-text-primary"
                      : "min-h-touch-target rounded-full border border-border px-ds-12 text-caption text-text-muted"
                  }
                >
                  AI suggestion
                </button>
              )}
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
        </div>

        {status && (
          <p className="mt-ds-16 flex items-center gap-ds-8 text-body-sm text-status-warning" role="status">
            <AlertTriangle size={16} aria-hidden="true" />
            {status}
          </p>
        )}
        <div className="mt-ds-20 flex flex-wrap items-center justify-between gap-ds-12">
          {activity ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleDelete()}
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-status-error px-ds-16 text-label text-status-error"
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-ds-8">
            <button
              type="button"
              onClick={onClose}
              className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || !title.trim() || !startTime || (!isInProgress && !endTime)}
              onClick={() => void handleSave()}
              className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
            >
              {isSaving ? "Saving..." : activity ? "Save changes" : "Add activity"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
