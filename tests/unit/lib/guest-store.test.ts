import { beforeEach, describe, expect, it } from "vitest";

import { guestStore } from "@/lib/guest/store";

describe("guestStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps a stable guest id", () => {
    expect(guestStore.getGuestId()).toBe(guestStore.getGuestId());
  });

  it("creates and retrieves an activity", () => {
    guestStore.createActivity({
      title: "Read",
      startTime: "2026-06-10T09:00:00.000Z",
      endTime: "2026-06-10T10:00:00.000Z",
      categoryKey: "learning",
      categorizationSource: "USER",
      aiConfidence: null,
    });
    expect(guestStore.getActivities()).toHaveLength(1);
    expect(guestStore.getActivities()[0].duration).toBe(3600);
  });

  it("preserves valid records when malformed data is present", () => {
    window.localStorage.setItem(
      "interlog:activities:v1",
      JSON.stringify([{ invalid: true }]),
    );
    expect(guestStore.getActivities()).toEqual([]);
  });
});

