import { NextResponse } from "next/server";
import { z } from "zod";

import { categorizeActivity } from "@/lib/ai/categorize";
import { getClientAddress, isTrustedJsonRequest } from "@/lib/http/security";
import { consumeRateLimit } from "@/lib/rate-limit";

const CategorizeSchema = z.object({ title: z.string().trim().min(1).max(200) }).strict();

export async function POST(request: Request): Promise<Response> {
  if (!isTrustedJsonRequest(request)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = CategorizeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid title." }, { status: 400 });
  try {
    const rateLimit = await consumeRateLimit(getClientAddress(request), "guest-categorize", 30, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
  } catch {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Categorization unavailable." }, { status: 503 });
    }
  }
  const result = await categorizeActivity(parsed.data.title);
  return NextResponse.json({
    categoryKey: result.categoryKey,
    confidence: result.confidence,
    source: result.source,
  });
}

