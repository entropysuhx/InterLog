"use server";

import { createHash } from "node:crypto";

import { format, subDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { createInsightSignature, generateInsightOutput } from "@/lib/ai/insights";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  DismissInsightSchema,
  GenerateInsightsSchema,
  InsightFeedbackSchema,
  type ActionResult,
} from "@/types";

export async function generateInsights(input: {
  periodDays: number;
  force?: boolean;
}): Promise<ActionResult<{ generated: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = GenerateInsightsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid insight period." };
  const limit = await consumeRateLimit(session.user.id, "insights", 10, 86400);
  if (!limit.allowed) return { success: false, error: "Insight refresh limit reached for today." };
  const since = subDays(new Date(), parsed.data.periodDays);
  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id, startTime: { gte: since }, duration: { not: null } },
    include: { category: true },
  });
  const reflections = await prisma.reflection.findMany({
    where: {
      userId: session.user.id,
      activityDate: { gte: format(since, "yyyy-MM-dd"), lte: format(new Date(), "yyyy-MM-dd") },
    },
    select: { id: true, activityDate: true, updatedAt: true },
  });
  const reflectionDaysCount = new Set(reflections.map((reflection) => reflection.activityDate))
    .size;
  const revision = createHash("sha256")
    .update(
      [...activities, ...reflections]
        .map((item) => `${item.id}:${item.updatedAt.toISOString()}`)
        .join("|"),
    )
    .digest("hex")
    .slice(0, 32);
  const periodKey = `${parsed.data.periodDays}d`;
  if (!parsed.data.force) {
    const existing = await prisma.insight.count({
      where: { userId: session.user.id, periodKey, sourceRevision: revision },
    });
    if (existing > 0) return { success: true, data: { generated: 0 } };
  }
  const byCategory = new Map<string, { seconds: number; sessions: number }>();
  for (const activity of activities) {
    const current = byCategory.get(activity.category.key) ?? { seconds: 0, sessions: 0 };
    current.seconds += activity.duration ?? 0;
    current.sessions += 1;
    byCategory.set(activity.category.key, current);
  }
  try {
    const output = await generateInsightOutput({
      periodLabel: `the last ${parsed.data.periodDays} days`,
      totalTrackedHours: activities.reduce((sum, item) => sum + (item.duration ?? 0), 0) / 3600,
      focusHours:
        activities
          .filter((item) => item.category.key === "deep-work")
          .reduce((sum, item) => sum + (item.duration ?? 0), 0) / 3600,
      categoryBreakdown: [...byCategory].map(([category, value]) => ({
        category,
        hours: value.seconds / 3600,
        sessions: value.sessions,
      })),
      focusSessionsByHour: [],
      reflectionDaysCount,
    });
    await prisma.insight.createMany({
      data: output.insights.map((insight) => ({
        userId: session.user.id,
        periodKey,
        sourceRevision: revision,
        observation: insight.observation,
        interpretation: insight.interpretation,
        recommendation: insight.recommendation,
        evidence: insight.evidence,
        confidence: insight.confidence.toUpperCase() as "EMERGING" | "CONSISTENT" | "STRONG",
        categoryKey: insight.category,
        signature: createInsightSignature(insight),
      })),
      skipDuplicates: true,
    });
    revalidatePath("/analytics");
    return { success: true, data: { generated: output.insights.length } };
  } catch {
    return { success: false, error: "Insights could not be loaded." };
  }
}

export async function recordInsightFeedback(input: {
  insightId: string;
  helpful: boolean;
}): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = InsightFeedbackSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid feedback." };
  const owned = await prisma.insight.findUnique({
    where: { id_userId: { id: parsed.data.insightId, userId: session.user.id } },
  });
  if (!owned) return { success: false, error: "Insight not found." };
  await prisma.insightFeedback.upsert({
    where: {
      userId_insightId: { userId: session.user.id, insightId: parsed.data.insightId },
    },
    update: { helpful: parsed.data.helpful },
    create: { userId: session.user.id, ...parsed.data },
  });
  return { success: true, data: undefined };
}

export async function dismissInsight(input: { insightId: string }): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };
  const parsed = DismissInsightSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid insight." };
  try {
    await prisma.insight.update({
      where: { id_userId: { id: parsed.data.insightId, userId: session.user.id } },
      data: { dismissedAt: new Date() },
    });
    revalidatePath("/analytics");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Insight not found." };
  }
}
