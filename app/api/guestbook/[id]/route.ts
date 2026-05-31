/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError } from "@/lib/server/api";

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

  const { id } = await params;
  try {
    const existing = await prisma.guestbookEntry.findUnique({ where: { id } });
    const entry = await prisma.guestbookEntry.update({
      where: { id },
      data: { approved: true, blocked: false },
    });
    if (existing?.blocked && existing.ipAddress) {
      await prisma.guestbookBlock.deleteMany({
        where: { ip: existing.ipAddress },
      });
    }
    return NextResponse.json(entry);
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
    await prisma.guestbookEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handlePrismaError(e);
  }
}
