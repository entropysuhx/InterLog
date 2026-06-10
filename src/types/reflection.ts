import { z } from "zod";

export const ReflectionAnswerSchema = z
  .object({
    prompt: z.string().trim().min(1).max(500),
    answer: z.string().trim().min(1).max(5000),
  })
  .strict();

export const SaveReflectionSchema = z
  .object({
    activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    answers: z.array(ReflectionAnswerSchema).min(1).max(3),
    mood: z.number().int().min(1).max(5).optional(),
  })
  .strict();

export const SkipReflectionSchema = z
  .object({ activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
  .strict();

export const SaveMoodEntrySchema = z
  .object({
    activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mood: z.number().int().min(1).max(5),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export type SaveReflectionInput = z.infer<typeof SaveReflectionSchema>;

export type ReflectionPromptSet = {
  primaryPrompt: string;
  optionalPrompts: string[];
};

export type ReflectionView = {
  id: string;
  activityDate: string;
  prompt: string;
  answer: string;
  updatedAt: string;
};
