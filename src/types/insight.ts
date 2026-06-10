import { z } from "zod";

import { CategoryKeySchema } from "@/types/category";

export const InsightConfidenceSchema = z.enum(["emerging", "consistent", "strong"]);

export const InsightOutputSchema = z
  .object({
    insights: z
      .array(
        z
          .object({
            observation: z.string().min(1).max(1000),
            interpretation: z.string().min(1).max(1000),
            recommendation: z.string().min(1).max(1000).optional(),
            evidence: z.string().min(1).max(500),
            confidence: InsightConfidenceSchema,
            category: CategoryKeySchema.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const GenerateInsightsSchema = z
  .object({
    periodDays: z.number().int().min(7).max(90).default(14),
    force: z.boolean().optional(),
  })
  .strict();

export const InsightFeedbackSchema = z
  .object({ insightId: z.string().cuid(), helpful: z.boolean() })
  .strict();

export const DismissInsightSchema = z.object({ insightId: z.string().cuid() }).strict();

export type InsightOutput = z.infer<typeof InsightOutputSchema>;

export type InsightView = {
  id: string;
  observation: string;
  interpretation: string;
  recommendation?: string;
  evidence: string;
  confidence: "emerging" | "consistent" | "strong";
};
