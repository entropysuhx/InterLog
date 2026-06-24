import { describe, expect, it } from "vitest";

import { ImportExportDataSchema } from "@/lib/import/export-schema";

const exportedAt = "2026-06-23T18:02:44.024Z";

describe("InterLog export import schema", () => {
  it("accepts exports that use legacy local activity and focus IDs", () => {
    const result = ImportExportDataSchema.safeParse({
      exportedAt,
      activities: [
        {
          id: "activity_b658bdc30cb84fc38b15f0a774f42e1d",
          userId: "cmqnxbakh0000l5046htxnx0x",
          title: "Coding Session",
          notes: "",
          startTime: "2026-06-10T11:01:55.724Z",
          endTime: "2026-06-10T11:31:55.724Z",
          duration: 1800,
          categoryId: "cat_admin",
          categorizationSource: "FALLBACK",
          aiConfidence: 0,
          createdAt: "2026-06-10T11:31:56.901Z",
          updatedAt: "2026-06-10T11:31:56.901Z",
        },
      ],
      focusSessions: [
        {
          id: "focus_9a709ea442c24c04804af0eb4e6aef8b",
          userId: "cmqnxbakh0000l5046htxnx0x",
          activityId: "activity_b658bdc30cb84fc38b15f0a774f42e1d",
          title: "Focus session",
          status: "COMPLETED",
          startTime: "2026-06-10T11:36:53.306Z",
          endTime: "2026-06-10T11:36:58.760Z",
          duration: 5,
          createdAt: "2026-06-23T17:00:41.473Z",
          updatedAt: "2026-06-23T17:00:41.473Z",
        },
      ],
      wrappedSummaries: [],
      privacyNote: "Mood entries are intentionally excluded.",
      reflections: [
        {
          id: "reflection_b658bdc30cb84fc38b15f0a774f42e1d",
          userId: "cmqnxbakh0000l5046htxnx0x",
          activityDate: "2026-06-10",
          prompt: "What felt meaningful today?",
          answer: "Finishing the first version of the timeline.",
          createdAt: "2026-06-10T12:00:00.000Z",
          updatedAt: "2026-06-10T12:00:00.000Z",
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reflections).toHaveLength(1);
  });

  it("accepts older exports that intentionally omitted reflections", () => {
    const result = ImportExportDataSchema.safeParse({
      exportedAt,
      activities: [],
      focusSessions: [],
      wrappedSummaries: [],
      privacyNote: "Reflection answers and mood entries are intentionally excluded.",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reflections).toEqual([]);
  });
});
