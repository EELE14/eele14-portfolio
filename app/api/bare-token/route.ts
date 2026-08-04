/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getClientIp } from "@/lib/server/client-ip";
import { makeRateLimiter } from "@/lib/server/rate-limit";

const rateLimiter = makeRateLimiter(5, 60_000);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.BARE_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ token: "dev" });
  }

  const ip = getClientIp(req.headers);
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
