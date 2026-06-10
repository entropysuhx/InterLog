import { createHash } from "node:crypto";

import { callDeepSeek } from "@/lib/ai/client";
import { InsightOutputSchema, type InsightOutput } from "@/types";

const PROHIBITED = [
  "lazy",
  "unproductive",
  "wasted time",
  "sleep-deprived",
  "stressed",
  "most users",
];

export type InsightInput = {
  periodLabel: string;
  totalTrackedHours: number;
  focusHours: number;
  categoryBreakdown: { category: string; hours: number; sessions: number }[];
  focusSessionsByHour: { hour: number; averageMinutes: number; sessions: number }[];
  reflectionDaysCount: number;
};

function containsProhibitedContent(output: InsightOutput): boolean {
  return output.insights.some((insight) => {
    const text = `${insight.observation} ${insight.interpretation} ${insight.recommendation ?? ""}`.toLowerCase();
    return PROHIBITED.some((term) => text.includes(term));
  });
}

export async function generateInsightOutput(input: InsightInput): Promise<InsightOutput> {
  const prompt = `Analyze these anonymized activity statistics and return 2-4 concise insights.
Separate observation, interpretation, optional recommendation, evidence, confidence.
Recommendations must be framed as experiments. Do not diagnose, moralize, or compare users.
Input: ${JSON.stringify(input)}
Return JSON: {"insights":[{"observation":"","interpretation":"","recommendation":"","evidence":"","confidence":"emerging|consistent|strong","category":"optional-valid-category"}]}`;

  const raw = await callDeepSeek(
    [
      { role: "system", content: "You produce evidence-based personal time-use insights." },
      { role: "user", content: prompt },
    ],
    { maxTokens: 1000, temperature: 0.2 },
  );
  const parsed = InsightOutputSchema.parse(JSON.parse(raw));
  if (containsProhibitedContent(parsed)) throw new Error("AI output did not pass content policy.");
  return parsed;
}

export function createInsightSignature(value: object): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32);
}

