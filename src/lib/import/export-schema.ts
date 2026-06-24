import { z } from "zod";

import { CATEGORY_IDS } from "@/types";

const ExportRecordIdSchema = z.string().trim().min(1).max(128);

const ImportedActivitySchema = z
  .object({
    id: ExportRecordIdSchema,
    userId: z.string().optional(),
    title: z.string().trim().min(1).max(200),
    notes: z.string().max(2000).nullable().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    categoryId: z.string().refine((value) => Object.values(CATEGORY_IDS).includes(value)),
    categorizationSource: z.enum(["AI", "USER", "FALLBACK"]),
    aiConfidence: z.number().min(0).max(1).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const ImportedFocusSessionSchema = z
  .object({
    id: ExportRecordIdSchema,
    userId: z.string().optional(),
    activityId: ExportRecordIdSchema.nullable(),
    title: z.string().trim().min(1).max(200),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().nullable(),
    duration: z.number().int().nonnegative().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const ImportExportDataSchema = z
  .object({
    exportedAt: z.string().datetime(),
    activities: z.array(ImportedActivitySchema).max(5000),
    focusSessions: z.array(ImportedFocusSessionSchema).max(2000),
    wrappedSummaries: z.unknown().optional(),
    privacyNote: z.string().optional(),
  })
  .strict();
