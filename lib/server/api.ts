/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function handlePrismaError(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e.code === "P2002") {
      const field = Array.isArray(e.meta?.target)
        ? (e.meta.target as string[]).join(", ")
        : "field";
      return NextResponse.json(
        { error: `Conflict: ${field} already exists` },
        { status: 409 },
      );
    }
  }
  console.error("[API]", e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function parseBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const FS_MAX_NAME = 100;
export const FS_INVALID_NAME = /[\\\/]/;
