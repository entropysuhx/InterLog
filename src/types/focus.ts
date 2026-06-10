import { z } from "zod";

export const StartFocusSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startTime: z.string().datetime(),
  })
  .strict();

export const CompleteFocusSessionSchema = z
  .object({
    id: z.string().cuid(),
    endTime: z.string().datetime(),
    title: z.string().trim().min(1).max(200),
    categoryKey: z.enum([
      "deep-work",
      "learning",
      "reflection",
      "exercise",
      "social",
      "meeting",
      "admin",
      "break",
      "personal",
    ]),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const CancelFocusSessionSchema = z.object({ id: z.string().cuid() }).strict();

export type FocusSessionView = {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  activityId: string | null;
};
