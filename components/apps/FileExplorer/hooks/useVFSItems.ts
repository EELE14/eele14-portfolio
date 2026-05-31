/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useEffect, useState } from "react";
import { listDir, type VFSNode } from "@/lib/shared/vfs";

export function useVFSItems(path: string[], isAdmin: boolean) {
  const [items, setItems] = useState<VFSNode[]>([]);
  const pathKey = JSON.stringify(path);

  const load = useCallback(() => {
    listDir(path, isAdmin).then((r) => setItems(r ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, refresh: load };
}
