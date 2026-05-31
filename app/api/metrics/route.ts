/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getMetrics());
  } catch {
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 },
    );
  }
}
