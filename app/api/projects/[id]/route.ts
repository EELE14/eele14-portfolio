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

  const body = await parseBody<{
    slug?: string;
    title?: string;
    description?: string;
    stack?: unknown;
    sourceUrl?: string;
    liveUrl?: string;
    imageUrls?: unknown;
    githubRepo?: string;
    githubBranch?: string;
    order?: number;
  }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    body.stack !== undefined &&
    (!Array.isArray(body.stack) ||
      (body.stack as unknown[]).some((s) => typeof s !== "string"))
  ) {
    return NextResponse.json(
      { error: "stack must be an array of strings" },
      { status: 422 },
    );
  }

  const data = {
    ...(body.slug != null && { slug: body.slug.trim() }),
    ...(body.title != null && { title: body.title.trim() }),
    ...(body.description != null && { description: body.description.trim() }),
    ...(body.stack != null && { stack: body.stack as string[] }),
    ...(body.sourceUrl !== undefined && {
      sourceUrl: body.sourceUrl?.trim() || null,
    }),
    ...(body.liveUrl !== undefined && {
      liveUrl: body.liveUrl?.trim() || null,
    }),
    ...(body.imageUrls !== undefined && {
      imageUrls: Array.isArray(body.imageUrls)
        ? (body.imageUrls as string[]).map((u) => u.trim()).filter(Boolean)
        : [],
    }),
    ...(body.githubRepo !== undefined && {
      githubRepo: body.githubRepo?.trim() || null,
    }),
    ...(body.githubBranch !== undefined && {
      githubBranch: body.githubBranch?.trim() || null,
    }),
    ...(typeof body.order === "number" && { order: body.order }),
  };

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const project = await prisma.project.update({ where: { id }, data });
    return NextResponse.json(project);
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
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handlePrismaError(e);
  }
}
