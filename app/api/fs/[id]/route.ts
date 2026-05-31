/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import {
  handlePrismaError,
  parseBody,
  FS_MAX_NAME,
  FS_INVALID_NAME,
} from "@/lib/server/api";
import { VFS_ROOT_NAMES } from "@/lib/shared/vfs/constants";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const raw = req.nextUrl.searchParams.has("raw");
  const session = await getSessionFromRequest(req);
  const isAdmin = !!session?.isAdmin;

  try {
    const node = await prisma.fsNode.findUnique({ where: { id } });
    if (!node)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isAdmin && !node.isPublic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (raw) {
      return new NextResponse(node.content ?? "", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json(node);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<{
    name?: string;
    content?: string;
    isPublic?: boolean;
    parentId?: string | null;
  }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json(
        { error: "name must not be empty" },
        { status: 422 },
      );
    }
    if (FS_INVALID_NAME.test(body.name)) {
      return NextResponse.json(
        { error: "name must not contain \\ or /" },
        { status: 422 },
      );
    }
    if (body.name.length > FS_MAX_NAME) {
      return NextResponse.json(
        { error: `name too long (max ${FS_MAX_NAME})` },
        { status: 422 },
      );
    }
  }

  try {
    const updated = await prisma.fsNode.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Refuse to delete virtual root mount points
    const target = await prisma.fsNode.findUnique({
      where: { id },
      select: { name: true, parentId: true },
    });
    if (
      target &&
      target.parentId === null &&
      VFS_ROOT_NAMES.has(target.name.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Cannot delete system directory" },
        { status: 403 },
      );
    }

    const toDelete: string[] = [id];
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = await prisma.fsNode.findMany({
        where: { parentId: current },
        select: { id: true },
      });
      for (const child of children) {
        toDelete.push(child.id);
        queue.push(child.id);
      }
    }

    // Delete in reverse order (deepest children first)
    const reversed = [...toDelete].reverse();
    await prisma.fsNode.deleteMany({ where: { id: { in: reversed } } });

    return NextResponse.json({ deleted: toDelete.length });
  } catch (e) {
    return handlePrismaError(e);
  }
}
