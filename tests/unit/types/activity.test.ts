import { describe, expect, it } from "vitest";

import { CreateActivitySchema } from "@/types";

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
});

