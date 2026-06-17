import { NextResponse } from "next/server";

import { migrateGuestData, type MigrateGuestDataInput } from "@/actions/migrate";
import { isTrustedJsonRequest } from "@/lib/http/security";

export async function POST(request: Request): Promise<Response> {
  if (!isTrustedJsonRequest(request)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let body: MigrateGuestDataInput;
  try {
    body = (await request.json()) as MigrateGuestDataInput;
  } catch (error) {
    console.error("Guest migration JSON parse failed", error);
    return NextResponse.json(
      { success: false, error: "We couldn't import your guest data right now." },
      { status: 400 },
    );
  }
  const result = await migrateGuestData(body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
