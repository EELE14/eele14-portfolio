/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken, COOKIE_NAME } from "@/lib/server/auth";
import { parseBody } from "@/lib/server/api";
import { prisma } from "@/lib/server/prisma";
import { makeRateLimiter } from "@/lib/server/rate-limit";

const failLimiter = makeRateLimiter(5, 15 * 60 * 1000, { failuresOnly: true });

function getIp(req: NextRequest): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").at(-1)!.trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!failLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await parseBody<{ email?: string; password?: string }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.email.includes("\0") ||
    body.password.includes("\0")
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
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
    failLimiter.record(ip);
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
    httpOnly: true,
    secure: isHttps,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
