"use client";

import { calculateDuration, createLocalId, toDateKey } from "@/lib/utils";
import {
  CATEGORY_IDS,
  CATEGORY_KEYS,
  CATEGORY_NAMES,
  GuestActivitySchema,
  GuestFocusSessionSchema,
  GuestReflectionSchema,
  type CategoryKey,
  type GuestActivity,
  type GuestDataExport,
  type GuestFocusSession,
  type GuestReflection,
} from "@/types";

const KEYS = {
  guestId: "interlog:guest-id",
  createdAt: "interlog:created-at",
  activities: "interlog:activities:v1",
  reflections: "interlog:reflections:v1",
  focusSessions: "interlog:focus-sessions:v1",
  draftPrefix: "interlog:reflection-draft:",
  migrationSkippedPrefix: "interlog:migration-skipped:",
  promptDismissedAt: "interlog:registration-prompt-dismissed-at",
} as const;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCollection<T>(
  key: string,
  parser: { safeParse: (value: unknown) => { success: boolean; data?: T } },
): T[] {
  if (!hasStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = parser.safeParse(item);
      return result.success && result.data ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

function writeCollection<T>(key: string, value: T[]): void {
  if (hasStorage()) window.localStorage.setItem(key, JSON.stringify(value));
}

function getGuestId(): string {
  if (!hasStorage()) return "guest_ssr";
  const existing = window.localStorage.getItem(KEYS.guestId);
  if (existing) return existing;
  const id = createLocalId("guest");
  window.localStorage.setItem(KEYS.guestId, id);
  window.localStorage.setItem(KEYS.createdAt, new Date().toISOString());
  return id;
}

export const guestCategories = CATEGORY_KEYS.map((key) => ({
  id: CATEGORY_IDS[key],
  key,
  name: CATEGORY_NAMES[key],
}));

export const guestStore = {
  getGuestId,
  getCreatedAt(): string {
    if (!hasStorage()) return new Date().toISOString();
    getGuestId();
    return window.localStorage.getItem(KEYS.createdAt) ?? new Date().toISOString();
  },
  getActivities(): GuestActivity[] {
    return readCollection(KEYS.activities, GuestActivitySchema);
  },
  getActivitiesByDate(date: string): GuestActivity[] {
    return this.getActivities().filter(
      (activity) => toDateKey(new Date(activity.startTime)) === date,
    );
  },
  createActivity(input: {
    title: string;
    notes?: string | null;
    startTime: string;
    endTime: string | null;
    categoryKey: CategoryKey;
    categorizationSource: "AI" | "USER" | "FALLBACK";
    aiConfidence: number | null;
  }): GuestActivity {
    const now = new Date().toISOString();
    const activity: GuestActivity = {
      id: createLocalId("activity"),
      guestId: getGuestId(),
      ...input,
      notes: input.notes ?? null,
      duration: input.endTime ? calculateDuration(input.startTime, input.endTime) : null,
      createdAt: now,
      updatedAt: now,
    };
    writeCollection(KEYS.activities, [...this.getActivities(), activity]);
    return activity;
  },
  updateActivity(
    id: string,
    patch: Partial<Omit<GuestActivity, "id" | "guestId" | "createdAt">>,
  ): GuestActivity | null {
    let updated: GuestActivity | null = null;
    const activities = this.getActivities().map((activity) => {
      if (activity.id !== id) return activity;
      const candidate = { ...activity, ...patch, updatedAt: new Date().toISOString() };
      updated = {
        ...candidate,
        duration: candidate.endTime
          ? calculateDuration(candidate.startTime, candidate.endTime)
          : null,
      };
      return updated;
    });
    writeCollection(KEYS.activities, activities);
    return updated;
  },
  deleteActivity(id: string): void {
    writeCollection(
      KEYS.activities,
      this.getActivities().filter((activity) => activity.id !== id),
    );
  },
  getReflections(): GuestReflection[] {
    return readCollection(KEYS.reflections, GuestReflectionSchema);
  },
  getReflectionsByDate(date: string): GuestReflection[] {
    return this.getReflections().filter((reflection) => reflection.activityDate === date);
  },
  saveReflections(
    activityDate: string,
    answers: { prompt: string; answer: string }[],
  ): GuestReflection[] {
    const guestId = getGuestId();
    const now = new Date().toISOString();
    const others = this.getReflections().filter(
      (reflection) => reflection.activityDate !== activityDate,
    );
    const records = answers.map((answer) => ({
      id: createLocalId("reflection"),
      guestId,
      activityDate,
      prompt: answer.prompt,
      answer: answer.answer,
      createdAt: now,
      updatedAt: now,
    }));
    writeCollection(KEYS.reflections, [...others, ...records]);
    return records;
  },
  getFocusSessions(): GuestFocusSession[] {
    return readCollection(KEYS.focusSessions, GuestFocusSessionSchema);
  },
  createFocusSession(title: string, startTime = new Date().toISOString()): GuestFocusSession {
    const session: GuestFocusSession = {
      id: createLocalId("focus"),
      guestId: getGuestId(),
      activityId: null,
      title,
      startTime,
      endTime: null,
      duration: null,
      status: "ACTIVE",
    };
    writeCollection(KEYS.focusSessions, [...this.getFocusSessions(), session]);
    return session;
  },
  completeFocusSession(
    id: string,
    input: {
      endTime: string;
      title: string;
      categoryKey: CategoryKey;
      notes?: string | null;
    },
  ): GuestFocusSession | null {
    const endTime = input.endTime;
    let completed: GuestFocusSession | null = null;
    const sessions = this.getFocusSessions().map((session) => {
      if (session.id !== id || session.status !== "ACTIVE") return session;
      const activity = this.createActivity({
        title: input.title,
        notes: input.notes ?? null,
        startTime: session.startTime,
        endTime,
        categoryKey: input.categoryKey,
        categorizationSource: "USER",
        aiConfidence: null,
      });
      completed = {
        ...session,
        activityId: activity.id,
        endTime,
        duration: calculateDuration(session.startTime, endTime),
        status: "COMPLETED",
      };
      return completed;
    });
    writeCollection(KEYS.focusSessions, sessions);
    return completed;
  },
  cancelFocusSession(id: string): void {
    writeCollection(
      KEYS.focusSessions,
      this.getFocusSessions().map((session) =>
        session.id === id ? { ...session, status: "CANCELLED" as const } : session,
      ),
    );
  },
  getActiveFocusSession(): GuestFocusSession | null {
    return this.getFocusSessions().find((session) => session.status === "ACTIVE") ?? null;
  },
  saveReflectionDraft(date: string, value: unknown): void {
    if (hasStorage())
      window.localStorage.setItem(`${KEYS.draftPrefix}${date}`, JSON.stringify(value));
  },
  getReflectionDraft<T>(date: string): T | null {
    if (!hasStorage()) return null;
    try {
      return JSON.parse(
        window.localStorage.getItem(`${KEYS.draftPrefix}${date}`) ?? "null",
      ) as T | null;
    } catch {
      return null;
    }
  },
  clearReflectionDraft(date: string): void {
    if (hasStorage()) window.localStorage.removeItem(`${KEYS.draftPrefix}${date}`);
  },
  shouldPromptRegistration(): boolean {
    if (!hasStorage()) return false;
    const dismissed = window.localStorage.getItem(KEYS.promptDismissedAt);
    if (dismissed && Date.now() - new Date(dismissed).getTime() < 86400000) return false;
    const age = Date.now() - new Date(this.getCreatedAt()).getTime();
    return age >= 3 * 86400000 || this.getActivities().length >= 10;
  },
  dismissRegistrationPrompt(): void {
    if (hasStorage()) window.localStorage.setItem(KEYS.promptDismissedAt, new Date().toISOString());
  },
  hasMigrationData(): boolean {
    return (
      this.getActivities().length + this.getReflections().length + this.getFocusSessions().length >
      0
    );
  },
  hasSkippedMigration(accountId: string): boolean {
    if (!hasStorage()) return false;
    return window.localStorage.getItem(`${KEYS.migrationSkippedPrefix}${accountId}`) === "true";
  },
  skipMigration(accountId: string): void {
    if (hasStorage())
      window.localStorage.setItem(`${KEYS.migrationSkippedPrefix}${accountId}`, "true");
  },
  hasSkippedMigrationForAny(accountIds: string[]): boolean {
    return accountIds.some((accountId) => this.hasSkippedMigration(accountId));
  },
  skipMigrationForAll(accountIds: string[]): void {
    accountIds.forEach((accountId) => this.skipMigration(accountId));
  },
  clearMigrationSkip(accountId: string): void {
    if (hasStorage()) window.localStorage.removeItem(`${KEYS.migrationSkippedPrefix}${accountId}`);
  },
  export(): GuestDataExport {
    return {
      version: 1,
      guestId: getGuestId(),
      activities: this.getActivities(),
      reflections: this.getReflections(),
      focusSessions: this.getFocusSessions(),
    };
  },
  clear(): void {
    if (!hasStorage()) return;
    const draftKeys = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index),
    ).filter((key): key is string => Boolean(key?.startsWith(KEYS.draftPrefix)));
    draftKeys.forEach((key) => window.localStorage.removeItem(key));
    Object.values(KEYS).forEach((key) => {
      if (!key.endsWith(":")) window.localStorage.removeItem(key);
    });
  },
  startNewSession(): void {
    this.clear();
    getGuestId();
  },
};
