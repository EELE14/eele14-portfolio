/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useFetchData } from "@/lib/client/hooks/useFetchData";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import type { GuestbookEntry } from "../types";
import { btnPrimary } from "../constants";
import EntryCard from "../components/EntryCard";

export default function GuestbookTab() {
  const { data, loading, reload } =
    useFetchData<GuestbookEntry[]>("/api/guestbook");
  const entries = data ?? [];

  async function approve(id: string) {
    await fetch(`/api/guestbook/${id}`, { method: "PATCH" });
    reload();
  }

  async function remove(id: string) {
    await fetch(`/api/guestbook/${id}`, { method: "DELETE" });
    reload();
  }

  const blocked = entries.filter((e) => e.blocked);
  const pending = entries.filter((e) => !e.approved && !e.blocked);
  const approved = entries.filter((e) => e.approved);

  const sectionLabel = (label: string, top = false) => (
    <div
      style={{
        fontFamily: "var(--font-system)",
        fontSize: "14px",
        color: "var(--color-muted)",
        margin: top ? "0 0 6px" : "12px 0 6px",
      }}
    >
      {label}
    </div>
  );

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
          {blocked.length > 0 && `${blocked.length} blocked · `}
          {pending.length} pending · {approved.length} approved
        </span>
        <button
          onClick={reload}
          className="btn"
          style={{ ...btnPrimary, fontSize: "13px", padding: "2px 10px" }}
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingState message="Loading…" />}

      {!loading && entries.length === 0 && (
        <EmptyState message="No entries yet." font="body" />
      )}

      {blocked.length > 0 && (
        <>
          {sectionLabel("Blocked — pending review", true)}
          {blocked.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onApprove={() => void approve(e.id)}
              onDelete={() => void remove(e.id)}
            />
          ))}
        </>
      )}

      {pending.length > 0 && (
        <>
          {sectionLabel("Pending approval", blocked.length === 0)}
          {pending.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onApprove={() => void approve(e.id)}
              onDelete={() => void remove(e.id)}
            />
          ))}
        </>
      )}

      {approved.length > 0 && (
        <>
          {sectionLabel("Approved")}
          {approved.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onDelete={() => void remove(e.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
