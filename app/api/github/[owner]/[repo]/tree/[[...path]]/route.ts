/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { fetchTree } from "@/lib/server/github";

interface Params {
  owner: string;
  repo: string;
  path?: string[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { owner, repo, path: segments } = await params;
  const branch = req.nextUrl.searchParams.get("branch") ?? undefined;
  const filePath = segments?.join("/") ?? "";

  const result = await fetchTree(owner, repo, filePath, branch);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, githubStatus: result.status },
      {
        status: result.status === 404 ? 404 : result.status === 401 ? 401 : 502,
      },
    );
  }

  return NextResponse.json(result.entries, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
