/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";

async function requireAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  return session?.isAdmin
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await parseBody<{ name?: string; icon?: string | null }>(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { name?: string; icon?: string | null } = {};

  if (body.name != null) {
    if (!String(body.name).trim()) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 422 },
      );
    }
    data.name = String(body.name).trim();
  }

  if ("icon" in body) {
    data.icon = body.icon ?? null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const skill = await prisma.skill.update({ where: { id }, data });
    return NextResponse.json(skill);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  try {
    await prisma.skill.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handlePrismaError(e);
  }
}
