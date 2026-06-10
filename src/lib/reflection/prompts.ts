import type { ActivityView, ReflectionPromptSet } from "@/types";

const OPTIONAL_PROMPTS = [
  "What are you proud of today?",
  "What drained your energy?",
  "What distracted you the most?",
  "What would you like to do differently tomorrow?",
  "What surprised you today?",
  "What do you want to carry into tomorrow?",
] as const;

export function selectReflectionPrompts(activities: ActivityView[]): ReflectionPromptSet {
  const tracked = activities.reduce((sum, activity) => sum + (activity.duration ?? 0), 0);
  const focus = activities
    .filter((activity) => activity.categoryKey === "deep-work")
    .reduce((sum, activity) => sum + (activity.duration ?? 0), 0);
  const primaryPrompt =
    focus >= 7200
      ? "What helped you focus today?"
      : tracked < 7200
        ? "What felt important even if you did not track it?"
        : "What felt meaningful today?";

  const daySeed = new Date().getDate() % OPTIONAL_PROMPTS.length;
  const first = OPTIONAL_PROMPTS[daySeed];
  const secondCandidate = OPTIONAL_PROMPTS[(daySeed + 3) % OPTIONAL_PROMPTS.length];
  const second =
    first.includes("drained") && secondCandidate.includes("distracted")
      ? OPTIONAL_PROMPTS[(daySeed + 4) % OPTIONAL_PROMPTS.length]
      : secondCandidate;
  return { primaryPrompt, optionalPrompts: [first, second] };
}

