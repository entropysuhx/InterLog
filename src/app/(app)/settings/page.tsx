"use client";

import {
  Database,
  Download,
  Mail,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  deleteAccount,
  importExportedData,
  requestEmailChange,
  resetUserData,
  updateProfile,
  updateWeekStartsOn,
} from "@/actions/user";
import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";
import ActionToast from "@/components/layout/ActionToast";
import ModalShell from "@/components/layout/ModalShell";
import { useProductData } from "@/components/providers/ProductDataProvider";
import { migrateLocalGuestData } from "@/lib/guest/migrate";
import { guestStore } from "@/lib/guest/store";

type ImportPreview = {
  activities: number;
  focusSessions: number;
  data: unknown;
};

function getImportPreview(value: unknown): ImportPreview | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.activities) || !Array.isArray(record.focusSessions)) return null;
  return {
    activities: record.activities.length,
    focusSessions: record.focusSessions.length,
    data: value,
  };
}

export default function SettingsPage() {
  const { isAuthenticated, userName, userImage, weekStartsOn } = useProductData();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userName ?? "");
  const [avatar, setAvatar] = useState<string | null>(userImage);
  const [profileStatus, setProfileStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [isFileImportModalOpen, setIsFileImportModalOpen] = useState(false);
  const [fileImportPreview, setFileImportPreview] = useState<ImportPreview | null>(null);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
  const [weekStartStatus, setWeekStartStatus] = useState("");
  const [isSavingWeekStart, setIsSavingWeekStart] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  async function handleExport() {
    setIsExporting(true);
    setImportStatus("");
    try {
      const blob = isAuthenticated
        ? await fetch("/api/export", { cache: "no-store" }).then(async (response) => {
            if (!response.ok) throw new Error(`Export request failed with ${response.status}.`);
            return response.blob();
          })
        : new Blob([JSON.stringify(guestStore.export(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = isAuthenticated ? "interlog-export.json" : "interlog-guest-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setImportStatus("Your data export is ready.");
    } catch (error) {
      console.error("Data export failed", error);
      setImportStatus("We couldn't prepare your export right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    setImportStatus("");
    try {
      const result = await migrateLocalGuestData();
      setIsImportModalOpen(false);
      if (!result.success) {
        console.error("Manual guest data import failed", result.error);
        setImportStatus(result.error);
        return;
      }
      setHasGuestData(guestStore.hasMigrationData());
      setImportStatus(`Successfully imported ${result.importedCount} records.`);
      router.refresh();
    } catch (error) {
      console.error("Manual guest data import request failed", error);
      setImportStatus("We couldn't import your local data right now. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleExportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportStatus("");
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const preview = getImportPreview(parsed);
      if (!preview) {
        setImportStatus("Choose an InterLog export file with activities and focus sessions.");
        return;
      }
      setFileImportPreview(preview);
      setIsFileImportModalOpen(true);
    } catch {
      setImportStatus("We couldn't read that file. Choose a valid JSON export.");
    }
  }

  async function handleFileImport() {
    if (!fileImportPreview) return;
    setIsImportingFile(true);
    setImportStatus("");
    try {
      const result = await importExportedData(fileImportPreview.data);
      if (!result.success) {
        console.error("Export file import failed", result.error);
        setImportStatus(result.error);
        return;
      }
      setIsFileImportModalOpen(false);
      setFileImportPreview(null);
      const skipped = result.data.skippedActivities + result.data.skippedFocusSessions;
      setImportStatus(
        skipped > 0
          ? `Imported ${result.data.activities} activities and ${result.data.focusSessions} focus sessions. ${skipped} records could not be imported.`
          : `Imported ${result.data.activities} activities and ${result.data.focusSessions} focus sessions.`,
      );
      router.refresh();
    } catch (error) {
      console.error("Export file import request failed", error);
      setImportStatus("We couldn't import that file right now. Please try again.");
    } finally {
      setIsImportingFile(false);
    }
  }

  async function handleEmailChangeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRequestingEmailChange(true);
    setEmailStatus("");
    try {
      const result = await requestEmailChange({ email });
      if (!result.success) {
        setEmailStatus(result.error);
        return;
      }
      setEmailStatus(
        `We sent a verification link to ${result.data.email}. Your current email stays active until you confirm it.`,
      );
      setEmail("");
    } catch (error) {
      console.error("Email-change verification request failed", error);
      setEmailStatus("We couldn't send the verification email right now. Please try again.");
    } finally {
      setIsRequestingEmailChange(false);
    }
  }

  async function handleWeekStartChange(nextWeekStartsOn: 0 | 1) {
    if (!isAuthenticated || nextWeekStartsOn === weekStartsOn) return;
    setIsSavingWeekStart(true);
    setWeekStartStatus("");
    const result = await updateWeekStartsOn({ weekStartsOn: nextWeekStartsOn });
    setIsSavingWeekStart(false);
    if (!result.success) {
      setWeekStartStatus(result.error);
      return;
    }
    setWeekStartStatus("Week start preference saved.");
    router.refresh();
  }

  async function handleResetData() {
    setIsResetting(true);
    setResetStatus("");
    try {
      const result = await resetUserData({ confirmation: resetConfirmation });
      if (!result.success) {
        setResetStatus(result.error);
        return;
      }
      setIsResetModalOpen(false);
      setResetConfirmation("");
      setResetStatus("Your InterLog data has been reset successfully.");
      router.refresh();
    } catch (error) {
      console.error("Reset data request failed", error);
      setResetStatus("We couldn't reset your data right now. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  const isDataActionRunning = isImporting || isImportingFile || isExporting || isResetting;

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
      {isAuthenticated && (
        <section className="rounded-xl border border-border bg-surface p-ds-20">
          <h2 className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary">
            <Mail size={18} aria-hidden="true" /> Change email address
          </h2>
          <p className="mt-ds-8 text-body-sm text-text-secondary">
            Your current email stays active until you verify the new address.
          </p>
          <form
            onSubmit={(event) => void handleEmailChangeSubmit(event)}
            className="mt-ds-16 flex flex-col gap-ds-12 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-label text-text-secondary">
              New email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={isRequestingEmailChange}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
              />
            </label>
            <button
              type="submit"
              disabled={isRequestingEmailChange}
              className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
            >
              {isRequestingEmailChange ? "Sending..." : "Send verification"}
            </button>
          </form>
          {emailStatus && (
            <p role="status" className="mt-ds-12 text-body-sm text-text-secondary">
              {emailStatus}
            </p>
          )}
        </section>
      )}
      {isAuthenticated && (
        <section className="rounded-xl border border-border bg-surface p-ds-20">
          <h2 className="text-heading-4 font-semibold text-text-primary">Week starts on</h2>
          <p className="mt-ds-8 text-body-sm text-text-secondary">
            This sets the first day for weekly timelines, calendar rows, and weekly insights.
          </p>
          <div className="mt-ds-16 flex rounded-md border border-border bg-surface p-ds-4">
            {[
              { value: 1 as const, label: "Monday" },
              { value: 0 as const, label: "Sunday" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={weekStartsOn === option.value}
                disabled={isSavingWeekStart}
                onClick={() => void handleWeekStartChange(option.value)}
                className={
                  weekStartsOn === option.value
                    ? "min-h-touch-target rounded-sm bg-surface-active px-ds-16 text-label font-[550] text-text-primary"
                    : "min-h-touch-target rounded-sm px-ds-16 text-label text-text-secondary hover:bg-surface-hover"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          {weekStartStatus && (
            <p role="status" className="mt-ds-12 text-body-sm text-text-secondary">
              {weekStartStatus}
            </p>
          )}
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
            Import guest data from this device or merge an InterLog export file into your account.
          </p>
        )}
        <div className="mt-ds-16 flex flex-wrap gap-ds-8">
          <button
            type="button"
            disabled={isDataActionRunning}
            onClick={() => void handleExport()}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary"
          >
            <Download size={16} aria-hidden="true" /> Export data
          </button>
          {isAuthenticated && (
            <>
              <button
                type="button"
                disabled={!hasGuestData || isDataActionRunning}
                onClick={() => setIsImportModalOpen(true)}
                className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary disabled:text-text-disabled"
              >
                <Database size={16} aria-hidden="true" /> Import Guest Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                disabled={isDataActionRunning}
                onChange={(event) => void handleExportFileChange(event)}
              />
              <button
                type="button"
                disabled={isDataActionRunning}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border px-ds-16 text-label text-text-primary"
              >
                <Upload size={16} aria-hidden="true" /> Import Data File
              </button>
            </>
          )}
          {isAuthenticated && (
            <button
              type="button"
              disabled={isDataActionRunning}
              onClick={() => setIsResetModalOpen(true)}
              className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-status-error px-ds-16 text-label text-status-error hover:bg-surface-hover disabled:text-text-disabled"
            >
              <RotateCcw size={16} aria-hidden="true" /> Reset My Data
            </button>
          )}
          <button
            type="button"
            disabled={isDataActionRunning}
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
      {isFileImportModalOpen && fileImportPreview && (
        <ModalShell
          titleId="import-export-data-title"
          onClose={() => {
            if (!isImportingFile) setIsFileImportModalOpen(false);
          }}
        >
          <div>
            <h2
              id="import-export-data-title"
              className="text-heading-3 font-semibold text-text-primary"
            >
              Import InterLog data?
            </h2>
            <p className="mt-ds-8 text-body-sm text-text-secondary">
              This file contains {fileImportPreview.activities} activities and{" "}
              {fileImportPreview.focusSessions} focus sessions. Existing matching entries will be
              kept.
            </p>
            {importStatus && (
              <p role="status" className="mt-ds-12 text-body-sm text-status-error">
                {importStatus}
              </p>
            )}
          </div>
          <div className="mt-ds-20 flex justify-end gap-ds-8">
            <button
              type="button"
              disabled={isImportingFile}
              onClick={() => setIsFileImportModalOpen(false)}
              className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImportingFile}
              onClick={() => void handleFileImport()}
              className="min-h-touch-target rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse disabled:bg-surface-subtle disabled:text-text-disabled"
            >
              {isImportingFile ? "Importing..." : "Import data"}
            </button>
          </div>
        </ModalShell>
      )}
      {isResetModalOpen && (
        <ModalShell
          titleId="reset-data-title"
          onClose={() => {
            if (!isResetting) {
              setIsResetModalOpen(false);
              setResetConfirmation("");
            }
          }}
        >
          <div>
            <h2 id="reset-data-title" className="text-heading-3 font-semibold text-text-primary">
              Reset all data?
            </h2>
            <p className="mt-ds-8 text-body-sm text-text-secondary">
              This will permanently remove all your tracked activities, focus sessions, reflections,
              and insights. Your account and settings will remain.
            </p>
            <p className="mt-ds-12 text-body-sm font-[550] text-status-error">
              This action cannot be undone.
            </p>
            <label className="mt-ds-20 block text-label text-text-secondary">
              Type DELETE to confirm
              <input
                value={resetConfirmation}
                disabled={isResetting}
                onChange={(event) => setResetConfirmation(event.target.value)}
                className="mt-ds-8 min-h-touch-target w-full rounded-md border border-border bg-background px-ds-12 text-body-sm text-text-primary"
                autoComplete="off"
              />
            </label>
          </div>
          <div className="mt-ds-20 flex justify-end gap-ds-8">
            <button
              type="button"
              disabled={isResetting}
              onClick={() => {
                setIsResetModalOpen(false);
                setResetConfirmation("");
              }}
              className="min-h-touch-target rounded-md border border-border px-ds-16 text-label text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isResetting || resetConfirmation !== "DELETE"}
              onClick={() => void handleResetData()}
              className="min-h-touch-target rounded-md border border-status-error px-ds-16 text-label font-[550] text-status-error hover:bg-surface-hover disabled:border-border disabled:text-text-disabled"
            >
              Reset My Data
            </button>
          </div>
        </ModalShell>
      )}
      {(isDataActionRunning || isRequestingEmailChange) && (
        <ActionLoadingOverlay
          title={
            isResetting
              ? "Resetting your data..."
              : isRequestingEmailChange
                ? "Sending verification email..."
                : isExporting
                  ? "Preparing your export..."
                  : "Importing your data..."
          }
          subtitle="This may take a few seconds."
        />
      )}
      {importStatus && (
        <ActionToast
          message={importStatus}
          tone={
            importStatus.startsWith("Imported") ||
            importStatus.startsWith("Successfully") ||
            importStatus.startsWith("Your data")
              ? "success"
              : "error"
          }
          onDismiss={() => setImportStatus("")}
        />
      )}
      {emailStatus && (
        <ActionToast
          message={emailStatus}
          tone={emailStatus.startsWith("We sent") ? "success" : "error"}
          onDismiss={() => setEmailStatus("")}
        />
      )}
      {resetStatus && (
        <ActionToast
          message={resetStatus}
          tone={resetStatus.startsWith("Your InterLog") ? "success" : "error"}
          onDismiss={() => setResetStatus("")}
        />
      )}
    </div>
  );
}
