import { callDeepSeek } from "@/lib/ai/client";
import { CATEGORY_IDS, CategoryKeySchema, type CategoryKey } from "@/types";

const SYSTEM_PROMPT = `You categorize personal activities.
Return JSON only: {"category":"<key>","confidence":0.0}
Valid keys: deep-work, learning, reflection, exercise, social, meeting, admin, break, personal.
Do not include explanations.`;

export type CategorizationResult = {
  categoryKey: CategoryKey;
  categoryId: string;
  confidence: number;
  source: "AI" | "FALLBACK";
};

export async function categorizeActivity(title: string): Promise<CategorizationResult> {
  try {
    const raw = await callDeepSeek(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: title.trim().slice(0, 200) },
      ],
      { maxTokens: 64, temperature: 0.1 },
    );
    const value = JSON.parse(raw) as { category?: unknown; confidence?: unknown };
    const category = CategoryKeySchema.safeParse(value.category);
    if (!category.success) throw new Error("Invalid category.");
    const confidence =
      typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0.5;
    return {
      categoryKey: category.data,
      categoryId: CATEGORY_IDS[category.data],
      confidence,
      source: "AI",
    };
  } catch {
    return {
      categoryKey: "admin",
      categoryId: CATEGORY_IDS.admin,
      confidence: 0,
      source: "FALLBACK",
    };
  }
}

