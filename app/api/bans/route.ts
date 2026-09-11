/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { handlePrismaError, parseBody, requireAdmin } from "@/lib/server/api";
import { getClientIp, UNKNOWN_IP } from "@/lib/server/client-ip";
import { invalidateBanCache } from "@/lib/server/ip-ban";
import {
  formatPrefix,
  ipInPrefix,
  parseIp,
  parsePrefix,
} from "@/lib/server/ip-net";

const MAX_REASON = 200;

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const bans = await prisma.ipBan.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bans);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await parseBody<{ network?: unknown; reason?: unknown }>(req);
  const raw = typeof body?.network === "string" ? body.network.trim() : "";
  const reason =
    typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, MAX_REASON)
      : "manual";

  const prefix = parsePrefix(raw);
  if (!prefix) {
    return NextResponse.json(
      { error: "Not a valid address or CIDR range." },
      { status: 422 },
    );
  }

  const own = getClientIp(req.headers);
  if (own !== UNKNOWN_IP) {
    const parsedOwn = parseIp(own);
    if (parsedOwn && ipInPrefix(parsedOwn.bytes, prefix)) {
      return NextResponse.json(
        { error: `That range covers your own address (${own}).` },
        { status: 422 },
      );
    }
  }

  const network = formatPrefix(prefix);

  try {
    const ban = await prisma.ipBan.upsert({
      where: { network },
      create: { network, reason },
      update: { reason },
    });
    invalidateBanCache();
    return NextResponse.json(ban, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const raw = req.nextUrl.searchParams.get("network")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing network." }, { status: 422 });
  }

  const prefix = parsePrefix(raw);
  if (!prefix) {
    return NextResponse.json({ error: "Invalid network." }, { status: 422 });
  }

  try {
    const { count } = await prisma.ipBan.deleteMany({
      where: { network: formatPrefix(prefix) },
    });
    invalidateBanCache();
    return NextResponse.json({ removed: count });
  } catch (e) {
    return handlePrismaError(e);
  }
}
