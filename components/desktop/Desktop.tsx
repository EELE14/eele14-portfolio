/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { APPS, RECYCLE_BIN } from "@/lib/client/apps";
import { useDesktopStore } from "@/store/windowStore";
import BootScreen from "./BootScreen";
import DesktopIcon from "./DesktopIcon";
import FloatingIcons from "./FloatingIcons";
import WindowManager from "./WindowManager";
import Taskbar from "./Taskbar";
import ContextMenu, { type ContextMenuItem } from "./ContextMenu";
import SecurityDialog from "@/components/windows/SecurityDialog";

interface ProjectWithRepo {
  slug: string;
  title: string;
  githubRepo: string;
  githubBranch: string | null;
}

interface FsDesktopNode {
  id: string;
  name: string;
  type: "file" | "folder";
}

const ICON_DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  "explorer.exe": { x: 0, y: 0 },
  "about.txt": { x: 0, y: 96 },
  "cmd.exe": { x: 0, y: 192 },
  "mail.exe": { x: 0, y: 288 },
  "battleship.exe": { x: 0, y: 384 },
  "browser.exe": { x: 0, y: 480 },
  "guestbook.exe": { x: 0, y: 576 },
  "stupid-ai.exe": { x: 0, y: 672 },
  recycle_bin: { x: 0, y: 768 },
};

type Pos = { x: number; y: number };

function savePositions(positions: Record<string, Pos>) {
  fetch("/api/desktop/positions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ positions }),
  }).catch(() => {});
}

function adminAppCtxItems(
  isAdmin: boolean,
  setShowSecurityDialog: (v: boolean) => void,
): ContextMenuItem[] {
  return [
    { label: "", onClick: () => {}, separator: true },
    {
      label: isAdmin ? "Running as Administrator" : "Run as Administrator",
      onClick: () => setShowSecurityDialog(true),
      disabled: isAdmin,
    },
  ];
}

export default function Desktop() {
  const {
    openWindow,
    openRepoWindow,
    openFileExplorer,
    openNotepad,
    openBrowserWindow,
    isAdmin,
    setAdmin,
    showSecurityDialog,
    setShowSecurityDialog,
    showStartMenu,
    setShowStartMenu,
    renamedIcons,
    hiddenIcons,
    renameIcon,
    deleteIcon,
    activeContextMenu,
    showContextMenu,
    hideContextMenu,
    setInboxUnread,
    windows,
    closeWindow,
  } = useDesktopStore();

  const [repoProjects, setRepoProjects] = useState<ProjectWithRepo[]>([]);
  const [desktopFsNodes, setDesktopFsNodes] = useState<FsDesktopNode[]>([]);
  const [screensaver, setScreensaver] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setScreensaver(true), 2 * 60 * 1000);
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== "object" || e.data === null) return;
      const { type, value, filename } = e.data as {
        type?: string;
        value?: string;
        filename?: string;
      };
      if (
        type === "os-open-media" &&
        typeof value === "string" &&
        typeof filename === "string"
      ) {
        useDesktopStore.getState().openMediaViewer(filename, value);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("mousedown", resetIdle);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("mousedown", resetIdle);
    };
  }, [resetIdle]);

  const alreadyBooted = useSyncExternalStore(
    () => () => {},
    () => !!sessionStorage.getItem("portfolio-booted"),
    () => false,
  );
  const [bootComplete, setBootComplete] = useState(false);
  const booting = !bootComplete && !alreadyBooted;

  const desktopRef = useRef<HTMLDivElement | null>(null);
  const [iconPositions, setIconPositions] = useState<Record<string, Pos>>(
    ICON_DEFAULT_POSITIONS,
  );
  const positionsRef = useRef<Record<string, Pos>>(ICON_DEFAULT_POSITIONS);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const bootDataReady = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    bootDataReady.current = Promise.allSettled([
      fetch("/api/desktop/positions")
        .then((r) => r.json())
        .then((data: { positions?: Record<string, Pos> }) => {
          if (data.positions && typeof data.positions === "object") {
            const el = desktopRef.current;
            const w = el?.clientWidth ?? window.innerWidth;
            const h = el?.clientHeight ?? window.innerHeight;
            const px: Record<string, Pos> = {};
            for (const [id, frac] of Object.entries(data.positions)) {
              px[id] = { x: (frac as Pos).x * w, y: (frac as Pos).y * h };
            }
            const merged = { ...ICON_DEFAULT_POSITIONS, ...px };
            positionsRef.current = merged;
            setIconPositions(merged);
          }
        }),
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data: { isAdmin?: boolean }) => {
          setAdmin(!!data.isAdmin);
          if (data.isAdmin) {
            fetch("/api/messages/unread")
              .then((r) => r.json())
              .then((d: { count?: number }) => setInboxUnread(d.count ?? 0))
              .catch(() => {});
          }
        }),
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data: unknown[]) => {
          setRepoProjects(
            (data as ProjectWithRepo[]).filter((p) => !!p.githubRepo),
          );
        }),
      fetch("/api/fs")
        .then((r) => r.json())
        .then((roots: Array<{ id: string; name: string; type: string }>) => {
          const mount = roots.find(
            (n) => n.name.toLowerCase() === "desktop" && n.type === "folder",
          );
          if (!mount) return;
          return fetch(`/api/fs?parentId=${encodeURIComponent(mount.id)}`)
            .then((r) => r.json())
            .then(
              (children: Array<{ id: string; name: string; type: string }>) => {
                setDesktopFsNodes(
                  children.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type === "folder" ? "folder" : "file",
                  })),
                );
              },
            );
        })
        .catch(() => {}),
      !sessionStorage.getItem("portfolio-visited")
        ? fetch("/api/visits", { method: "POST" })
            .then(() => sessionStorage.setItem("portfolio-visited", "1"))
            .catch(() => {})
        : Promise.resolve(),
    ]).then(() => {});
  }, [setAdmin, setInboxUnread]);

  type Rect = { x: number; y: number; w: number; h: number };
  const marqueeOrigin = useRef<Pos | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<Rect | null>(null);
  const [marqueeSelectedIds, setMarqueeSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  function toDesktopPos(clientX: number, clientY: number): Pos {
    const r = desktopRef.current?.getBoundingClientRect();
    return r
      ? { x: clientX - r.left, y: clientY - r.top }
      : { x: clientX, y: clientY };
  }

  function rectsIntersect(a: Rect, b: Rect) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }

  const handleMarqueeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.target !== desktopRef.current) return;
    marqueeOrigin.current = toDesktopPos(e.clientX, e.clientY);
    desktopRef.current.setPointerCapture(e.pointerId);
  };

  const handleMarqueeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const origin = marqueeOrigin.current;
    if (!origin) return;
    const cur = toDesktopPos(e.clientX, e.clientY);
    const rect: Rect = {
      x: Math.min(origin.x, cur.x),
      y: Math.min(origin.y, cur.y),
      w: Math.abs(cur.x - origin.x),
      h: Math.abs(cur.y - origin.y),
    };
    setMarqueeRect(rect);
    const hit = new Set<string>();
    for (const [id, p] of Object.entries(positionsRef.current)) {
      if (rectsIntersect(rect, { x: p.x, y: p.y, w: 80, h: 80 })) hit.add(id);
    }
    setMarqueeSelectedIds(hit);
  };

  const handleMarqueeUp = () => {
    if (!marqueeOrigin.current) return;
    marqueeOrigin.current = null;
    setMarqueeRect(null);
    setMarqueeSelectedIds(new Set());
  };

  const handlePositionChange = useCallback((id: string, pos: Pos) => {
    positionsRef.current = { ...positionsRef.current, [id]: pos };
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(() => {
      const el = desktopRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const normalized: Record<string, Pos> = {};
      for (const [k, p] of Object.entries(positionsRef.current)) {
        normalized[k] = { x: p.x / w, y: p.y / h };
      }
      savePositions(normalized);
    }, 800);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "Delete") {
        e.preventDefault();
        setShowSecurityDialog(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setShowSecurityDialog]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "F4") {
        e.preventDefault();
        const top = windows
          .filter((w) => w.isOpen && !w.isMinimized)
          .reduce<
            (typeof windows)[number] | null
          >((max, w) => (!max || w.zIndex > max.zIndex ? w : max), null);
        if (top) closeWindow(top.id);
      }
      if (
        (e.ctrlKey && e.key === "Escape") ||
        (e.key === "Meta" && !e.ctrlKey && !e.altKey && !e.shiftKey)
      ) {
        e.preventDefault();
        setShowStartMenu(!showStartMenu);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [windows, closeWindow, showStartMenu, setShowStartMenu]);

  const handleBootComplete = useCallback(async () => {
    sessionStorage.setItem("portfolio-booted", "1");
    await bootDataReady.current;
    setBootComplete(true);
    if (!localStorage.getItem("eele14-welcome-shown")) {
      localStorage.setItem("eele14-welcome-shown", "1");
      openBrowserWindow("/browser/home.html?context=browser");
    }
  }, [openBrowserWindow]);

  const desktopCtxItems: ContextMenuItem[] = [
    { label: "Refresh", onClick: () => window.location.reload() },
    { label: "Screen Saver", onClick: () => setScreensaver(true) },
    ...(isAdmin
      ? [
          { label: "", onClick: () => {}, separator: true as const },
          { label: "New File", onClick: () => {} },
          { label: "New Folder", onClick: () => {} },
        ]
      : []),
  ];

  const appExtraItems: Record<string, ContextMenuItem[]> = {
    "cmd.exe": adminAppCtxItems(isAdmin, setShowSecurityDialog),
    "content_editor.exe": adminAppCtxItems(isAdmin, setShowSecurityDialog),
    "file_manager.exe": adminAppCtxItems(isAdmin, setShowSecurityDialog),
    "about.txt": [
      { label: "", onClick: () => {}, separator: true },
      { label: "Print", onClick: () => window.print() },
    ],
    "battleship.exe": [
      { label: "", onClick: () => {}, separator: true },
      {
        label: "New Session",
        onClick: () => {
          sessionStorage.removeItem("battleship-session");
          openWindow("battleship.exe");
        },
      },
    ],
    "browser.exe": [
      { label: "", onClick: () => {}, separator: true },
      {
        label: "New Window",
        onClick: () => {
          sessionStorage.removeItem("browser-history");
          openWindow("browser.exe");
        },
      },
    ],
  };

  const publicApps = APPS.filter((a) => !a.adminOnly);
  const adminApps = APPS.filter((a) => a.adminOnly);
  const visibleApps = [...publicApps, ...(isAdmin ? adminApps : [])].filter(
    (a) => !hiddenIcons.includes(a.id),
  );

  return (
    <div
      className="desktop-root"
      onContextMenu={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("input, textarea, select, [contenteditable]")) return;
        e.preventDefault();
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {booting && <BootScreen onComplete={handleBootComplete} />}

      <div
        className="desktop-texture"
        onContextMenu={(e) => {
          e.preventDefault();
          if ((e.target as HTMLElement).closest("[data-no-ctx-menu]")) return;
          showContextMenu(e.clientX, e.clientY, desktopCtxItems);
        }}
        style={{
          position: "relative",
          flex: 1,
          background: "var(--bg-desktop)",
          overflow: "hidden",
          padding: "8px",
        }}
      >
        <FloatingIcons
          screensaver={screensaver}
          onDismiss={() => {
            setScreensaver(false);
            resetIdle();
          }}
        />
        <div
          ref={desktopRef}
          style={{
            opacity: screensaver ? 0 : 1,
            pointerEvents: screensaver ? "none" : "auto",
            transition: "opacity 1.2s ease",
            position: "absolute",
            inset: 0,
          }}
          onPointerDown={handleMarqueeDown}
          onPointerMove={handleMarqueeMove}
          onPointerUp={handleMarqueeUp}
        >
          {marqueeRect && (
            <div
              style={{
                position: "absolute",
                left: marqueeRect.x,
                top: marqueeRect.y,
                width: marqueeRect.w,
                height: marqueeRect.h,
                border: "1px dashed var(--color-accent)",
                background: "rgba(232,71,42,0.07)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          )}

          {visibleApps.map((app) => (
            <DesktopIcon
              key={app.id}
              id={app.id}
              label={renamedIcons[app.id] ?? app.title}
              icon={app.icon}
              defaultPosition={
                iconPositions[app.id] ??
                ICON_DEFAULT_POSITIONS[app.id] ?? { x: 16, y: 16 }
              }
              description={app.description}
              type="Application"
              isAdmin={isAdmin}
              onOpen={() => openWindow(app.id)}
              onPositionChange={handlePositionChange}
              onRename={(newLabel) => renameIcon(app.id, newLabel)}
              onDelete={() => deleteIcon(app.id)}
              appExtraItems={appExtraItems[app.id]}
              marqueeSelected={marqueeSelectedIds.has(app.id)}
            />
          ))}

          {!hiddenIcons.includes("recycle_bin") && (
            <DesktopIcon
              id="recycle_bin"
              label={renamedIcons["recycle_bin"] ?? RECYCLE_BIN.title}
              icon={RECYCLE_BIN.icon}
              defaultPosition={
                iconPositions.recycle_bin ?? ICON_DEFAULT_POSITIONS.recycle_bin
              }
              isAdmin={isAdmin}
              onOpen={() => {}}
              onPositionChange={handlePositionChange}
              onRename={(newLabel) => renameIcon("recycle_bin", newLabel)}
              onDelete={() => deleteIcon("recycle_bin")}
              marqueeSelected={marqueeSelectedIds.has("recycle_bin")}
            />
          )}

          {repoProjects
            .filter((p) => !hiddenIcons.includes(`repo:${p.slug}`))
            .map((p, idx) => {
              const iconId = `repo:${p.slug}`;
              const [repoOwner, repoName] = p.githubRepo.split("/");
              const defaultPos = iconPositions[iconId] ?? {
                x: 96,
                y: idx * 96,
              };
              return (
                <DesktopIcon
                  key={iconId}
                  id={iconId}
                  label={renamedIcons[iconId] ?? p.title}
                  icon={APPS.find((a) => a.id === "explorer.exe")?.icon}
                  defaultPosition={defaultPos}
                  isAdmin={isAdmin}
                  type="Folder"
                  description={`GitHub Repository: ${p.githubRepo}${p.githubBranch ? ` (Branch: ${p.githubBranch})` : ""}`}
                  onOpen={() =>
                    openRepoWindow(
                      `${p.title} — Source`,
                      { width: 700, height: 520 },
                      {
                        slug: p.slug,
                        owner: repoOwner ?? "",
                        repo: repoName ?? "",
                        branch: p.githubBranch ?? "",
                        projectTitle: p.title,
                      },
                    )
                  }
                  onPositionChange={handlePositionChange}
                  onRename={(newLabel) => renameIcon(iconId, newLabel)}
                  onDelete={() => deleteIcon(iconId)}
                  marqueeSelected={marqueeSelectedIds.has(iconId)}
                />
              );
            })}

          {desktopFsNodes
            .filter((n) => !hiddenIcons.includes(`fs:${n.id}`))
            .map((node, idx) => {
              const iconId = `fs:${node.id}`;
              return (
                <DesktopIcon
                  key={iconId}
                  id={iconId}
                  label={renamedIcons[iconId] ?? node.name}
                  icon={
                    node.type === "folder" ? (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="12"
                          width="44"
                          height="31"
                          rx="2"
                          fill="var(--color-yellow)"
                          stroke="var(--color-ink)"
                          strokeWidth="2"
                        />
                        <path
                          d="M2 17V12a2 2 0 0 1 2-2h12l5 5H2z"
                          fill="var(--color-yellow)"
                          stroke="var(--color-ink)"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="10"
                          y="2"
                          width="28"
                          height="44"
                          rx="2"
                          fill="var(--bg-window)"
                          stroke="var(--color-ink)"
                          strokeWidth="2"
                        />
                        <line
                          x1="15"
                          y1="14"
                          x2="33"
                          y2="14"
                          stroke="var(--color-ink)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="21"
                          x2="33"
                          y2="21"
                          stroke="var(--color-ink)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="28"
                          x2="25"
                          y2="28"
                          stroke="var(--color-ink)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )
                  }
                  defaultPosition={
                    iconPositions[iconId] ?? { x: 192, y: idx * 96 }
                  }
                  isAdmin={isAdmin}
                  type={node.type === "folder" ? "Folder" : "File"}
                  onOpen={() =>
                    node.type === "file"
                      ? openNotepad(
                          node.name,
                          `/api/fs/${node.id}?raw`,
                          node.id,
                        )
                      : openFileExplorer(["Desktop", node.name])
                  }
                  onPositionChange={handlePositionChange}
                  onRename={(newLabel) => renameIcon(iconId, newLabel)}
                  onDelete={() => deleteIcon(iconId)}
                  marqueeSelected={marqueeSelectedIds.has(iconId)}
                />
              );
            })}

          <WindowManager />

          {activeContextMenu && (
            <ContextMenu
              x={activeContextMenu.x}
              y={activeContextMenu.y}
              title={activeContextMenu.title}
              items={activeContextMenu.items}
              onClose={hideContextMenu}
            />
          )}
        </div>
        {/* end screensaver visibility wrapper */}
      </div>

      <div
        style={{
          opacity: screensaver ? 0 : 1,
          pointerEvents: screensaver ? "none" : "auto",
          transition: "opacity 1.2s ease",
          flexShrink: 0,
        }}
      >
        <Taskbar />
      </div>

      {isAdmin && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9998,
            boxShadow: "inset 0 0 0 3px var(--color-accent)",
          }}
        />
      )}

      {showSecurityDialog && <SecurityDialog />}
    </div>
  );
}
