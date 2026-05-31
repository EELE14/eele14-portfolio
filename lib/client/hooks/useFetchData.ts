/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useEffect, useState } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Settled<T> {
  url: string;
  tick: number;
  data: T | null;
  error: string | null;
}

export function useFetchData<T>(url: string): FetchState<T> {
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  const isCurrent = settled?.url === url && settled?.tick === tick;
  const loading = !isCurrent;
  const data = isCurrent ? settled.data : null;
  const error = isCurrent ? settled.error : null;

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((d) => {
        if (!cancelled) setSettled({ url, tick, data: d, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setSettled({
            url,
            tick,
            data: null,
            error: e instanceof Error ? e.message : "Request failed",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  return { data, loading, error, reload };
}
