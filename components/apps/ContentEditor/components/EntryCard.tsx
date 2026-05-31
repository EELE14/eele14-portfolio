/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { formatDate } from "@/lib/shared/format";
import type { GuestbookEntry } from "../types";
import { btnPrimary } from "../constants";

interface EntryCardProps {
  entry: GuestbookEntry;
  onApprove?: () => void;
  onDelete: () => void;
}

export default function EntryCard({
  entry,
  onApprove,
  onDelete,
}: EntryCardProps) {
  return (
    <div
      style={{
        marginBottom: "8px",
        padding: "8px 10px",
        border: "2px solid var(--color-ink)",
        borderLeft: entry.blocked
          ? "4px solid var(--color-accent)"
          : "2px solid var(--color-ink)",
        boxShadow: "2px 2px 0 var(--color-ink)",
        background: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontFamily: "var(--font-system)", fontSize: "15px" }}>
          {entry.name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-muted)",
          }}
        >
          {formatDate(entry.createdAt)}
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          lineHeight: 1.5,
          margin: "0 0 8px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {entry.message}
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        {onApprove && (
          <button
            onClick={onApprove}
            className="btn"
            style={{ ...btnPrimary, fontSize: "12px", padding: "1px 10px" }}
          >
            Approve
          </button>
        )}
        <button
          onClick={onDelete}
          className="btn"
          style={{ ...btnPrimary, fontSize: "12px", padding: "1px 10px" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
