/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { fetchBlob } from "@/lib/server/github";

interface Params {
  owner: string;
  repo: string;
  path: string[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { owner, repo, path: segments } = await params;
  const branch = req.nextUrl.searchParams.get("branch") ?? undefined;
  const filePath = segments.join("/");

  const response = await fetchBlob(owner, repo, filePath, branch);

  if (response === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return response;
}
