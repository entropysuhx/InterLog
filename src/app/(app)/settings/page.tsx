"use client";

import { Database, Download, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteAccount, updateProfile } from "@/actions/user";
import ModalShell from "@/components/layout/ModalShell";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { migrateLocalGuestData } from "@/lib/guest/migrate";
import { guestStore } from "@/lib/guest/store";

export default function SettingsPage() {
  const { isAuthenticated, userName, userImage } = useProductData();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userName ?? "");
  const [avatar, setAvatar] = useState<string | null>(userImage);
  const [profileStatus, setProfileStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [hasGuestData, setHasGuestData] = useState(() =>
    typeof window === "undefined" ? false : guestStore.hasMigrationData(),
  );

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      setProfileStatus("Choose an image under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) return;
    setIsSavingProfile(true);
    setProfileStatus("");
    const result = await updateProfile({ name: displayName, image: avatar });
    setIsSavingProfile(false);
    if (!result.success) {
      setProfileStatus(result.error);
      return;
    }
    setProfileStatus("Profile updated.");
    router.refresh();
  }

  function handleExport() {
    if (isAuthenticated) {
      window.location.assign("/api/export");
      return;
    }
    const blob = new Blob([JSON.stringify(guestStore.export(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interlog-guest-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    setIsImporting(true);
    setImportStatus("");
    const result = await migrateLocalGuestData();
    setIsImporting(false);
    setIsImportModalOpen(false);
    if (!result.success) {
      console.error("Manual guest data import failed", result.error);
      setImportStatus(result.error);
      return;
    }
    setHasGuestData(guestStore.hasMigrationData());
    setImportStatus(`Successfully imported ${result.importedCount} records.`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-reading space-y-ds-20">
      <header>
        <h1 className="text-heading-2 font-[650] text-text-primary">Settings</h1>
        <p className="mt-ds-4 text-body-sm text-text-secondary">
          Privacy, themes, and your InterLog data.
        </p>
      </header>
      {isAuthenticated && (
        <section className="rounded-xl border border-border bg-surface p-ds-20">
          <h2 className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary">
            <UserRound size={18} aria-hidden="true" /> Account profile
          </h2>
          <form
            onSubmit={(event) => void handleProfileSubmit(event)}
            className="mt-ds-16 space-y-ds-16"
          >
            <div className="flex flex-col gap-ds-16 sm:flex-row sm:items-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="size-ds-80 rounded-full object-cover" />
              ) : (
                <span className="flex size-ds-80 items-center justify-center rounded-full bg-interactive-primary text-heading-3 font-semibold text-text-inverse">
                  {(displayName || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="flex-1 space-y-ds-12">
                <label className="block text-label text-text-secondary">
                  Display name
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
                  />
                </label>
                <label className="block text-label text-text-secondary">
                  Profile photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void handleAvatarChange(event)}
                    className="mt-ds-8 block w-full text-body-sm text-text-secondary file:mr-ds-12 file:min-h-touch-target file:rounded-md file:border file:border-border file:bg-interactive-secondary file:px-ds-12 file:text-label file:text-text-primary"
                  />
                </label>
              </div>
            </div>
            {profileStatus && (
              <p role="status" className="text-body-sm text-text-secondary">
                {profileStatus}
              </p>
            )}
            <div className="flex flex-wrap gap-ds-8">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
              >
                {isSavingProfile ? "Saving..." : "Save profile"}
              </button>
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
              >
                Remove photo
              </button>
            </div>
          </form>
        </section>
      )}
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
        {isAuthenticated && (
          <p className="mt-ds-8 text-body-sm text-text-secondary">
            Import activities and reflections stored locally on this device into your account.
          </p>
        )}
        <div className="mt-ds-16 flex flex-wrap gap-ds-8">
          <button
            type="button"
            onClick={handleExport}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary"
          >
            <Download size={16} aria-hidden="true" /> Export data
          </button>
          {isAuthenticated && (
            <button
              type="button"
              disabled={!hasGuestData || isImporting}
              onClick={() => setIsImportModalOpen(true)}
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary disabled:text-text-disabled"
            >
              <Database size={16} aria-hidden="true" /> Import Guest Data
            </button>
          )}
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
            <Trash2 size={16} aria-hidden="true" />{" "}
            {isAuthenticated ? "Delete account" : "Delete local data"}
          </button>
        </div>
        {isAuthenticated && (
          <p role="status" className="mt-ds-12 text-body-sm text-text-secondary">
            {importStatus || (!hasGuestData ? "No guest data found on this device." : "")}
          </p>
        )}
      </section>
      {isImportModalOpen && (
        <ModalShell titleId="import-local-data-title" onClose={() => setIsImportModalOpen(false)}>
          <div>
            <h2
              id="import-local-data-title"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Import Local Data?
            </h2>
            <p className="mt-ds-8 text-body-sm text-text-secondary">
              This will import any guest data stored on this device into your account.
            </p>
          </div>
          <div className="mt-ds-20 flex justify-end gap-ds-8">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImporting}
              onClick={() => void handleImport()}
              className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
            >
              {isImporting ? "Importing..." : "Import Data"}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
