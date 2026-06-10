import type { ActivityView, GuestActivity } from "@/types";

export function makeActivity(overrides: Partial<ActivityView> = {}): ActivityView {
  return {
    id: "activity_test",
    title: "Focused work",
    notes: null,
    startTime: "2026-06-10T09:00:00.000Z",
    endTime: "2026-06-10T10:00:00.000Z",
    duration: 3600,
    categoryKey: "deep-work",
    categoryName: "Deep Work",
    categorizationSource: "USER",
    aiConfidence: null,
    ...overrides,
  };
}

export function makeGuestActivity(overrides: Partial<GuestActivity> = {}): GuestActivity {
  return {
    ...makeActivity(),
    guestId: "guest_test",
    createdAt: "2026-06-10T10:00:00.000Z",
    updatedAt: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}
