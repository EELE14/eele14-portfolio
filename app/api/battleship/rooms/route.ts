/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextResponse } from "next/server";
import { createRoom, getRoom, getClientRoom } from "@/lib/server/battleship";

export const dynamic = "force-dynamic";

export async function POST() {
  const { code, playerId } = createRoom();
  const room = getClientRoom(getRoom(code)!, playerId);
  return NextResponse.json({ code, playerId, room }, { status: 201 });
}
