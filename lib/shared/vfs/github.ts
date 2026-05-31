/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { eq, getProjects } from "./api";
import type { VFSNode } from "./types";

function githubApiUrl(
  owner: string,
  repo: string,
  kind: "tree" | "blob",
  encodedPath: string,
  branch: string | null,
): string {
  const branchParam = branch ? `?branch=${encodeURIComponent(branch)}` : "";
  const pathSegment = encodedPath ? `/${encodedPath}` : "";
  return `/api/github/${owner}/${repo}/${kind}${pathSegment}${branchParam}`;
}

export async function githubListDir(
  slug: string,
  repoPath: string[],
): Promise<VFSNode[] | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.slug, slug));
  if (!project?.githubRepo) return null;

  const [owner, repo] = project.githubRepo.split("/");
  const encodedPath = repoPath.map(encodeURIComponent).join("/");
  const url = githubApiUrl(
    owner!,
    repo!,
    "tree",
    encodedPath,
    project.githubBranch,
  );

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const entries = (await res.json()) as Array<{
      name: string;
      type: string;
      size: number;
    }>;
    return entries.map((e) =>
      e.type === "dir"
        ? { kind: "dir" as const, name: e.name }
        : { kind: "file" as const, name: e.name, size: e.size },
    );
  } catch {
    return null;
  }
}

export async function githubReadFile(
  slug: string,
  repoPath: string[],
): Promise<string | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.slug, slug));
  if (!project?.githubRepo) return null;

  const [owner, repo] = project.githubRepo.split("/");
  const encodedPath = repoPath.map(encodeURIComponent).join("/");
  const url = githubApiUrl(
    owner!,
    repo!,
    "blob",
    encodedPath,
    project.githubBranch,
  );

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
