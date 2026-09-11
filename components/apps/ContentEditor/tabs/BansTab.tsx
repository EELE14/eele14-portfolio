/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useFetchData } from "@/lib/client/hooks/useFetchData";
import BanSection from "../components/BanSection";
import type { GuestbookBlock, IpBan } from "../types";

const BLOCKS = "/api/guestbook/blocks";
const BANS = "/api/bans";

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

function useBanList<T>(endpoint: string, field: "ip" | "network") {
  const { data, loading, reload } = useFetchData<T[]>(endpoint);

  async function add(value: string, reason: string): Promise<string | null> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value, reason }),
    });
    if (!res.ok) return errorFrom(res, "Could not save that entry.");
    reload();
    return null;
  }

  async function remove(value: string): Promise<void> {
    await fetch(`${endpoint}?${field}=${encodeURIComponent(value)}`, {
      method: "DELETE",
    });
    reload();
  }

  return { rows: data ?? [], loading, reload, add, remove };
}

export default function BansTab() {
  const bans = useBanList<IpBan>(BANS, "network");
  const blocks = useBanList<GuestbookBlock>(BLOCKS, "ip");

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
      <BanSection
        title="API bans"
        rows={bans.rows.map((ban) => ({
          value: ban.network,
          reason: ban.reason,
          createdAt: ban.createdAt,
        }))}
        loading={bans.loading}
        addLabel="Ban"
        removeLabel="Unban"
        placeholder="203.0.113.42 or 2001:db8::/48"
        hint="Blocks the browser, guestbook, contact form, AI and battleship."
        emptyMessage="No banned addresses."
        countNoun={["range", "ranges"]}
        onAdd={bans.add}
        onRemove={bans.remove}
        onRefresh={bans.reload}
      />

      <BanSection
        title="Guestbook blocks"
        rows={blocks.rows.map((block) => ({
          value: block.ip,
          reason: block.reason,
          createdAt: block.createdAt,
          note:
            block.entryCount > 0
              ? `${block.entryCount} existing ${block.entryCount === 1 ? "entry" : "entries"}`
              : undefined,
        }))}
        loading={blocks.loading}
        addLabel="Block"
        removeLabel="Unblock"
        placeholder="203.0.113.42"
        hint="Guestbook only, and applies to future submissions."
        emptyMessage="No blocked addresses."
        countNoun={["address", "addresses"]}
        onAdd={blocks.add}
        onRemove={blocks.remove}
        onRefresh={blocks.reload}
      />
    </div>
  );
}
