/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Tab,
  type TabHistory,
  MAX_TABS,
  NEWTAB,
  HOMEPAGE,
  makeTab,
} from "../types";
import { encodeForUv, decodeFromUv } from "../lib/uv";

export interface TabManagerResult {
  tabs: Tab[];
  activeTabId: string;
  activeTab: Tab;
  canGoBack: boolean;
  canGoFwd: boolean;
  iframeRefs: React.MutableRefObject<Map<string, HTMLIFrameElement | null>>;
  setActiveTabId: (id: string) => void;
  setInputValue: (val: string) => void;
  navigateTab: (tabId: string, rawUrl: string, pushHist?: boolean) => void;
  navigateActive: (rawUrl: string, pushHist?: boolean) => void;
  goBack: () => void;
  goForward: () => void;
  goRefresh: () => void;
  goHome: () => void;
  openNewTab: (url?: string) => void;
  closeTab: (tabId: string) => void;
  handleSubmit: () => void;
  handleIframeLoad: (tabId: string) => void;
}

export function useTabManager(
  swReady: boolean,
  initialUrl?: string,
): TabManagerResult {
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoFwd, setCanGoFwd] = useState(false);

  const tabHistories = useRef<Map<string, TabHistory>>(new Map());
  const iframeRefs = useRef<Map<string, HTMLIFrameElement | null>>(new Map());

  // Stable refs to avoid stale closures
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const getHistory = useCallback((tabId: string): TabHistory => {
    if (!tabHistories.current.has(tabId)) {
      tabHistories.current.set(tabId, { urls: [], idx: -1 });
    }
    return tabHistories.current.get(tabId)!;
  }, []);

  const updateTab = useCallback((tabId: string, patch: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
    );
  }, []);

  const syncNavState = useCallback((tabId: string) => {
    const hist = tabHistories.current.get(tabId);
    setCanGoBack(hist ? hist.idx > 0 : false);
    setCanGoFwd(hist ? hist.idx < hist.urls.length - 1 : false);
  }, []);

  const navigateTab = useCallback(
    (tabId: string, rawUrl: string, pushHist = true) => {
      const isInternal = rawUrl.startsWith("/");
      const src = isInternal ? rawUrl : encodeForUv(rawUrl);
      updateTab(tabId, { url: rawUrl, src, inputValue: rawUrl, loading: true });
      if (pushHist) {
        const hist = getHistory(tabId);
        hist.urls = [...hist.urls.slice(0, hist.idx + 1), rawUrl];
        hist.idx = hist.urls.length - 1;
      }
      syncNavState(tabId);
    },
    [updateTab, getHistory, syncNavState],
  );

  const goBack = useCallback(() => {
    const hist = getHistory(activeTabIdRef.current);
    if (hist.idx <= 0) return;
    hist.idx -= 1;
    navigateTab(activeTabIdRef.current, hist.urls[hist.idx], false);
  }, [getHistory, navigateTab]);

  const goForward = useCallback(() => {
    const hist = getHistory(activeTabIdRef.current);
    if (hist.idx >= hist.urls.length - 1) return;
    hist.idx += 1;
    navigateTab(activeTabIdRef.current, hist.urls[hist.idx], false);
  }, [getHistory, navigateTab]);

  const goRefresh = useCallback(() => {
    updateTab(activeTabIdRef.current, { loading: true });
    const iframe = iframeRefs.current.get(activeTabIdRef.current) ?? null;
    iframe?.contentWindow?.location.reload();
  }, [updateTab]);

  const goHome = useCallback(() => {
    navigateTab(activeTabIdRef.current, HOMEPAGE);
  }, [navigateTab]);

  const navigateActive = useCallback(
    (rawUrl: string, pushHist = true) => {
      navigateTab(activeTabIdRef.current, rawUrl, pushHist);
    },
    [navigateTab],
  );

  const openNewTab = useCallback((url?: string) => {
    const target = typeof url === "string" ? url : NEWTAB;
    if (tabsRef.current.length >= MAX_TABS) return;
    const isInternal = target.startsWith("/");
    const src = isInternal ? target : encodeForUv(target);
    const tab = { ...makeTab(target), src };
    tabHistories.current.set(tab.id, { urls: [target], idx: 0 });
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      if (prev.length === 1) {
        const tab = prev[0];
        tabHistories.current.set(tab.id, { urls: [NEWTAB], idx: 0 });
        return [
          {
            ...tab,
            url: NEWTAB,
            src: NEWTAB,
            inputValue: NEWTAB,
            title: "New Tab",
            loading: tab.src !== NEWTAB,
          },
        ];
      }
      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);
      tabHistories.current.delete(tabId);
      const iframe = iframeRefs.current.get(tabId) ?? null;
      iframeRefs.current.delete(tabId);
      if (iframe) {
        try {
          iframe.contentWindow?.stop();
        } catch {
          /* cross-origin */
        }
        iframe.src = "about:blank";
      }
      if (tabId === activeTabIdRef.current) {
        setActiveTabId(next[Math.min(idx, next.length - 1)].id);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const activeTab = tabsRef.current.find(
      (t) => t.id === activeTabIdRef.current,
    );
    if (activeTab?.inputValue.trim()) {
      navigateTab(activeTabIdRef.current, activeTab.inputValue.trim());
    }
  }, [navigateTab]);

  const handleIframeLoad = useCallback(
    (tabId: string) => {
      const iframe = iframeRefs.current.get(tabId) ?? null;
      updateTab(tabId, { loading: false });
      try {
        const href = iframe?.contentWindow?.location.href ?? "";
        if (href && href !== "about:blank") {
          const decoded = decodeFromUv(href);
          if (decoded) updateTab(tabId, { url: decoded, inputValue: decoded });
          try {
            const title = iframe?.contentDocument?.title;
            if (title)
              updateTab(tabId, { title: title.slice(0, 30) || "New Tab" });
          } catch {
            /* cross-origin */
          }
        }
      } catch {
        /* cross-origin guard */
      }
    },
    [updateTab],
  );

  const setInputValue = useCallback((val: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabIdRef.current ? { ...t, inputValue: val } : t,
      ),
    );
  }, []);

  useEffect(() => {
    if (!swReady) return;
    const firstTab = tabsRef.current[0];
    if (firstTab) navigateTab(firstTab.id, initialUrl ?? NEWTAB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swReady]);

  useEffect(() => {
    const refs = iframeRefs.current;
    return () => {
      refs.forEach((iframe) => {
        if (!iframe) return;
        try {
          iframe.contentWindow?.stop();
        } catch {
          /* cross-origin guard */
        }
        iframe.src = "about:blank";
      });
    };
  }, []);

  useEffect(() => {
    syncNavState(activeTabId);
  }, [activeTabId, syncNavState]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return {
    tabs,
    activeTabId,
    activeTab,
    canGoBack,
    canGoFwd,
    iframeRefs,
    setActiveTabId,
    setInputValue,
    navigateTab,
    navigateActive,
    goBack,
    goForward,
    goRefresh,
    goHome,
    openNewTab,
    closeTab,
    handleSubmit,
    handleIframeLoad,
  };
}
