/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect } from "react";
import StatusBar from "@/components/ui/StatusBar";
import { useDesktopStore } from "@/store/windowStore";
import { useBrowserSW } from "./hooks/useBrowserSW";
import { useTabManager } from "./hooks/useTabManager";
import SwErrorPanel from "./components/SwErrorPanel";
import TabBar from "./components/TabBar";
import Toolbar from "./components/Toolbar";
import IframeStack from "./components/IframeStack";

export interface BrowserProps {
  initialUrl?: string;
}

export default function Browser({ initialUrl }: BrowserProps) {
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);
  const { swReady, swError } = useBrowserSW();

  const {
    tabs,
    activeTabId,
    activeTab,
    canGoBack,
    canGoFwd,
    iframeRefs,
    setActiveTabId,
    setInputValue,
    navigateActive,
    goBack,
    goForward,
    goRefresh,
    goHome,
    openNewTab,
    closeTab,
    handleSubmit,
    handleIframeLoad,
  } = useTabManager(swReady, initialUrl);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== "object" || e.data === null) return;
      const { type, value } = e.data as { type?: string; value?: string };
      if (typeof value !== "string") return;
      if (type === "browser-navigate") navigateActive(value);
      if (type === "browser-open-tab") openNewTab(value);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigateActive, openNewTab]);

  const statusText = activeTab.loading
    ? swReady
      ? "Loading..."
      : "Initializing proxy service worker..."
    : (() => {
        if (!activeTab.url || activeTab.url.startsWith("/")) return "";
        try {
          return new URL(activeTab.url).hostname;
        } catch {
          return activeTab.url;
        }
      })();

  if (swError) return <SwErrorPanel message={swError} />;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, [
          { label: "Reload", onClick: goRefresh },
          {
            label: "Copy URL",
            onClick: () => void navigator.clipboard.writeText(activeTab.url),
            disabled: !activeTab.url || activeTab.url.startsWith("/"),
          },
          {
            label: "Open in browser",
            onClick: () =>
              window.open(activeTab.url, "_blank", "noopener,noreferrer"),
            disabled: !activeTab.url || activeTab.url.startsWith("/"),
          },
          { label: "", onClick: () => {}, separator: true },
          { label: "Back", onClick: goBack, disabled: !canGoBack },
          { label: "Forward", onClick: goForward, disabled: !canGoFwd },
        ]);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onClose={closeTab}
        onNewTab={openNewTab}
      />

      <Toolbar
        activeTab={activeTab}
        swReady={swReady}
        canGoBack={canGoBack}
        canGoFwd={canGoFwd}
        onBack={goBack}
        onForward={goForward}
        onRefresh={goRefresh}
        onHome={goHome}
        onAddressChange={setInputValue}
        onSubmit={handleSubmit}
      />

      <IframeStack
        tabs={tabs}
        activeTabId={activeTabId}
        swReady={swReady}
        iframeRefs={iframeRefs}
        onLoad={handleIframeLoad}
      />

      <StatusBar
        font="body"
        style={{
          height: 20,
          padding: "1px 8px 0",
          fontSize: 11,
          color: activeTab.loading
            ? "var(--color-accent)"
            : "var(--color-muted)",
          letterSpacing: "0.02em",
        }}
      >
        {statusText}
      </StatusBar>
    </div>
  );
}
