/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { VFS_ROOTS, VFS_ROOT_NAMES, canonicalRootName } from "./constants";
import { eq, fetchFsNodes, fsNodeToVFSNode } from "./api";
import { findMountPoint, resolveSegments, resolveParentForRead } from "./mount";
import { githubListDir, githubReadFile } from "./github";
import {
  listVirtualRootTop,
  listProjectSubdir,
  listProjectStackDir,
  listProjectImagesDir,
  readProjectFile,
  sanitizeName,
  guestbookFilenames,
} from "./roots";
import type { MessageRecord, VFSNode } from "./types";
import type { VFSRootName } from "./constants";

export type { VFSNodeKind, VFSNode } from "./types";
export { invalidateProjectCache } from "./api";
export { resolveParentForWrite } from "./mount";
export { resolvePath, formatPath, formatSize, tokenise } from "./path";

export async function listDir(
  path: string[],
  isAdmin: boolean,
): Promise<VFSNode[] | null> {
  if (path.length === 0) {
    const items: VFSNode[] = (
      Object.entries(VFS_ROOTS) as [
        VFSRootName,
        (typeof VFS_ROOTS)[VFSRootName],
      ][]
    )
      .filter(([, cfg]) => !cfg.adminOnly || isAdmin)
      .map(([name]) => ({ kind: "dir" as const, name }));

    const realRoots = await fetchFsNodes(null);
    for (const n of realRoots) {
      if (!VFS_ROOT_NAMES.has(n.name.toLowerCase())) {
        items.push(fsNodeToVFSNode(n));
      }
    }
    return items;
  }

  const [top, ...rest] = path;
  const root = canonicalRootName(top);

  if (root === "Admin") {
    if (!isAdmin) return null;

    if (rest.length === 0) {
      const items: VFSNode[] = [{ kind: "dir" as const, name: "Messages" }];
      const mount = await findMountPoint("Admin");
      if (mount) {
        const children = await fetchFsNodes(mount.id);
        for (const n of children) {
          if (!eq(n.name, "Messages")) items.push(fsNodeToVFSNode(n));
        }
      }
      return items;
    }

    const [sub, ...deeper] = rest;

    if (eq(sub, "Messages")) {
      if (deeper.length > 0) return null;
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return [];
        const msgs = (await res.json()) as MessageRecord[];
        return msgs.map((m) => ({
          kind: "file" as const,
          name: `${sanitizeName(m.fromName, 20, "Unknown")}-${m.id.slice(-6)}.txt`,
          fsId: m.id,
        }));
      } catch {
        return [];
      }
    }

    const mount = await findMountPoint("Admin");
    if (!mount) return null;
    const parentId = await resolveSegments(rest, mount.id);
    if (parentId === undefined) return null;
    return (await fetchFsNodes(parentId)).map(fsNodeToVFSNode);
  }

  if (root !== undefined) {
    if (rest.length === 0) {
      const virtualItems = await listVirtualRootTop(root);
      if (virtualItems === null) return null;

      if (VFS_ROOTS[root].writable) {
        const mount = await findMountPoint(root);
        if (mount) {
          const children = await fetchFsNodes(mount.id);
          const virtualNames = new Set(
            virtualItems.map((i) => i.name.toLowerCase()),
          );
          for (const n of children) {
            if (!virtualNames.has(n.name.toLowerCase())) {
              virtualItems.push(fsNodeToVFSNode(n));
            }
          }
        }
      }

      return virtualItems;
    }

    const mount = await findMountPoint(root);
    if (mount) {
      const parentId = await resolveSegments(rest, mount.id);
      if (parentId !== undefined) {
        return (await fetchFsNodes(parentId)).map(fsNodeToVFSNode);
      }
    }

    const [sub, ...deeper] = rest;

    if (root === "Desktop") return githubListDir(sub, deeper);
    if (root === "Projects" && deeper.length === 0)
      return listProjectSubdir(sub);
    if (root === "Projects" && deeper.length === 1 && eq(deeper[0], "Stack"))
      return listProjectStackDir(sub);
    if (root === "Projects" && deeper.length === 1 && eq(deeper[0], "Images"))
      return listProjectImagesDir(sub);

    return null;
  }

  const parentId = await resolveSegments(path, null);
  if (parentId === undefined) return null;
  return (await fetchFsNodes(parentId)).map(fsNodeToVFSNode);
}

export async function readFile(
  path: string[],
  isAdmin: boolean,
): Promise<string | null> {
  if (path.length < 1) return null;
  const [top, ...rest] = path;
  const root = canonicalRootName(top);

  if (root === "Admin") {
    if (!isAdmin) return null;
    if (rest.length === 2 && eq(rest[0], "Messages")) {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return null;
        const msgs = (await res.json()) as MessageRecord[];
        const msg = msgs.find((m) =>
          eq(
            `${sanitizeName(m.fromName, 20, "Unknown")}-${m.id.slice(-6)}.txt`,
            rest[1],
          ),
        );
        if (!msg) return null;
        const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return `From:    ${msg.fromName}\nSubject: ${msg.subject}\nDate:    ${date}\nRead:    ${msg.read ? "Yes" : "No"}\n\n${msg.message}`;
      } catch {
        return null;
      }
    }
  }

  if (root === "About" && rest.length === 1 && eq(rest[0], "about.txt")) {
    try {
      const res = await fetch("/api/bio");
      const data = (await res.json()) as { bio?: string };
      return (
        data.bio?.trim() ||
        "(Bio not set — add via Content Editor in admin mode)"
      );
    } catch {
      return null;
    }
  }

  if (root === "Skills" && rest.length === 1) {
    try {
      const res = await fetch("/api/skills");
      const skills = (await res.json()) as Array<{ name: string }>;
      const skill = skills.find((s) => eq(s.name, rest[0]));
      if (!skill) return null;
      return skill.name;
    } catch {
      return null;
    }
  }

  if (root === "Projects" && rest.length === 2) {
    return readProjectFile(rest[0], rest[1]);
  }

  if (root === "Guestbook" && rest.length === 1) {
    try {
      const res = await fetch("/api/guestbook");
      if (!res.ok) return null;
      const entries = (await res.json()) as Array<{
        id: string;
        name: string;
        message: string;
        createdAt: string;
      }>;
      const names = guestbookFilenames(entries);
      const idx = names.findIndex((n) => eq(n, rest[0]));
      if (idx === -1) return null;
      const entry = entries[idx];
      const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return `From: ${entry.name}\nDate: ${date}\n\n${entry.message}`;
    } catch {
      return null;
    }
  }

  if (root === "Desktop" && rest.length >= 2) {
    return githubReadFile(rest[0], rest.slice(1));
  }

  const parentPath = path.slice(0, -1);
  const filename = path[path.length - 1];
  const parentId = await resolveParentForRead(parentPath);
  if (parentId === undefined) return null;
  const nodes = await fetchFsNodes(parentId);
  const node = nodes.find((n) => eq(n.name, filename) && n.type === "file");
  if (!node) return null;
  if (!isAdmin && !node.isPublic) return null;
  return node.content ?? "(empty file)";
}
