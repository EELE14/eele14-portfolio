/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useMemo, useState } from "react";

interface NavigationResult {
  currentPath: string[];
  canBack: boolean;
  canFwd: boolean;
  push: (newPath: string[]) => void;
  goBack: () => void;
  goForward: () => void;
  goUp: () => void;
}

export function useNavigation(
  initialPath: string[],
  onNavigate?: () => void,
): NavigationResult {
  const [navHistory, setNavHistory] = useState<string[][]>([initialPath]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const currentPath = useMemo(
    () => navHistory[historyIdx] ?? [],
    [navHistory, historyIdx],
  );
  const canBack = historyIdx > 0;
  const canFwd = historyIdx < navHistory.length - 1;

  const push = useCallback(
    (newPath: string[]) => {
      setNavHistory((prev) => [...prev.slice(0, historyIdx + 1), newPath]);
      setHistoryIdx(historyIdx + 1);
      onNavigate?.();
    },
    [historyIdx, onNavigate],
  );

  const goBack = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx((i) => i - 1);
      onNavigate?.();
    }
  }, [historyIdx, onNavigate]);

  const goForward = useCallback(() => {
    if (historyIdx < navHistory.length - 1) {
      setHistoryIdx((i) => i + 1);
      onNavigate?.();
    }
  }, [historyIdx, navHistory.length, onNavigate]);

  const goUp = useCallback(() => {
    if (currentPath.length > 0) push(currentPath.slice(0, -1));
  }, [currentPath, push]);

  return { currentPath, canBack, canFwd, push, goBack, goForward, goUp };
}
