/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

function getSecret(): Uint8Array {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set,refusing to start in production without it.",
    );
  }
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-replace-in-production",
  );
}

const ALGORITHM = "HS256";
const COOKIE_NAME = "portfolio_session";

export interface SessionPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
