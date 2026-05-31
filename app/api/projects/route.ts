/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { slug, title, description, stack } = body;

  if (!slug?.trim() || !title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields: slug, title, description" },
      { status: 400 },
    );
  }

  if (!Array.isArray(stack) || stack.some((s) => typeof s !== "string")) {
    return NextResponse.json(
      { error: "stack must be an array of strings" },
      { status: 422 },
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim(),
        stack: stack as string[],
        sourceUrl: body.sourceUrl?.trim() || null,
        liveUrl: body.liveUrl?.trim() || null,
        imageUrls: Array.isArray(body.imageUrls)
          ? (body.imageUrls as string[]).map((u) => u.trim()).filter(Boolean)
          : [],
        githubRepo: body.githubRepo?.trim() || null,
        githubBranch: body.githubBranch?.trim() || null,
        order: typeof body.order === "number" ? body.order : 0,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}
