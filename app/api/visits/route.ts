/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { handlePrismaError } from "@/lib/server/api";

async function getCount(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "visits" } });
  return parseInt(row?.value ?? "0", 10) || 0;
}

export async function GET() {
  try {
    return NextResponse.json({ count: await getCount() });
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST() {
  try {
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value) VALUES ('visits', '1')
      ON CONFLICT (key) DO UPDATE SET value = (CAST("Setting".value AS INTEGER) + 1)::text
    `;
    return NextResponse.json({ count: await getCount() });
  } catch (e) {
    return handlePrismaError(e);
  }
}
