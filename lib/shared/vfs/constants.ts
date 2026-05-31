/* Copyright (c) 2026 eele14. All Rights Reserved. */

export const VFS_ROOTS = {
  Desktop: { writable: true, adminOnly: false },
  Projects: { writable: true, adminOnly: false },
  About: { writable: true, adminOnly: false },
  Skills: { writable: false, adminOnly: false },
  Guestbook: { writable: true, adminOnly: false },
  "Recycle Bin": { writable: true, adminOnly: false },
  Admin: { writable: true, adminOnly: true },
} as const;

export type VFSRootName = keyof typeof VFS_ROOTS;

export const VFS_ROOT_NAMES: ReadonlySet<string> = new Set(
  Object.keys(VFS_ROOTS).map((k) => k.toLowerCase()),
);

const _rootLowerMap = new Map<string, VFSRootName>(
  (Object.keys(VFS_ROOTS) as VFSRootName[]).map((k) => [k.toLowerCase(), k]),
);

export function canonicalRootName(name: string): VFSRootName | undefined {
  return _rootLowerMap.get(name.toLowerCase());
}
