/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { resolve4, resolve6 } from "dns/promises";
import type { IncomingMessage } from "http";

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = parseInt(p, 10);
    if (isNaN(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  return (
    (n & 0xff000000) === 0x00000000 || // 0/8
    (n & 0xff000000) === 0x0a000000 || // 10/8
    (n & 0xffc00000) === 0x64400000 || // 100.64/10 (CGNAT)
    (n & 0xff000000) === 0x7f000000 || // 127/8 (loopback)
    (n & 0xffff0000) === 0xa9fe0000 || // 169.254/16 (link-local / cloud metadata)
    (n & 0xfff00000) === 0xac100000 || // 172.16/12
    (n & 0xffff0000) === 0xc0a80000 || // 192.168/16
    (n & 0xf0000000) === 0xf0000000 // 240/4 + broadcast
  );
}

function isPrivateIp(ip: string): boolean {
  const addr = ip.startsWith("[") ? ip.slice(1, ip.lastIndexOf("]")) : ip;

  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPrivateIpv4(mapped[1]);

  if (/^\d+\.\d+\.\d+\.\d+$/.test(addr)) return isPrivateIpv4(addr);

  const lower = addr.toLowerCase();
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "ws:", "wss:"]);
const BLOCKED_HOSTNAME = /\.(local|internal|localhost|onion)$|^localhost$/i;

export async function validateBareTarget(
  req: IncomingMessage,
): Promise<{ ok: boolean; reason?: string }> {
  const rawUrl = req.headers["x-bare-url"] as string | undefined;
  if (!rawUrl) return { ok: true };

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "INVALID_URL" };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: "PROTOCOL_NOT_ALLOWED" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAME.test(hostname)) {
    return { ok: false, reason: "HOSTNAME_BLOCKED" };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return isPrivateIpv4(hostname)
      ? { ok: false, reason: "PRIVATE_IP_BLOCKED" }
      : { ok: true };
  }
  if (hostname.includes(":")) {
    return isPrivateIp(hostname)
      ? { ok: false, reason: "PRIVATE_IP_BLOCKED" }
      : { ok: true };
  }

  const [v4, v6] = await Promise.allSettled([
    resolve4(hostname),
    resolve6(hostname),
  ]);
  const ips = [
    ...(v4.status === "fulfilled" ? v4.value : []),
    ...(v6.status === "fulfilled" ? v6.value : []),
  ];

  for (const ip of ips) {
    if (isPrivateIp(ip)) return { ok: false, reason: "PRIVATE_IP_BLOCKED" };
  }

  return { ok: true };
}
