/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";

const MAX_BIO = 5_000;

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "bio" } });
    return NextResponse.json({ bio: setting?.value ?? "" });
  } catch {
    return NextResponse.json({ bio: "" });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<{ bio?: string }>(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.bio !== "string") {
    return NextResponse.json({ error: "Missing bio" }, { status: 400 });
  }

  if (body.bio.length > MAX_BIO) {
    return NextResponse.json(
      { error: `Bio too long (max ${MAX_BIO} chars)` },
      { status: 422 },
    );
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key: "bio" },
      update: { value: body.bio },
      create: { key: "bio", value: body.bio },
    });
    return NextResponse.json({ bio: setting.value });
  } catch (e) {
    return handlePrismaError(e);
  }
}
