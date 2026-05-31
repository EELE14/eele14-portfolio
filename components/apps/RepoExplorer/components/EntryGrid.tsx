/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { GitHubEntry } from "@/lib/server/github";
import { FolderSm, FileSm, BinarySm } from "@/components/icons/FileIcons";
import { formatFileSize } from "@/lib/shared/format";
import EmptyState from "@/components/ui/EmptyState";
import { isBinary } from "../lib/binary";

interface EntryGridProps {
  entries: GitHubEntry[];
  onItemClick: (entry: GitHubEntry) => void;
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
  width: "80px",
  padding: "6px 4px",
  background: "none",
  border: "1px solid transparent",
  cursor: "default",
  textAlign: "center",
};

export default function EntryGrid({ entries, onItemClick }: EntryGridProps) {
  if (entries.length === 0) {
    return <EmptyState message="This folder is empty." />;
  }

  return (
    <div
      role="list"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        alignContent: "flex-start",
      }}
    >
      {entries.map((entry) => (
        <button
          key={entry.path}
          role="listitem"
          onClick={() => onItemClick(entry)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onItemClick(entry);
          }}
          aria-label={`${entry.name} (${entry.type})`}
          title={entry.type === "file" ? formatFileSize(entry.size) : undefined}
          style={itemStyle}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px dashed var(--color-accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid transparent";
          }}
        >
          {entry.type === "dir" ? (
            <FolderSm />
          ) : isBinary(entry.name) ? (
            <BinarySm />
          ) : (
            <FileSm />
          )}
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "13px",
              wordBreak: "break-word",
              lineHeight: 1.2,
              color: "var(--color-ink)",
            }}
          >
            {entry.name}
          </span>
        </button>
      ))}
    </div>
  );
}
