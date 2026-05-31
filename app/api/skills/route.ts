/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(skills);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<{ name?: string; icon?: string | null }>(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "Missing required field: name" },
      { status: 400 },
    );
  }

  try {
    const skill = await prisma.skill.create({
      data: { name: body.name.trim(), icon: body.icon ?? null },
    });
    return NextResponse.json(skill, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}
