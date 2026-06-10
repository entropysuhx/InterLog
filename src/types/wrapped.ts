import { z } from "zod";

export const WrappedCardTypeSchema = z.enum([
  "orientation",
  "time-overview",
  "category-story",
  "focus-pattern",
  "reflection-highlight",
  "achievement",
  "forward-prompt",
]);

export const WrappedCardSchema = z
  .object({
    type: WrappedCardTypeSchema,
    headline: z.string().min(1).max(160),
    body: z.string().min(1).max(500),
    stat: z
      .object({ value: z.string().max(32), label: z.string().max(80) })
      .strict()
      .optional(),
    ctaLabel: z.string().max(80).optional(),
  })
  .strict();

export const WrappedOutputSchema = z
  .object({ cards: z.array(WrappedCardSchema).min(2).max(12) })
  .strict();

export const GenerateWrappedSchema = z
  .object({
    period: z.enum(["monthly", "yearly"]),
    periodKey: z.string().regex(/^(\d{4}-\d{2}|\d{4})$/),
    force: z.boolean().optional(),
  })
  .strict();

export type WrappedCardData = z.infer<typeof WrappedCardSchema>;
export type WrappedOutput = z.infer<typeof WrappedOutputSchema>;

