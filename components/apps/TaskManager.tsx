/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import type { ServerMetrics } from "@/lib/server/metrics";

const HISTORY_LEN = 60;

function formatBytes(b: number): string {
  if (b >= 1073741824) return (b / 1073741824).toFixed(1) + " GB";
  if (b >= 1048576) return Math.round(b / 1048576) + " MB";
  return Math.round(b / 1024) + " KB";
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 220;
  const h = 60;
  const barW = Math.max(1, w / HISTORY_LEN - 0.5);
  return (
    <svg
      width={w}
      height={h}
      style={{
        display: "block",
        background: "#000",
        border: "1px solid var(--color-ink)",
      }}
      aria-hidden="true"
    >
      {values.map((v, i) => {
        const barH = Math.max(1, (v / 100) * h);
        return (
          <rect
            key={i}
            x={i * (w / HISTORY_LEN)}
            y={h - barH}
            width={barW}
            height={barH}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

function MeterBar({
  used,
  total,
  color,
}: {
  used: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100);
  return (
    <div
      style={{
        width: "100%",
        height: "16px",
        background: "#000",
        border: "1px solid var(--color-ink)",
        position: "relative",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "2px solid var(--color-ink)",
        padding: "0",
        background: "var(--bg-window)",
      }}
    >
      <div
        style={{
          background: "var(--bg-titlebar)",
          padding: "2px 8px",
          fontFamily: "var(--font-system)",
          fontSize: "14px",
          color: "white",
          letterSpacing: "0.04em",
          borderBottom: "1px solid var(--color-ink)",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "8px 10px" }}>{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}
    >
      <span
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "14px",
          color: "var(--color-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--color-ink)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function TaskManager() {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(
    Array(HISTORY_LEN).fill(0),
  );
  const [ramHistory, setRamHistory] = useState<number[]>(
    Array(HISTORY_LEN).fill(0),
  );
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function poll() {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((data: ServerMetrics) => {
        setError(false);
        setMetrics(data);
        const ramPct =
          data.ramTotal === 0
            ? 0
            : Math.round((data.ramUsed / data.ramTotal) * 100);
        setCpuHistory((h) => [...h.slice(1), data.cpu]);
        setRamHistory((h) => [...h.slice(1), ramPct]);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "var(--font-system)",
          fontSize: "16px",
          color: "var(--color-accent)",
        }}
      >
        Failed to reach /api/metrics
      </div>
    );
  }

  const ramPct = metrics
    ? Math.min(100, Math.round((metrics.ramUsed / metrics.ramTotal) * 100))
    : 0;
  const heapPct = metrics
    ? Math.min(100, Math.round((metrics.heapUsed / metrics.heapTotal) * 100))
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
        fontFamily: "var(--font-system)",
        overflowY: "auto",
      }}
    >
      {/* Tab strip */}
      <div
        style={{
          borderBottom: "2px solid var(--color-ink)",
          padding: "0 8px",
          display: "flex",
          gap: "4px",
          background: "var(--bg-window)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "4px 14px",
            border: "2px solid var(--color-ink)",
            borderBottom: "none",
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-ink)",
            background: "var(--bg-window)",
            marginBottom: "-2px",
          }}
        >
          Performance
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "8px",
          alignContent: "start",
        }}
      >
        {/* CPU Usage */}
        <Panel title="CPU Usage">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Sparkline values={cpuHistory} color="var(--color-teal)" />
            <MeterBar
              used={metrics?.cpu ?? 0}
              total={100}
              color="var(--color-teal)"
            />
            <StatRow label="Usage" value={metrics ? `${metrics.cpu}%` : "…"} />
            <StatRow
              label="Cores"
              value={metrics ? String(metrics.cpuCores) : "…"}
            />
            <StatRow
              label="Model"
              value={
                metrics
                  ? metrics.cpuModel.length > 22
                    ? metrics.cpuModel.slice(0, 22) + "…"
                    : metrics.cpuModel
                  : "…"
              }
            />
          </div>
        </Panel>

        {/* RAM Usage */}
        <Panel title="Memory Usage">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Sparkline values={ramHistory} color="var(--color-accent)" />
            <MeterBar
              used={metrics?.ramUsed ?? 0}
              total={metrics?.ramTotal ?? 1}
              color="var(--color-accent)"
            />
            <StatRow
              label="Used"
              value={metrics ? formatBytes(metrics.ramUsed) : "…"}
            />
            <StatRow
              label="Total"
              value={metrics ? formatBytes(metrics.ramTotal) : "…"}
            />
            <StatRow label="Free" value={metrics ? `${100 - ramPct}%` : "…"} />
          </div>
        </Panel>

        {/* System */}
        <Panel title="System">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <StatRow
              label="OS Uptime"
              value={metrics ? formatUptime(metrics.uptime) : "…"}
            />
            <StatRow
              label="Node Uptime"
              value={metrics ? formatUptime(metrics.nodeUptime) : "…"}
            />
          </div>
        </Panel>

        {/* Node.js Heap */}
        <Panel title="Node.js Heap">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <MeterBar
              used={metrics?.heapUsed ?? 0}
              total={metrics?.heapTotal ?? 1}
              color="var(--color-yellow)"
            />
            <StatRow
              label="Used"
              value={metrics ? formatBytes(metrics.heapUsed) : "…"}
            />
            <StatRow
              label="Total"
              value={metrics ? formatBytes(metrics.heapTotal) : "…"}
            />
            <StatRow label="Usage" value={metrics ? `${heapPct}%` : "…"} />
          </div>
        </Panel>
      </div>

      {/* Status bar */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--color-ink)",
          padding: "2px 10px",
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          color: "var(--color-muted)",
        }}
      >
        {metrics ? "Refreshing every 2 seconds" : "Connecting…"}
      </div>
    </div>
  );
}
