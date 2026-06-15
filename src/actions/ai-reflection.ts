"use server";

import { callDeepSeek } from "@/lib/ai/client";

export type GenerateAiReflectionRequest = {
  activitiesText: string;
  reflectionsText: string;
};

export type AiReflectionResponse = {
  reflection: string;
  observation: string;
  weeklyLetter: string;
  theme: string;
};

export async function generateAiReflection(
  request: GenerateAiReflectionRequest
): Promise<{ success: true; data: AiReflectionResponse } | { success: false; error: string }> {
  try {
    const prompt = `You are a thoughtful, supportive, and reflective AI assistant for InterLog, a personal time-tracking app.
Your goal is to help the user understand how they spend their time, reflect on their days, and notice patterns.
DO NOT use productivity scoring, efficiency metrics, performance language, or judgmental recommendations.

The user has provided their recent activities and reflections.
Activities:
${request.activitiesText}

Reflections:
${request.reflectionsText}

Generate a JSON object with the following three fields:
1. "reflection": A short, supportive reflection on their recent activities (e.g., "Today you spent 2 hours learning and 1 hour in deep work. Even though the day felt busy, you consistently returned to activities that support your long-term goals.")
2. "observation": One specific thing worth noticing about their patterns. (e.g., "Most of your learning sessions happened after 8 PM. This may be the time of day when you naturally focus best.")
3. "weeklyLetter": A thoughtful, personalized letter summarizing their week. Start with "Dear User," or "Hello,". (e.g., "This week wasn't perfect, but it was meaningful... See you next week, InterLog")
4. "theme": A single word or very short phrase representing the theme of their week (e.g., "Consistency", "Persistence", "Momentum").

Output ONLY valid JSON.`;

    const content = await callDeepSeek(
      [
        { role: "system", content: "You output JSON only." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7, maxTokens: 800 }
    );

    const parsed = JSON.parse(content) as AiReflectionResponse;
    if (!parsed.reflection || !parsed.observation || !parsed.weeklyLetter) {
      throw new Error("Missing required fields in AI response.");
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("generateAiReflection error:", error);
    return { success: false, error: "Failed to generate AI reflection." };
  }
}
