/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function makeRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(ip: string): boolean {
    const now = Date.now();
    const entry = hits.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= limit) return false;
      entry.count++;
      return true;
    }

    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    }

    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  };
}
