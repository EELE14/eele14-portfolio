/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  return NextResponse.json(
    { isAdmin: session?.isAdmin ?? false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
