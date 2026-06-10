import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const [activities, focusSessions, wrappedSummaries] = await Promise.all([
    prisma.activity.findMany({ where: { userId } }),
    prisma.focusSession.findMany({ where: { userId } }),
    prisma.wrappedSummary.findMany({ where: { userId } }),
  ]);
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      activities,
      focusSessions,
      wrappedSummaries,
      privacyNote: "Reflection answers and mood entries are intentionally excluded.",
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="interlog-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
