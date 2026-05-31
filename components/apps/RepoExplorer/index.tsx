/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useRef, useState } from "react";
import type { GitHubEntry } from "@/lib/server/github";
import { useDesktopStore } from "@/store/windowStore";
import StatusBar from "@/components/ui/StatusBar";
import LoadingState from "@/components/ui/LoadingState";
import { useRepoEntries } from "./hooks/useRepoEntries";
import { isBinary } from "./lib/binary";
import RepoToolbar from "./components/RepoToolbar";
import RepoHeader from "./components/RepoHeader";
import EntryGrid from "./components/EntryGrid";
import FileContent from "./components/FileContent";
import type { FileView } from "./types";

export interface RepoExplorerProps {
  owner: string;
  repo: string;
  branch?: string;
  projectTitle: string;
}

export default function RepoExplorer({
  owner,
  repo,
  branch,
  projectTitle,
}: RepoExplorerProps) {
  const openMediaViewer = useDesktopStore((s) => s.openMediaViewer);
  const openBrowserWindow = useDesktopStore((s) => s.openBrowserWindow);
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);

  const [navHistory, setNavHistory] = useState<string[]>([""]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [fileView, setFileView] = useState<FileView | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [editInput, setEditInput] = useState<string | null>(null);

  const currentPath = navHistory[historyIdx];
  const canBack = historyIdx > 0;
  const canForward = historyIdx < navHistory.length - 1;
  const addressInput =
    editInput ?? (currentPath ? `/${repo}/${currentPath}` : `/${repo}`);

  const { entries, loading, error } = useRepoEntries(
    owner,
    repo,
    branch,
    currentPath,
  );

  const push = useCallback(
    (newPath: string) => {
      setNavHistory((prev) => [...prev.slice(0, historyIdx + 1), newPath]);
      setHistoryIdx((i) => i + 1);
      setFileView(null);
      setEditInput(null);
    },
    [historyIdx],
  );

  function goBack() {
    if (canBack) {
      setHistoryIdx((i) => i - 1);
      setFileView(null);
      setEditInput(null);
    }
  }
  function goForward() {
    if (canForward) {
      setHistoryIdx((i) => i + 1);
      setFileView(null);
      setEditInput(null);
    }
  }
  function goUp() {
    if (!currentPath && !fileView) return;
    if (fileView) {
      setFileView(null);
      return;
    }
    const parts = currentPath.split("/");
    push(parts.slice(0, -1).join("/"));
  }

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    let raw = addressInput.trim().replace(/^\//, "");
    if (raw.startsWith(`${repo}/`)) raw = raw.slice(repo.length + 1);
    else if (raw === repo) raw = "";
    push(raw);
  }

  const openFile = useCallback(
    async (entry: GitHubEntry) => {
      if (isBinary(entry.name)) {
        if (entry.download_url) openMediaViewer(entry.name, entry.download_url);
        return;
      }
      setFileLoading(true);
      try {
        const segments = entry.path
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        const branchParam = branch
          ? `?branch=${encodeURIComponent(branch)}`
          : "";
        const res = await fetch(
          `/api/github/${owner}/${repo}/blob/${segments}${branchParam}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        setFileView({
          name: entry.name,
          content: text,
          rawUrl: entry.download_url,
        });
      } catch {
        setFileView({
          name: entry.name,
          content: "(Failed to load file content.)",
          rawUrl: entry.download_url,
        });
      } finally {
        setFileLoading(false);
      }
    },
    [owner, repo, branch, openMediaViewer],
  );

  const lastClick = useRef<{ name: string; time: number } | null>(null);

  function handleItemClick(entry: GitHubEntry) {
    const now = Date.now();
    if (
      lastClick.current?.name === entry.name &&
      now - lastClick.current.time < 400
    ) {
      lastClick.current = null;
      if (entry.type === "dir") push(entry.path);
      else if (entry.type === "file") void openFile(entry);
    } else {
      lastClick.current = { name: entry.name, time: now };
    }
  }

  const breadcrumb = currentPath ? `/${repo}/${currentPath}` : `/${repo}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      <RepoToolbar
        canBack={canBack}
        canFwd={canForward}
        canUp={!!(currentPath || fileView)}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        addressInput={addressInput}
        onAddressChange={setEditInput}
        onAddressSubmit={handleAddressSubmit}
      />
      <RepoHeader
        projectTitle={projectTitle}
        owner={owner}
        repo={repo}
        branch={branch}
        onOpenBrowser={openBrowserWindow}
      />

      <div
        style={{ flex: 1, overflow: "auto", padding: "8px" }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const ghBase = `https://github.com/${owner}/${repo}`;
          const ghUrl = fileView
            ? `${ghBase}/blob/${branch ?? "main"}/${fileView.name}`
            : currentPath
              ? `${ghBase}/tree/${branch ?? "main"}/${currentPath}`
              : ghBase;
          const copyPath = fileView
            ? `/${repo}/${fileView.name}`
            : currentPath
              ? `/${repo}/${currentPath}`
              : `/${repo}`;
          showContextMenu(e.clientX, e.clientY, [
            {
              label: "Open on GitHub",
              onClick: () =>
                window.open(ghUrl, "_blank", "noopener,noreferrer"),
            },
            {
              label: "Copy path",
              onClick: () => void navigator.clipboard.writeText(copyPath),
            },
          ]);
        }}
      >
        {loading && <LoadingState message={`Loading ${breadcrumb}…`} />}

        {!loading && error && (
          <div
            style={{
              padding: "24px",
              fontFamily: "var(--font-system)",
              fontSize: "15px",
              color: "var(--color-accent)",
              textAlign: "center",
            }}
          >
            Could not load {breadcrumb}
            <br />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-muted)",
              }}
            >
              {error}
            </span>
          </div>
        )}

        {!loading && !error && fileView && (
          <FileContent
            view={fileView}
            isLoading={fileLoading}
            onBack={() => setFileView(null)}
          />
        )}

        {!loading && !error && !fileView && (
          <EntryGrid entries={entries} onItemClick={handleItemClick} />
        )}
      </div>

      <StatusBar style={{ fontSize: "14px" }}>
        {fileView ? fileView.name : `${entries.length} object(s)`}
      </StatusBar>
    </div>
  );
}
