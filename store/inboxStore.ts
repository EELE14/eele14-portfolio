/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { create } from "zustand";

interface InboxStore {
  unread: number;
  setUnread: (count: number) => void;
  refreshUnread: () => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
  unread: 0,
  setUnread: (unread) => set({ unread }),
  refreshUnread: () => {
    fetch("/api/messages/unread")
      .then((r) => r.json())
      .then((d: { count?: number }) => set({ unread: d.count ?? 0 }))
      .catch(() => {});
  },
}));
