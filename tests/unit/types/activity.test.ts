import { describe, expect, it } from "vitest";

import {
  CreateActivitySchema,
  DeleteActivitySchema,
  UpdateActivityCategorySchema,
  UpdateActivitySchema,
} from "@/types";

describe("CreateActivitySchema", () => {
  const valid = {
    title: "Write product brief",
    startTime: "2026-06-10T09:00:00.000Z",
    endTime: "2026-06-10T10:00:00.000Z",
  };

  it("accepts a valid activity", () => {
    expect(CreateActivitySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects whitespace-only titles", () => {
    expect(CreateActivitySchema.safeParse({ ...valid, title: "   " }).success).toBe(false);
  });

  it("rejects end times before start times", () => {
    expect(
      CreateActivitySchema.safeParse({
        ...valid,
        endTime: "2026-06-10T08:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(CreateActivitySchema.safeParse({ ...valid, userId: "attacker" }).success).toBe(false);
  });

  it("accepts legacy guest activity IDs for authenticated edits and deletes", () => {
    const legacyId = "activity_b658bdc30cb84fc38b15f0a774f42e1d";

    expect(UpdateActivitySchema.safeParse({ ...valid, id: legacyId }).success).toBe(true);
    expect(DeleteActivitySchema.safeParse({ id: legacyId }).success).toBe(true);
    expect(
      UpdateActivityCategorySchema.safeParse({ id: legacyId, categoryKey: "deep-work" }).success,
    ).toBe(true);
  });

  it("still rejects blank and oversized activity IDs", () => {
    expect(DeleteActivitySchema.safeParse({ id: " " }).success).toBe(false);
    expect(DeleteActivitySchema.safeParse({ id: "a".repeat(129) }).success).toBe(false);
  });
});
