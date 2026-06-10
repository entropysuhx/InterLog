"use server";

import { revalidatePath } from "next/cache";

import { generateWrappedOutput } from "@/lib/ai/wrapped";
import type { WrappedInput } from "@/lib/ai/wrapped";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { aggregateWrapped } from "@/lib/wrapped/aggregate";
import {
  GenerateWrappedSchema,
  type ActionResult,
  type WrappedCardData,
  type WrappedOutput,
} from "@/types";

function factualFallback(input: WrappedInput): WrappedOutput {
  const cards: WrappedCardData[] = [
      {
        type: "orientation",
        headline: `Your ${input.periodLabel} in time`,
        body: "A calm look at what you recorded.",
      },
      {
        type: "time-overview",
        headline: "Time you made visible",
        body: "This is the time captured in InterLog.",
        stat: { value: `${Math.round(input.totalTrackedHours)}h`, label: "tracked" },
      },
      {
        type: "focus-pattern",
        headline: "Focused time",
        body: "Deep work is shown as a pattern, not a score.",
        stat: { value: `${Math.round(input.focusHours)}h`, label: "deep work" },
      },
      ...(input.topCategories[0]
        ? [
            {
              type: "category-story" as const,
              headline: `${input.topCategories[0].category} received the most time`,
              body: "This category received the largest share of your tracked time.",
            },
          ]
        : []),
      ...(input.reflectionDaysCount > 0
        ? [
            {
              type: "reflection-highlight" as const,
              headline: `${input.reflectionDaysCount} reflection days`,
              body: "Each reflection added context to your timeline.",
            },
          ]
        : []),
      {
        type: "achievement",
        headline: "You made your time visible",
        body: "This report uses only the activities you chose to record.",
      },
    ];
  if (input.period === "yearly") {
    cards.push(
      {
        type: "time-overview",
        headline: "An average across the year",
        body: "The monthly average is calculated from your total tracked time.",
        stat: {
          value: `${Math.round(input.totalTrackedHours / 12)}h`,
          label: "average per month",
        },
      },
      {
        type: "reflection-highlight",
        headline: "Context you added",
        body: `${input.reflectionDaysCount} days included a completed reflection.`,
      },
    );
  }
  cards.push(
      {
        type: "forward-prompt",
        headline: "What do you want more of next time?",
        body: "Carry one useful pattern forward, and leave the rest open.",
        ctaLabel: "Start a reflection",
      },
  );
  while (cards.length < (input.period === "monthly" ? 5 : 8)) {
    cards.splice(cards.length - 1, 0, {
      type: "achievement",
      headline: "A record built one entry at a time",
      body: "Every statement in this report is grounded in your tracked activity data.",
    });
  }
  return { cards };
}

export async function generateWrapped(input: {
  period: "monthly" | "yearly";
  periodKey: string;
  force?: boolean;
}): Promise<ActionResult<{ cards: WrappedCardData[]; insufficientData: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = GenerateWrappedSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid Wrapped period." };
  const rateLimit = await consumeRateLimit(
    session.user.id,
    `wrapped:${parsed.data.period}:${parsed.data.periodKey}`,
    5,
    31536000,
  );
  if (!rateLimit.allowed) return { success: false, error: "Wrapped regeneration limit reached." };
  const aggregated = await aggregateWrapped(
    session.user.id,
    parsed.data.period,
    parsed.data.periodKey,
  );
  const insufficientData =
    parsed.data.period === "yearly" && aggregated.input.totalTrackedHours < 10;
  if (insufficientData) return { success: true, data: { cards: [], insufficientData: true } };
  const periodEnum = parsed.data.period === "monthly" ? "MONTHLY" : "YEARLY";
  if (!parsed.data.force) {
    const cached = await prisma.wrappedSummary.findUnique({
      where: {
        userId_period_periodKey_sourceRevision: {
          userId: session.user.id,
          period: periodEnum,
          periodKey: parsed.data.periodKey,
          sourceRevision: aggregated.sourceRevision,
        },
      },
    });
    if (cached?.status === "READY" && Array.isArray(cached.cards)) {
      return {
        success: true,
        data: { cards: cached.cards as WrappedCardData[], insufficientData: false },
      };
    }
  }
  let output: WrappedOutput;
  try {
    output = await generateWrappedOutput(aggregated.input);
  } catch {
    output = factualFallback(aggregated.input);
  }
  await prisma.wrappedSummary.upsert({
    where: {
      userId_period_periodKey_sourceRevision: {
        userId: session.user.id,
        period: periodEnum,
        periodKey: parsed.data.periodKey,
        sourceRevision: aggregated.sourceRevision,
      },
    },
    create: {
      userId: session.user.id,
      period: periodEnum,
      periodKey: parsed.data.periodKey,
      sourceRevision: aggregated.sourceRevision,
      status: "READY",
      cards: output.cards,
      generationCount: 1,
    },
    update: {
      status: "READY",
      cards: output.cards,
      generationCount: { increment: 1 },
      errorCode: null,
    },
  });
  revalidatePath("/wrapped");
  return { success: true, data: { cards: output.cards, insufficientData: false } };
}

export async function regenerateWrapped(input: {
  period: "monthly" | "yearly";
  periodKey: string;
}): Promise<ActionResult<{ cards: WrappedCardData[]; insufficientData: boolean }>> {
  return generateWrapped({ ...input, force: true });
}
