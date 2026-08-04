/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { IncomingHttpHeaders } from "http";

export const UNKNOWN_IP = "unknown";

function fromHeaderValues(
  cf: string | undefined,
  forwarded: string | undefined,
): string {
  const direct = cf?.trim();
  if (direct) return direct;
  const hop = forwarded?.split(",").at(-1)?.trim();
  return hop || UNKNOWN_IP;
}

export function getClientIp(headers: Headers): string {
  return fromHeaderValues(
    headers.get("cf-connecting-ip") ?? undefined,
    headers.get("x-forwarded-for") ?? undefined,
  );
}

export function getClientIpFromNodeHeaders(
  headers: IncomingHttpHeaders,
): string {
  return fromHeaderValues(
    headers["cf-connecting-ip"] as string | undefined,
    headers["x-forwarded-for"] as string | undefined,
  );
}
