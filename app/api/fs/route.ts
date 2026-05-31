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

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const isAdmin = !!session?.isAdmin;

  const parentId = req.nextUrl.searchParams.get("parentId") ?? null;

  try {
    const nodes = await prisma.fsNode.findMany({
      where: {
        parentId: parentId ?? null,
        ...(isAdmin ? {} : { isPublic: true }),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(nodes);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<{
    name?: string;
    type?: string;
    parentId?: string;
    content?: string;
    isPublic?: boolean;
  }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, type, parentId, content, isPublic } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (FS_INVALID_NAME.test(name)) {
    return NextResponse.json(
      { error: "name must not contain \\ or /" },
      { status: 422 },
    );
  }
  if (name.length > FS_MAX_NAME) {
    return NextResponse.json(
      { error: `name too long (max ${FS_MAX_NAME})` },
      { status: 422 },
    );
  }
  if (type !== "file" && type !== "folder") {
    return NextResponse.json(
      { error: "type must be 'file' or 'folder'" },
      { status: 422 },
    );
  }

  try {
    const duplicate = await prisma.fsNode.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        parentId: parentId ?? null,
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A file or folder with that name already exists" },
        { status: 409 },
      );
    }

    const node = await prisma.fsNode.create({
      data: {
        name: name.trim(),
        type,
        parentId: parentId ?? null,
        content: type === "file" ? (content ?? "") : null,
        isPublic: isPublic ?? false,
      },
    });
    return NextResponse.json(node, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}
