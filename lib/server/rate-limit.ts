/* Copyright (c) 2026 eele14. All Rights Reserved. */

interface RateLimiter {
  check(ip: string): boolean;
  record(ip: string): void;
}

export function makeRateLimiter(
  limit: number,
  windowMs: number,
  opts: { failuresOnly?: boolean } = {},
): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function increment(ip: string): void {
    const now = Date.now();
    const entry = hits.get(ip);
    if (entry && now < entry.resetAt) {
      entry.count++;
      return;
    }
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    }
    hits.set(ip, { count: 1, resetAt: now + windowMs });
  }

  function isBlocked(ip: string): boolean {
    const now = Date.now();
    const entry = hits.get(ip);
    return !!entry && now < entry.resetAt && entry.count >= limit;
  }

  return {
    check(ip: string): boolean {
      if (isBlocked(ip)) return false;
      if (!opts.failuresOnly) increment(ip);
      return true;
    },
    record(ip: string): void {
      increment(ip);
    },
  };
}
