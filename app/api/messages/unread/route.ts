/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.contactMessage.count({ where: { read: false } });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
