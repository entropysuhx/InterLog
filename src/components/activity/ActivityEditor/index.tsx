"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createActivity, deleteActivity, updateActivity } from "@/actions/activity";
import CategoryBadge from "@/components/activity/CategoryBadge";
import ModalShell from "@/components/layout/ModalShell";
import { guestStore } from "@/lib/guest/store";
import { toDateKey } from "@/lib/utils";
import { CATEGORY_KEYS, type ActivityView, type CategoryKey } from "@/types";

type ActivityEditorProps = {
  isOpen: boolean;
  isAuthenticated: boolean;
  activity?: ActivityView | null;
  initialTitle?: string;
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
  initialTitle,
  initialStartTime,
  initialEndTime,
  onClose,
  onSaved,
}: ActivityEditorProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
    const defaultStartCandidate = new Date(now.getTime() - 30 * 60 * 1000);
    const defaultStart =
      toDateKey(defaultStartCandidate) === toDateKey(now)
        ? defaultStartCandidate
        : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setTitle(activity?.title ?? initialTitle ?? "");
    setStartTime(toLocalInput(activity?.startTime ?? initialStartTime ?? defaultStart));
    setEndTime(toLocalInput(activity?.endTime ?? initialEndTime ?? now));
    setIsInProgress(activity?.endTime === null || initialEndTime === null);
    setCategoryKey(activity?.categoryKey ?? "deep-work");
    setNotes(activity?.notes ?? "");
    setStatus("");
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
  }, [activity, initialEndTime, initialStartTime, initialTitle, isOpen]);

  if (!isOpen) return null;

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

    try {
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
              categoryKey: categoryKey || "deep-work",
              notes: notes.trim() || null,
            });
        if (!result.success) {
          setStatus(result.error);
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
        guestStore.createActivity({
          title: title.trim(),
          startTime: startIso,
          endTime: endIso,
          categoryKey: categoryKey || "deep-work",
          categorizationSource: categoryKey ? "USER" : "FALLBACK",
          aiConfidence: 0,
          notes: notes.trim() || null,
        });
      }

      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!activity || !window.confirm(`Delete “${activity.title}”?`)) return;
    setIsSaving(true);
    try {
      if (isAuthenticated) {
        const result = await deleteActivity({ id: activity.id });
        if (!result.success) {
          setStatus(result.error);
          return;
        }
      } else {
        guestStore.deleteActivity(activity.id);
      }
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell titleId="activity-editor-title" onClose={onClose} size="form">
      <div className="flex items-center justify-between gap-ds-12">
        <div>
          <h2 id="activity-editor-title" className="text-heading-3 font-semibold text-text-primary">
            {activity ? "Edit Activity" : "Add Activity"}
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
          <span className="mb-ds-8 block text-label font-[550] text-text-secondary">
            Activity title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
            autoFocus
          />
        </label>
        <div className="grid gap-ds-12 sm:grid-cols-2">
          <label>
            <span className="mb-ds-8 block text-label font-[550] text-text-secondary">
              Start time
            </span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
            />
          </label>
          <label>
            <span className="mb-ds-8 block text-label font-[550] text-text-secondary">
              End time
            </span>
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
            {CATEGORY_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={categoryKey === key}
                onClick={() => setCategoryKey(key)}
                className={
                  categoryKey === key
                    ? "min-h-touch-target rounded-full outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 transition-all"
                    : "min-h-touch-target rounded-full opacity-60 transition-opacity hover:opacity-100 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
                }
              >
                <CategoryBadge categoryKey={key} selected={categoryKey === key} />
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
        <p
          className="mt-ds-16 flex items-center gap-ds-8 text-body-sm text-status-warning"
          role="status"
        >
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
        ) : (
          <span />
        )}
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
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isSaving ? "Saving..." : activity ? "Save Activity" : "Add Activity"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
