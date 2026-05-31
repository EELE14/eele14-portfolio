/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { handlePrismaError, parseBody } from "@/lib/server/api";

const SETTING_KEY = "desktop-icon-positions";

type Pos = { x: number; y: number };

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    const positions: Record<string, Pos> = setting?.value
      ? (JSON.parse(setting.value) as Record<string, Pos>)
      : {};
    return NextResponse.json({ positions });
  } catch {
    return NextResponse.json({ positions: {} });
  }
}

export async function PUT(req: NextRequest) {
  const body = await parseBody<{ positions?: unknown }>(req);
  if (
    !body ||
    typeof body.positions !== "object" ||
    body.positions === null ||
    Array.isArray(body.positions)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const raw = body.positions as Record<string, unknown>;
  for (const v of Object.values(raw)) {
    if (
      typeof v !== "object" ||
      v === null ||
      typeof (v as Record<string, unknown>).x !== "number" ||
      typeof (v as Record<string, unknown>).y !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid position entry" },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(raw) },
      create: { key: SETTING_KEY, value: JSON.stringify(raw) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handlePrismaError(e);
  }
}
