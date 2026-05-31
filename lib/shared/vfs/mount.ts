/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { canonicalRootName } from "./constants";
import { eq, fetchFsNodes } from "./api";
import type { FsNodeRecord } from "./types";

export async function resolveSegments(
  segments: string[],
  parentId: string | null,
): Promise<string | null | undefined> {
  let current: string | null = parentId;
  for (const seg of segments) {
    const nodes = await fetchFsNodes(current);
    const match = nodes.find((n) => eq(n.name, seg) && n.type === "folder");
    if (!match) return undefined;
    current = match.id;
  }
  return current;
}

export async function findMountPoint(
  rootName: string,
): Promise<FsNodeRecord | null> {
  const roots = await fetchFsNodes(null);
  return roots.find((n) => eq(n.name, rootName) && n.type === "folder") ?? null;
}

export async function upsertMountPoint(
  rootName: string,
): Promise<string | null> {
  const existing = await findMountPoint(rootName);
  if (existing) return existing.id;
  try {
    const res = await fetch("/api/fs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: rootName,
        type: "folder",
        parentId: null,
        isPublic: true,
      }),
    });
    if (res.status === 409) {
      const retry = await findMountPoint(rootName);
      return retry?.id ?? null;
    }
    if (!res.ok) return null;
    const node = (await res.json()) as FsNodeRecord;
    return node.id;
  } catch {
    return null;
  }
}

export async function resolveParentForWrite(
  path: string[],
): Promise<string | null | undefined> {
  if (path.length === 0) return null;

  const root = canonicalRootName(path[0]);

  if (root === "Skills") return undefined; // read-only

  if (root !== undefined) {
    const mountId = await upsertMountPoint(root);
    if (mountId === null) return undefined;
    if (path.length === 1) return mountId;
    return resolveSegments(path.slice(1), mountId);
  }

  return resolveSegments(path, null);
}

export async function resolveParentForRead(
  parentPath: string[],
): Promise<string | null | undefined> {
  if (parentPath.length === 0) return null;

  const root = canonicalRootName(parentPath[0]);
  if (root !== undefined) {
    const mount = await findMountPoint(root);
    if (!mount) return undefined;
    if (parentPath.length === 1) return mount.id;
    return resolveSegments(parentPath.slice(1), mount.id);
  }

  return resolveSegments(parentPath, null);
}
