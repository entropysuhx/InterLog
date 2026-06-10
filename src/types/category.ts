import { z } from "zod";

export const CATEGORY_KEYS = [
  "deep-work",
  "learning",
  "reflection",
  "exercise",
  "social",
  "meeting",
  "admin",
  "break",
  "personal",
] as const;

export const CategoryKeySchema = z.enum(CATEGORY_KEYS);
export type CategoryKey = z.infer<typeof CategoryKeySchema>;

export const CATEGORY_IDS: Record<CategoryKey, string> = {
  "deep-work": "cat_deepwork",
  learning: "cat_learning",
  reflection: "cat_reflection",
  exercise: "cat_exercise",
  social: "cat_social",
  meeting: "cat_meeting",
  admin: "cat_admin",
  break: "cat_break",
  personal: "cat_personal",
};

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  "deep-work": "Deep Work",
  learning: "Learning",
  reflection: "Reflection",
  exercise: "Exercise",
  social: "Social",
  meeting: "Meeting",
  admin: "Admin",
  break: "Break",
  personal: "Personal",
};

