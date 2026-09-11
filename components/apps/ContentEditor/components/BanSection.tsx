/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBanner from "@/components/ui/StatusBanner";
import SensitiveValue from "@/components/ui/SensitiveValue";
import { formatDate } from "@/lib/shared/format";
import { btnPrimary, btnSecondary, fieldStyle, labelStyle } from "../constants";

export interface BanRow {
  value: string;
  reason: string;
  createdAt: string;
  note?: string;
}

interface BanSectionProps {
  title: string;
  rows: BanRow[];
  loading: boolean;
  addLabel: string;
  removeLabel: string;
  placeholder: string;
  hint: string;
  emptyMessage: string;
  countNoun: [singular: string, plural: string];
  onAdd: (value: string, reason: string) => Promise<string | null>;
  onRemove: (value: string) => Promise<void>;
  onRefresh: () => void;
}

export default function BanSection({
  title,
  rows,
  loading,
  addLabel,
  removeLabel,
  placeholder,
  hint,
  emptyMessage,
  countNoun,
  onAdd,
  onRemove,
  onRefresh,
}: BanSectionProps) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const message = await onAdd(value.trim(), reason.trim());
    setBusy(false);
    setError(message);
    if (message) return;
    setValue("");
    setReason("");
  }

  return (
    <section style={{ marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontFamily: "var(--font-system)", fontSize: "16px" }}>
          {title} — {rows.length}{" "}
          {rows.length === 1 ? countNoun[0] : countNoun[1]}
        </span>
        <button
          onClick={onRefresh}
          className="btn"
          style={{ ...btnPrimary, fontSize: "13px", padding: "2px 10px" }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <StatusBanner
          variant="error"
          message={error}
          style={{ marginBottom: "10px" }}
        />
      )}

      <div
        style={{
          border: "2px solid var(--color-ink)",
          boxShadow: "2px 2px 0 var(--color-ink)",
          background: "white",
          padding: "8px 10px",
          marginBottom: "12px",
        }}
      >
        <label style={labelStyle} htmlFor={`ban-input-${title}`}>
          {addLabel}
        </label>
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
          <input
            id={`ban-input-${title}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            style={{ ...fieldStyle, flex: "0 0 220px" }}
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="reason (optional)"
            style={fieldStyle}
          />
          <button
            onClick={() => void submit()}
            className="btn"
            disabled={!value.trim() || busy}
            style={{
              ...btnPrimary,
              fontSize: "13px",
              padding: "3px 12px",
              flexShrink: 0,
              opacity: value.trim() && !busy ? 1 : 0.5,
            }}
          >
            {addLabel}
          </button>
        </div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-muted)",
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      </div>

      {loading && <LoadingState message="Loading…" />}

      {!loading && rows.length === 0 && (
        <EmptyState message={emptyMessage} font="body" />
      )}

      {rows.map((row) => (
        <div
          key={row.value}
          style={{
            marginBottom: "8px",
            padding: "8px 10px",
            border: "2px solid var(--color-ink)",
            borderLeft: "4px solid var(--color-accent)",
            boxShadow: "2px 2px 0 var(--color-ink)",
            background: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <SensitiveValue value={row.value} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--color-muted)",
                flexShrink: 0,
              }}
            >
              {formatDate(row.createdAt)}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            {row.reason}
            {row.note && (
              <span style={{ color: "var(--color-muted)" }}> · {row.note}</span>
            )}
          </div>
          <button
            onClick={() => void onRemove(row.value)}
            className="btn"
            style={{ ...btnSecondary, fontSize: "12px", padding: "1px 10px" }}
          >
            {removeLabel}
          </button>
        </div>
      ))}
    </section>
  );
}
