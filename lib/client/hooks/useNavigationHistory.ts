/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useState } from "react";

interface NavigationHistory<T> {
  current: T;
  push: (next: T) => void;
  goBack: () => void;
  goForward: () => void;
  canBack: boolean;
  canForward: boolean;
}

interface State<T> {
  history: T[];
  idx: number;
}

export function useNavigationHistory<T>(initial: T): NavigationHistory<T> {
  const [state, setState] = useState<State<T>>({ history: [initial], idx: 0 });

  const push = useCallback((next: T) => {
    setState(({ history, idx }) => ({
      history: [...history.slice(0, idx + 1), next],
      idx: idx + 1,
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((s) => ({ ...s, idx: Math.max(0, s.idx - 1) }));
  }, []);

  const goForward = useCallback(() => {
    setState((s) => ({ ...s, idx: Math.min(s.history.length - 1, s.idx + 1) }));
  }, []);

  return {
    current: state.history[state.idx] as T,
    push,
    goBack,
    goForward,
    canBack: state.idx > 0,
    canForward: state.idx < state.history.length - 1,
  };
}
