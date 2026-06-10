import { z } from "zod";

import { CategoryKeySchema } from "@/types/category";

const ActivityBaseSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable().optional(),
    categoryKey: CategoryKeySchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const CreateActivitySchema = ActivityBaseSchema.refine(
  (value) => !value.endTime || new Date(value.endTime) > new Date(value.startTime),
  { message: "End time must be after start time.", path: ["endTime"] },
);

export const UpdateActivitySchema = ActivityBaseSchema.extend({
  id: z.string().cuid(),
}).refine(
  (value) => !value.endTime || new Date(value.endTime) > new Date(value.startTime),
  { message: "End time must be after start time.", path: ["endTime"] },
);

export const DeleteActivitySchema = z.object({ id: z.string().cuid() }).strict();

export const UpdateActivityCategorySchema = z
  .object({
    id: z.string().cuid(),
    categoryKey: CategoryKeySchema,
  })
  .strict();

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;

export type ActivityView = {
  id: string;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  categoryKey: z.infer<typeof CategoryKeySchema>;
  categoryName: string;
  categorizationSource: "AI" | "USER" | "FALLBACK";
  aiConfidence: number | null;
};

export type ActivityMutationResult = {
  activity: ActivityView;
  overlappingActivities: ActivityView[];
};
