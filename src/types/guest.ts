import { z } from "zod";

import { CategoryKeySchema } from "@/types/category";

export const GuestActivitySchema = z
  .object({
    id: z.string().min(1),
    guestId: z.string().min(1),
    title: z.string().min(1).max(200),
    notes: z.string().max(2000).nullable().default(null),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    categoryKey: CategoryKeySchema,
    categorizationSource: z.enum(["AI", "USER", "FALLBACK"]),
    aiConfidence: z.number().min(0).max(1).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const GuestReflectionSchema = z
  .object({
    id: z.string().min(1),
    guestId: z.string().min(1),
    activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    prompt: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const GuestFocusSessionSchema = z
  .object({
    id: z.string().min(1),
    guestId: z.string().min(1),
    activityId: z.string().nullable(),
    title: z.string().min(1).max(200),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
  })
  .strict();

export type GuestActivity = z.infer<typeof GuestActivitySchema>;
export type GuestReflection = z.infer<typeof GuestReflectionSchema>;
export type GuestFocusSession = z.infer<typeof GuestFocusSessionSchema>;

export type GuestDataExport = {
  version: 1;
  guestId: string;
  activities: GuestActivity[];
  reflections: GuestReflection[];
  focusSessions: GuestFocusSession[];
};
