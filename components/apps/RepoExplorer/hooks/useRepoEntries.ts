/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useState } from "react";
import type { GitHubEntry } from "@/lib/server/github";

interface FetchResult {
  entries: GitHubEntry[];
  error: string | null;
  resolvedKey: string;
}

interface RepoEntriesResult {
  entries: GitHubEntry[];
  loading: boolean;
  error: string | null;
}

export function useRepoEntries(
  owner: string,
  repo: string,
  branch: string | undefined,
  currentPath: string,
): RepoEntriesResult {
  const requestKey = `${owner}/${repo}/${branch ?? ""}/${currentPath}`;

  const [result, setResult] = useState<FetchResult>({
    entries: [],
    error: null,
    resolvedKey: "",
  });

  const loading = result.resolvedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    const segments = currentPath
      ? currentPath.split("/").map(encodeURIComponent).join("/")
      : "";
    const branchParam = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    const url = `/api/github/${owner}/${repo}/tree${segments ? `/${segments}` : ""}${branchParam}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as {
            error?: string;
            githubStatus?: number;
          };
          const ghStatus = body.githubStatus ?? r.status;
          const hint =
            ghStatus === 404
              ? "Repo not found or private."
              : ghStatus === 401
                ? "GitHub token is invalid or missing required permissions."
                : (body.error ?? `HTTP ${r.status}`);
          throw new Error(hint);
        }
        return r.json() as Promise<GitHubEntry[]>;
      })
      .then((data) => {
        data.sort((a, b) => {
          if (a.type === "dir" && b.type !== "dir") return -1;
          if (a.type !== "dir" && b.type === "dir") return 1;
          return a.name.localeCompare(b.name);
        });
        if (!cancelled)
          setResult({ entries: data, error: null, resolvedKey: requestKey });
      })
      .catch((e: Error) => {
        if (!cancelled)
          setResult({ entries: [], error: e.message, resolvedKey: requestKey });
      });

    return () => {
      cancelled = true;
    };
  }, [owner, repo, branch, currentPath, requestKey]);

  return {
    entries: loading ? [] : result.entries,
    loading,
    error: loading ? null : result.error,
  };
}
