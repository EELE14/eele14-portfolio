/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken, COOKIE_NAME } from "@/lib/server/auth";
import { parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: NextRequest) {
  const body = await parseBody<{ email?: string; password?: string }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { compare, hash } = await import("bcryptjs");
  const dummyHash = await hash("dummy", 4);

  const user = await prisma.user.findUnique({ where: { email: body.email } });

  const storedHash = user?.passwordHash ?? dummyHash;
  const passwordValid = await compare(body.password, storedHash);
  const valid = passwordValid && user !== null;

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    isAdmin: true,
  });

  const isHttps =
    process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false;

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: false,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
