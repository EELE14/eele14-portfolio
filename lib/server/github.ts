/* Copyright (c) 2026 eele14. All Rights Reserved. */

const GITHUB_API = "https://api.github.com";

export function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-app",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type FetchTreeResult =
  | { ok: true; entries: GitHubEntry[] }
  | { ok: false; status: number; message: string };

export async function fetchTree(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<FetchTreeResult> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const apiPath = path ? `/${encodePathSegments(path)}` : "";
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents${apiPath}${ref}`;

  const res = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, status: res.status, message: body };
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    return {
      ok: false,
      status: 400,
      message: "Path points to a file, not a directory",
    };
  }

  return { ok: true, entries: (data as RawGitHubEntry[]).map(normalizeEntry) };
}

export async function fetchBlob(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<Response | null> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodePathSegments(path)}${ref}`;

  const res = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as RawGitHubBlob;

  if (data.encoding === "base64" && data.content) {
    const bytes = Buffer.from(data.content.replace(/\n/g, ""), "base64");
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=300",
        "X-File-Size": String(data.size),
      },
    });
  }

  if (data.download_url) {
    const raw = await fetch(data.download_url, { headers: githubHeaders() });
    if (!raw.ok || !raw.body) return null;
    return new Response(raw.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=300",
        "X-File-Size": String(data.size),
      },
    });
  }

  return null;
}

export interface GitHubEntry {
  name: string;
  type: "file" | "dir" | "symlink" | "submodule";
  path: string;
  size: number;
  download_url: string | null;
}

interface RawGitHubEntry {
  name: string;
  type: string;
  path: string;
  size: number;
  download_url: string | null;
}

interface RawGitHubBlob {
  encoding: string;
  content: string;
  size: number;
  download_url: string | null;
}

function encodePathSegments(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function normalizeEntry(e: RawGitHubEntry): GitHubEntry {
  return {
    name: e.name,
    type: (["file", "dir", "symlink", "submodule"] as const).includes(
      e.type as "file",
    )
      ? (e.type as GitHubEntry["type"])
      : "file",
    path: e.path,
    size: e.size,
    download_url: e.download_url,
  };
}
