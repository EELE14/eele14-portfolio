/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktopStore } from "@/store/windowStore";
import { mkLine, makeWelcome } from "./constants";
import { runCommand } from "./lib/commands";
import type { Line, OpenActions } from "./types";

export default function Terminal() {
  const {
    openWindow,
    openFileExplorer,
    openRepoWindow,
    openTextViewer,
    openBrowserWindow,
    setShowSecurityDialog,
    showContextMenu,
    isAdmin,
    setAdmin,
  } = useDesktopStore();

  const [lines, setLines] = useState<Line[]>(() => makeWelcome(false));
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [cwd, setCwd] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = isAdmin ? "root" : "guest";
  const prompt =
    cwd.length === 0 ? `${user}@C:\\> ` : `${user}@C:\\${cwd.join("\\")}> `;

  // Reset MOTD and cwd only when isAdmin actually changes (not on initial mount)
  const prevAdminRef = useRef(isAdmin);
  useEffect(() => {
    if (prevAdminRef.current === isAdmin) return;
    prevAdminRef.current = isAdmin;
    setLines(makeWelcome(isAdmin));
    setCwd([]);
  }, [isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw = input.trim();
    setInput("");
    setHistIdx(-1);
    setLines((prev) => [...prev, mkLine("prompt", prompt + raw)]);
    if (!raw) return;

    setCmdHistory((h) => [raw, ...h]);
    setBusy(true);

    const actions: OpenActions = {
      openWindow,
      openFileExplorer,
      openRepoWindow,
      openTextViewer,
      openBrowserWindow,
      showSecurity: () => setShowSecurityDialog(true),
      logout: () => {
        const secureFlag =
          window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `portfolio_session=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
        setAdmin(false);
      },
    };

    const subCommands = raw
      .split("&&")
      .map((s) => s.trim())
      .filter(Boolean);
    let currentCwd = cwd;
    const allLines: Line[] = [];

    for (const sub of subCommands) {
      const result = await runCommand(sub, currentCwd, actions, isAdmin);

      if (result.lines.length === 1 && result.lines[0].id === "__clear__") {
        setLines(makeWelcome(isAdmin));
        setCwd([]);
        setBusy(false);
        return;
      }

      allLines.push(...result.lines);
      if (result.newCwd !== undefined) currentCwd = result.newCwd;
      if (result.lines.some((l) => l.kind === "error")) break;
    }

    setCwd(currentCwd);
    setLines((prev) => [...prev, ...allLines].slice(-500));
    setBusy(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(cmdHistory[next] ?? "");
      }
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const selection = window.getSelection()?.toString() ?? "";
        showContextMenu(e.clientX, e.clientY, [
          {
            label: "Copy",
            onClick: () => {
              if (selection) void navigator.clipboard.writeText(selection);
            },
            disabled: !selection,
          },
          {
            label: "Clear",
            onClick: () => {
              setLines(makeWelcome(isAdmin));
              setCwd([]);
            },
          },
        ]);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0c0c0c",
        cursor: "text",
      }}
      role="region"
      aria-label="Terminal emulator"
    >
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 14px",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              color:
                line.kind === "prompt"
                  ? "#cccccc"
                  : line.kind === "error"
                    ? "#ff6b6b"
                    : "#33ff33",
              minHeight: "1.7em",
            }}
          >
            {line.text || " "}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 14px",
          borderTop: "1px solid #333",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "#cccccc",
            flexShrink: 0,
            marginRight: "4px",
          }}
        >
          {prompt}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          autoFocus
          aria-label="Terminal input"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "#cccccc",
            caretColor: "#33ff33",
          }}
        />
      </form>
    </div>
  );
}
