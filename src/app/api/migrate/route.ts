import { NextResponse } from "next/server";

import { migrateGuestData, type MigrateGuestDataInput } from "@/actions/migrate";
import { isTrustedJsonRequest } from "@/lib/http/security";

export async function POST(request: Request): Promise<Response> {
  if (!isTrustedJsonRequest(request)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await migrateGuestData((await request.json()) as MigrateGuestDataInput);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

