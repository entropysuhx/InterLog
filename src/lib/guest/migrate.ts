"use client";

import { guestStore } from "@/lib/guest/store";

export type MigrationResult =
  | { success: true; importedCount: number }
  | { success: false; error: string };

export async function migrateLocalGuestData(): Promise<MigrationResult> {
  const exported = guestStore.export();
  const idempotencyKey = `${exported.guestId}:${exported.activities.length}:${exported.reflections.length}:${exported.focusSessions.length}`;
  try {
    const response = await fetch("/api/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...exported, idempotencyKey }),
    });
    const result = (await response.json()) as
      | { success: true; data: { importedCount: number } }
      | { success: false; error: string };
    if (!result.success) return result;
    guestStore.clear();
    return { success: true, importedCount: result.data.importedCount };
  } catch {
    return { success: false, error: "Migration failed. Your data is still here." };
  }
}

