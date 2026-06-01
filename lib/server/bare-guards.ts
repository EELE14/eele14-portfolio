/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { IncomingMessage, ServerResponse } from "http";
import type { Duplex } from "stream";
import { jwtVerify } from "jose";
import { makeRateLimiter } from "./rate-limit";
import { validateBareTarget } from "./ssrf";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
const rateLimiter = makeRateLimiter(300, 60_000);

function getClientIp(req: IncomingMessage): string {
  const cf = req.headers["cf-connecting-ip"] as string | undefined;
  if (cf) return cf.trim();
  const xff = req.headers["x-forwarded-for"] as string | undefined;
  if (xff) return xff.split(",").at(-1)!.trim();
  return req.socket.remoteAddress ?? "unknown";
}

function isAllowedOrigin(req: IncomingMessage): boolean {
  const origin = req.headers["origin"] as string | undefined;
  const referer = req.headers["referer"] as string | undefined;
  const host = req.headers["host"] as string | undefined;

  let refererOrigin: string | undefined;
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      /* malformed */
    }
  }

  const check = origin ?? refererOrigin;
  if (!check) return true;
  if (host && (check === `https://${host}` || check === `http://${host}`))
    return true;
  return check === ALLOWED_ORIGIN;
}

async function isValidToken(req: IncomingMessage): Promise<boolean> {
  const secret = process.env.BARE_TOKEN_SECRET;
  if (!secret) return true;
  const token = req.headers["x-portfolio-auth"] as string | undefined;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function rejectHttp(
  res: ServerResponse,
  status: number,
  id: string,
  message: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ id, message }));
}

function rejectWs(socket: Duplex, status: number, text: string): void {
  socket.write(`HTTP/1.1 ${status} ${text}\r\n\r\n`);
  socket.destroy();
}

export async function guardHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const ip = getClientIp(req);

  if (!isAllowedOrigin(req)) {
    console.error("[bare] 403 origin", {
      origin: req.headers["origin"],
      host: req.headers["host"],
      ip,
    });
    rejectHttp(res, 403, "FORBIDDEN", "Forbidden");
    return false;
  }
  if (!(await isValidToken(req))) {
    console.error("[bare] 401 token", { ip });
    rejectHttp(res, 401, "UNAUTHORIZED", "Unauthorized");
    return false;
  }
  if (!rateLimiter.check(ip)) {
    console.error("[bare] 429 rate-limit", { ip });
    rejectHttp(res, 429, "TOO_MANY_REQUESTS", "Too Many Requests");
    return false;
  }

  const ssrf = await validateBareTarget(req);
  if (!ssrf.ok) {
    console.error("[bare] 403 ssrf", {
      reason: ssrf.reason,
      target: req.headers["x-bare-url"],
      ip,
    });
    rejectHttp(res, 403, "FORBIDDEN", "Forbidden");
    return false;
  }

  return true;
}

export async function guardWs(
  req: IncomingMessage,
  socket: Duplex,
): Promise<boolean> {
  const ip = getClientIp(req);

  if (!isAllowedOrigin(req)) {
    console.error("[bare] ws 403 origin", { ip });
    rejectWs(socket, 403, "Forbidden");
    return false;
  }
  if (!(await isValidToken(req))) {
    console.error("[bare] ws 401 token", { ip });
    rejectWs(socket, 401, "Unauthorized");
    return false;
  }
  if (!rateLimiter.check(ip)) {
    console.error("[bare] ws 429 rate-limit", { ip });
    rejectWs(socket, 429, "Too Many Requests");
    return false;
  }

  const ssrf = await validateBareTarget(req);
  if (!ssrf.ok) {
    console.error("[bare] ws 403 ssrf", {
      reason: ssrf.reason,
      target: req.headers["x-bare-url"],
      ip,
    });
    rejectWs(socket, 403, "Forbidden");
    return false;
  }

  return true;
}
