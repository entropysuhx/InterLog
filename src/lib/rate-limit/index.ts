import { prisma } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  key: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const activeEvent = await prisma.rateLimitEvent.findFirst({
    where: { key, action, expiresAt: { gt: now } },
    orderBy: { windowStart: "desc" },
  });
  const event = activeEvent
    ? await prisma.rateLimitEvent.update({
        where: { id: activeEvent.id },
        data: { count: { increment: 1 } },
      })
    : await prisma.rateLimitEvent.create({
        data: {
          key,
          action,
          windowStart: now,
          expiresAt: new Date(now.getTime() + windowSeconds * 1000),
          count: 1,
        },
      });

  return {
    allowed: event.count <= limit,
    remaining: Math.max(0, limit - event.count),
    retryAfterSeconds: Math.max(1, Math.ceil((event.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function getRateLimitStatus(
  key: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const event = await prisma.rateLimitEvent.findFirst({
    where: { key, action, expiresAt: { gt: now } },
    orderBy: { windowStart: "desc" },
  });
  const count = event?.count ?? 0;
  const expiresAt = event?.expiresAt ?? new Date(now.getTime() + windowSeconds * 1000);

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(key: string, action: string): Promise<void> {
  await prisma.rateLimitEvent.deleteMany({ where: { key, action } });
}
