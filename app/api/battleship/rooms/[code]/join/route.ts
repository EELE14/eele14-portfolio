/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { joinRoom, getRoom, getClientRoom } from "@/lib/server/battleship";
import { banGuard } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const banned = await banGuard(req);
  if (banned) return banned;

  const { code } = await params;
  const result = joinRoom(code);

  if ("error" in result) {
    const status =
      result.error === "Room not found"
        ? 404
        : result.error === "Room is full"
          ? 409
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const upper = code.toUpperCase();
  const room = getClientRoom(getRoom(upper)!, result.playerId);
  return NextResponse.json(
    { playerId: result.playerId, room },
    { status: 200 },
  );
}
