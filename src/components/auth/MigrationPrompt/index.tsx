"use client";

import { Check, Database, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { guestStore } from "@/lib/guest/store";
import { migrateLocalGuestData } from "@/lib/guest/migrate";

type MigrationPromptProps = {
  accountIds: string[];
};

export default function MigrationPrompt({ accountIds }: MigrationPromptProps) {
  const [recordCount, setRecordCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const data = guestStore.export();
    const nextRecordCount =
      data.activities.length + data.reflections.length + data.focusSessions.length;
    setRecordCount(nextRecordCount);
  }, []);

  async function handleMigrate() {
    setStatus("loading");
    const result = await migrateLocalGuestData();
    if (result.success) {
      accountIds.forEach((accountId) => guestStore.clearMigrationSkip(accountId));
      setStatus("success");
      setMessage(`${result.importedCount} records saved to your account.`);
      window.setTimeout(() => window.location.assign("/dashboard"), 1000);
    } else {
      setStatus("error");
      console.error("Guest migration failed", result.error);
      setMessage(
        result.error || "We couldn't import your guest data right now. Your data is still here.",
      );
    }
  }

  function handleSkip() {
    guestStore.skipMigrationForAll(accountIds);
    window.location.assign("/dashboard");
  }

  return (
    <div className="space-y-ds-16">
      <div className="rounded-lg bg-surface-subtle p-ds-16">
        <p className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
          <Database size={18} aria-hidden="true" />
          {recordCount} guest records found on this device
        </p>
        <p className="mt-ds-8 text-body-sm text-text-secondary">
          Add them to your account? Imports are idempotent and local data is cleared only after
          success.
        </p>
      </div>
      {message && (
        <p
          role="status"
          className={
            status === "error"
              ? "text-body-sm text-status-error"
              : "text-body-sm text-text-secondary"
          }
        >
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleMigrate()}
        disabled={status === "loading" || status === "success" || recordCount === 0}
        className="flex min-h-touch-target w-full items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse"
      >
        {status === "loading" ? (
          <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
        ) : status === "success" ? (
          <Check size={16} aria-hidden="true" />
        ) : null}
        {status === "loading" ? "Saving your data..." : "Add guest data to my account"}
      </button>
      <button
        type="button"
        onClick={handleSkip}
        className="min-h-touch-target w-full rounded-md border border-border px-ds-16 text-label text-text-secondary"
      >
        Skip and continue
      </button>
    </div>
  );
}
