import { callDeepSeek } from "@/lib/ai/client";
import { WrappedOutputSchema, type WrappedOutput } from "@/types";

export type WrappedInput = {
  period: "monthly" | "yearly";
  periodLabel: string;
  totalTrackedHours: number;
  focusHours: number;
  topCategories: { category: string; hours: number; percentage: number }[];
  longestFocusSession: { durationMinutes: number; title: string; date: string } | null;
  mostProductiveDay: { dayName: string; averageHours: number } | null;
  reflectionDaysCount: number;
};

export async function generateWrappedOutput(input: WrappedInput): Promise<WrappedOutput> {
  const minimum = input.period === "monthly" ? 5 : 8;
  const maximum = input.period === "monthly" ? 7 : 12;
  const raw = await callDeepSeek(
    [
      {
        role: "system",
        content:
          "Create a factual, warm time-use report. Never invent comparisons, achievements, or superlatives.",
      },
      {
        role: "user",
        content: `Create ${minimum}-${maximum} JSON cards from these anonymized statistics: ${JSON.stringify(input)}.
Always include orientation and forward-prompt. Allowed types: orientation, time-overview, category-story, focus-pattern, reflection-highlight, achievement, forward-prompt.
Return {"cards":[{"type":"","headline":"","body":"","stat":{"value":"","label":""},"ctaLabel":""}]}.`,
      },
    ],
    { maxTokens: 1600, temperature: 0.3 },
  );
  const output = WrappedOutputSchema.parse(JSON.parse(raw));
  const hasOrientation = output.cards.some((card) => card.type === "orientation");
  const hasForwardPrompt = output.cards.some((card) => card.type === "forward-prompt");
  if (
    !hasOrientation ||
    !hasForwardPrompt ||
    output.cards.length < minimum ||
    output.cards.length > maximum
  ) {
    throw new Error("Wrapped output did not meet its narrative contract.");
  }
  return output;
}

