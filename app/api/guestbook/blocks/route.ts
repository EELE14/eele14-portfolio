/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";
import { UNKNOWN_IP } from "@/lib/server/client-ip";

const MAX_REASON = 200;
// Loose on purpose — enough to keep junk out of a primary key without
// reimplementing address parsing. Covers IPv4, IPv6 and zone suffixes.
const IP_SHAPE = /^[0-9a-fA-F.:%]{3,45}$/;

async function requireAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  return session?.isAdmin
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const blocks = await prisma.guestbookBlock.findMany({
      orderBy: { createdAt: "desc" },
    });

    // One grouped query instead of one count per block.
    const counts = await prisma.guestbookEntry.groupBy({
      by: ["ipAddress"],
      _count: { _all: true },
      where: { ipAddress: { in: blocks.map((b) => b.ip) } },
    });
    const byIp = new Map(
      counts.map((c) => [c.ipAddress, c._count._all] as const),
    );

    return NextResponse.json(
      blocks.map((block) => ({
        ...block,
        entryCount: byIp.get(block.ip) ?? 0,
      })),
    );
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await parseBody<{ ip?: unknown; reason?: unknown }>(req);
  const ip = typeof body?.ip === "string" ? body.ip.trim() : "";
  const reason =
    typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, MAX_REASON)
      : "manual";

  if (!IP_SHAPE.test(ip) || ip === UNKNOWN_IP) {
    return NextResponse.json({ error: "Invalid IP address." }, { status: 422 });
  }

  try {
    // Existing entries are deliberately left alone: a block only applies to
    // future submissions. The guestbook POST already handles those, so a manual
    // block behaves exactly like an automatic one — including staying invisible
    // to the blocked visitor.
    const block = await prisma.guestbookBlock.upsert({
      where: { ip },
      create: { ip, reason },
      update: { reason },
    });
    return NextResponse.json(block);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  // Query param rather than a dynamic segment: IPv6 addresses carry colons.
  const ip = req.nextUrl.searchParams.get("ip")?.trim();
  if (!ip) {
    return NextResponse.json({ error: "Missing ip." }, { status: 422 });
  }

  try {
    // deleteMany, not delete: unblocking an already-gone block is not an error,
    // and the approve path in guestbook/[id] uses the same semantics.
    const { count } = await prisma.guestbookBlock.deleteMany({ where: { ip } });
    return NextResponse.json({ removed: count });
  } catch (e) {
    return handlePrismaError(e);
  }
}
