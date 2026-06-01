/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { makeRateLimiter } from "@/lib/server/rate-limit";

const rateLimiter = makeRateLimiter(5, 60_000);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown"
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.BARE_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ token: "dev" });
  }

  const ip = getClientIp(req);
  if (!rateLimiter.check(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);

  return NextResponse.json({ token });
}
