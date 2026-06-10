"use client";

import { Download, ShieldCheck, Trash2 } from "lucide-react";

import { deleteAccount } from "@/actions/user";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { guestStore } from "@/lib/guest/store";

export default function SettingsPage() {
  const { isAuthenticated } = useProductData();

  function handleExport() {
    if (isAuthenticated) {
      window.location.assign("/api/export");
      return;
    }
    const blob = new Blob([JSON.stringify(guestStore.export(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interlog-guest-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="mx-auto max-w-reading space-y-ds-20">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Settings</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">Privacy, themes, and your InterLog data.</p>
      </header>
      <section className="rounded-xl border border-border bg-surface p-ds-20">
        <h2 className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary">
          <ShieldCheck size={18} aria-hidden="true" /> Privacy
        </h2>
        <p className="mt-ds-8 text-body-sm text-text-secondary">
          {isAuthenticated
            ? "Reflection text and mood are excluded from AI and data exports."
            : "Guest data stays in this browser. Reflection text and mood are never sent to AI."}
        </p>
      </section>
      <section className="rounded-xl border border-border bg-surface p-ds-20">
        <h2 className="text-heading-4 font-semibold text-text-primary">Your data</h2>
        <div className="mt-ds-16 flex flex-wrap gap-ds-8">
          <button
            type="button"
            onClick={handleExport}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary"
          >
            <Download size={16} aria-hidden="true" /> Export data
          </button>
          <button
            type="button"
            onClick={() => {
              const message = isAuthenticated
                ? "Permanently delete your InterLog account and all account data?"
                : "Delete guest data stored on this device?";
              if (!window.confirm(message)) return;
              if (isAuthenticated) {
                void deleteAccount().then(() => window.location.assign("/dashboard"));
              } else {
                guestStore.startNewSession();
                window.location.assign("/dashboard");
              }
            }}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-status-error px-ds-16 text-label text-status-error"
          >
            <Trash2 size={16} aria-hidden="true" /> {isAuthenticated ? "Delete account" : "Delete local data"}
          </button>
        </div>
      </section>
    </div>
  );
}
