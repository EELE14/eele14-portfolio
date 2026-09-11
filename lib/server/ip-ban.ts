/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { IncomingMessage } from "http";
import { prisma } from "./prisma";
import { getClientIp, getClientIpFromRequest, UNKNOWN_IP } from "./client-ip";
import { ipInPrefix, parseIp, parsePrefix, type IpPrefix } from "./ip-net";

const TTL_MS = 30_000;

interface BanCache {
  prefixes: IpPrefix[];
  loadedAt: number;
  inFlight: Promise<void> | null;
}

declare global {
  var __ipBanCache: BanCache | undefined;
}

const cache: BanCache = (globalThis.__ipBanCache ??= {
  prefixes: [],
  loadedAt: 0,
  inFlight: null,
});

async function load(): Promise<void> {
  try {
    const rows = await prisma.ipBan.findMany({ select: { network: true } });
    const prefixes: IpPrefix[] = [];
    for (const row of rows) {
      const prefix = parsePrefix(row.network);
      if (prefix) prefixes.push(prefix);
      else console.error("[ip-ban] unparseable network in table", row.network);
    }
    cache.prefixes = prefixes;
    cache.loadedAt = Date.now();
  } catch (e) {
    console.error("[ip-ban] refresh failed, serving stale list", e);
    cache.loadedAt = Date.now();
  }
}

function refresh(): Promise<void> {
  if (Date.now() - cache.loadedAt < TTL_MS) return Promise.resolve();
  cache.inFlight ??= load().finally(() => {
    cache.inFlight = null;
  });
  return cache.inFlight;
}

export function invalidateBanCache(): void {
  cache.loadedAt = 0;
}

export async function isBannedIp(ip: string): Promise<boolean> {
  if (ip === UNKNOWN_IP) return false;
  await refresh();
  if (cache.prefixes.length === 0) return false;

  const parsed = parseIp(ip);
  if (!parsed) return false;
  return cache.prefixes.some((prefix) => ipInPrefix(parsed.bytes, prefix));
}

export function isBannedRequest(headers: Headers): Promise<boolean> {
  return isBannedIp(getClientIp(headers));
}

export function isBannedNodeRequest(req: IncomingMessage): Promise<boolean> {
  return isBannedIp(getClientIpFromRequest(req));
}
