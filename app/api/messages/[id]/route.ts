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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await parseBody<{ read?: boolean }>(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.read == null) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const msg = await prisma.contactMessage.update({
      where: { id },
      data: { read: body.read },
    });
    return NextResponse.json(msg);
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
    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handlePrismaError(e);
  }
}
