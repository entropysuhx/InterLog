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
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000,
  );
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  const event = await prisma.rateLimitEvent.upsert({
    where: { key_action_windowStart: { key, action, windowStart } },
    create: { key, action, windowStart, expiresAt, count: 1 },
    update: { count: { increment: 1 } },
  });

  return {
    allowed: event.count <= limit,
    remaining: Math.max(0, limit - event.count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

