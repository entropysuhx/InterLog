import { toActivityView } from "@/lib/activity/transform";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ProductSnapshot } from "@/types";

export async function getProductSnapshot(): Promise<{
  isAuthenticated: boolean;
  userName: string | null;
  userImage: string | null;
  snapshot: ProductSnapshot | null;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { isAuthenticated: false, userName: null, userImage: null, snapshot: null };

  const [user, activities, activeFocusSession, reflectionDays, insights, reflections] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true, preference: { select: { weekStartsOn: true } } },
      }),
      prisma.activity.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.focusSession.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { startTime: "desc" },
      }),
      prisma.reflectionDay.count({ where: { userId, status: "COMPLETED" } }),
      prisma.insight.findMany({
        where: { userId, dismissedAt: null },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.reflection.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  return {
    isAuthenticated: true,
    userName: user?.name ?? user?.email ?? session.user.name ?? session.user.email ?? null,
    userImage: user?.image ?? session.user.image ?? null,
    snapshot: {
      activities: activities.map(toActivityView),
      activeFocusSession: activeFocusSession
        ? {
            id: activeFocusSession.id,
            title: activeFocusSession.title,
            startTime: activeFocusSession.startTime.toISOString(),
            endTime: activeFocusSession.endTime?.toISOString() ?? null,
            duration: activeFocusSession.duration,
            status: activeFocusSession.status,
            activityId: activeFocusSession.activityId,
          }
        : null,
      reflectionDays,
      insights: insights.map((insight) => ({
        id: insight.id,
        observation: insight.observation,
        interpretation: insight.interpretation,
        recommendation: insight.recommendation ?? undefined,
        evidence: insight.evidence,
        confidence: insight.confidence.toLowerCase() as "emerging" | "consistent" | "strong",
      })),
      reflections: reflections.map((reflection) => ({
        id: reflection.id,
        activityDate: reflection.activityDate,
        prompt: reflection.prompt,
        answer: reflection.answer,
        updatedAt: reflection.updatedAt.toISOString(),
      })),
      weekStartsOn: user?.preference?.weekStartsOn === 0 ? 0 : 1,
    },
  };
}
