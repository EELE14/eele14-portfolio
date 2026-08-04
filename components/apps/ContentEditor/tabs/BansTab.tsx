/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useState } from "react";
import { useFetchData } from "@/lib/client/hooks/useFetchData";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBanner from "@/components/ui/StatusBanner";
import SensitiveValue from "@/components/ui/SensitiveValue";
import { formatDate } from "@/lib/shared/format";
import type { GuestbookBlock } from "../types";
import { btnPrimary, btnSecondary, fieldStyle, labelStyle } from "../constants";

const ENDPOINT = "/api/guestbook/blocks";

export default function BansTab() {
  const { data, loading, reload } = useFetchData<GuestbookBlock[]>(ENDPOINT);
  const blocks = data ?? [];

  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function block() {
    setError(null);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Could not block that address.");
      return;
    }
    setIp("");
    setReason("");
    reload();
  }

  async function unblock(target: string) {
    setError(null);
    await fetch(`${ENDPOINT}?ip=${encodeURIComponent(target)}`, {
      method: "DELETE",
    });
    reload();
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontFamily: "var(--font-system)", fontSize: "16px" }}>
          {blocks.length} blocked {blocks.length === 1 ? "address" : "addresses"}
        </span>
        <button
          onClick={reload}
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
        <label style={labelStyle} htmlFor="ban-ip">
          Block an address
        </label>
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
          <input
            id="ban-ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="203.0.113.42"
            style={{ ...fieldStyle, flex: "0 0 190px" }}
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="reason (optional)"
            style={fieldStyle}
          />
          <button
            onClick={() => void block()}
            className="btn"
            disabled={!ip.trim()}
            style={{
              ...btnPrimary,
              fontSize: "13px",
              padding: "3px 12px",
              flexShrink: 0,
              opacity: ip.trim() ? 1 : 0.5,
            }}
          >
            Block
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
          Applies to future guestbook submissions only. Existing entries stay
          untouched, and a blocked visitor is never told they are blocked.
        </p>
      </div>

      {loading && <LoadingState message="Loading…" />}

      {!loading && blocks.length === 0 && (
        <EmptyState message="No blocked addresses." font="body" />
      )}

      {blocks.map((entry) => (
        <div
          key={entry.ip}
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
            <SensitiveValue value={entry.ip} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--color-muted)",
                flexShrink: 0,
              }}
            >
              {formatDate(entry.createdAt)}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            {entry.reason}
            {entry.entryCount > 0 && (
              <span style={{ color: "var(--color-muted)" }}>
                {" "}
                · {entry.entryCount} existing{" "}
                {entry.entryCount === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          <button
            onClick={() => void unblock(entry.ip)}
            className="btn"
            style={{ ...btnSecondary, fontSize: "12px", padding: "1px 10px" }}
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
}
