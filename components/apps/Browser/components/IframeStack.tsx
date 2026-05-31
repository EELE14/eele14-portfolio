/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Tab } from "../types";

interface TabFrameProps {
  tab: Tab;
  isActive: boolean;
  swReady: boolean;
  iframeRefs: MutableRefObject<Map<string, HTMLIFrameElement | null>>;
  onLoad: (tabId: string) => void;
}

function TabFrame({
  tab,
  isActive,
  swReady,
  iframeRefs,
  onLoad,
}: TabFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const refs = iframeRefs.current;
    refs.set(tab.id, iframeRef.current);
    return () => {
      refs.delete(tab.id);
    };
  }, [tab.id, iframeRefs]);

  useEffect(() => {
    if (iframeRef.current && tab.src) {
      iframeRef.current.src = tab.src;
    }
  }, [tab.src]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        visibility: isActive ? "visible" : "hidden",
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      {tab.loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-window)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            fontFamily: "var(--font-system)",
            fontSize: 28,
            color: "var(--color-accent)",
            letterSpacing: "0.15em",
          }}
        >
          {swReady ? "LOADING..." : "STARTING PROXY..."}
        </div>
      )}

      <iframe
        ref={iframeRef}
        title={`Tab ${tab.id}`}
        allow="accelerometer *; autoplay *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *; gyroscope *; magnetometer *; microphone *; payment *; picture-in-picture *; screen-wake-lock *; web-share *; xr-spatial-tracking *"
        allowFullScreen
        onLoad={() => onLoad(tab.id)}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          flex: 1,
        }}
      />
    </div>
  );
}

interface IframeStackProps {
  tabs: Tab[];
  activeTabId: string;
  swReady: boolean;
  iframeRefs: MutableRefObject<Map<string, HTMLIFrameElement | null>>;
  onLoad: (tabId: string) => void;
}

export default function IframeStack({
  tabs,
  activeTabId,
  swReady,
  iframeRefs,
  onLoad,
}: IframeStackProps) {
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {tabs.map((tab) => (
        <TabFrame
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          swReady={swReady}
          iframeRefs={iframeRefs}
          onLoad={onLoad}
        />
      ))}
    </div>
  );
}
