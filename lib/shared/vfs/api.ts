/* Copyright (c) 2026 eele14. All Rights Reserved. */

import type { FsNodeRecord, ProjectRecord, VFSNode } from "./types";

export function eq(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

let projectCache: ProjectRecord[] | null = null;

export function invalidateProjectCache() {
  projectCache = null;
}

export async function getProjects(): Promise<ProjectRecord[]> {
  if (projectCache) return projectCache;
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) return [];
    projectCache = (await res.json()) as ProjectRecord[];
    return projectCache;
  } catch {
    return [];
  }
}

export async function fetchFsNodes(
  parentId: string | null,
): Promise<FsNodeRecord[]> {
  const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
  try {
    const res = await fetch(`/api/fs${qs}`);
    if (!res.ok) return [];
    return (await res.json()) as FsNodeRecord[];
  } catch {
    return [];
  }
}

export function fsNodeToVFSNode(n: FsNodeRecord): VFSNode {
  return {
    name: n.name,
    kind: n.type === "folder" ? "dir" : "file",
    fsId: n.id,
  };
}
