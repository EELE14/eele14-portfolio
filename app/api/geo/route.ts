/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextResponse, type NextRequest } from "next/server";

const UPSTREAM = "https://ipapi.co";
const CACHE_SECONDS = 3600;

const PRIVATE_IP =
  /^(::1|::ffff:127\.|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|f[cd])/i;

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip")?.trim();
  if (!ip || PRIVATE_IP.test(ip)) return null;
  return ip;
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const url = ip ? `${UPSTREAM}/${ip}/json/` : `${UPSTREAM}/json/`;

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "eele14.dev" },
      next: { revalidate: CACHE_SECONDS },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    return NextResponse.json({
      ip: data.ip ?? null,
      city: data.city ?? null,
      country_name: data.country_name ?? null,
      org: data.org ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "upstream unreachable" },
      { status: 502 },
    );
  }
}
