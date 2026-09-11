/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { banGuard } from "@/lib/server/api";
import { createRoom, getRoom, getClientRoom } from "@/lib/server/battleship";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const banned = await banGuard(req);
  if (banned) return banned;

  const { code, playerId } = createRoom();
  const room = getClientRoom(getRoom(code)!, playerId);
  return NextResponse.json({ code, playerId, room }, { status: 201 });
}
