/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
import { FolderSm, FileSm, LinkSm } from "@/components/icons/FileIcons";
import type { VFSNode } from "@/lib/shared/vfs";

export default function ItemIcon({ item }: { item: VFSNode }) {
  if (item.iconUrl) {
    return (
      <img
        src={item.iconUrl}
        alt={item.name}
        width={22}
        height={22}
        style={{ display: "block", objectFit: "contain" }}
      />
    );
  }
  if (item.kind === "dir") return <FolderSm />;
  if (item.kind === "link") return <LinkSm />;
  if (item.kind === "image")
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      >
        <rect x="2" y="4" width="18" height="14" rx="1" />
        <circle cx="7.5" cy="8.5" r="1.5" />
        <polyline points="2,15 7,10 11,14 14,11 20,16" />
      </svg>
    );
  return <FileSm />;
}
