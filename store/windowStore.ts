/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  meta?: Record<string, string>;
}

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
  danger?: boolean;
}

interface ActiveContextMenu {
  x: number;
  y: number;
  title?: string;
  items: ContextMenuItem[];
}

interface DesktopStore {
  windows: WindowState[];
  zCounter: number;
  isAdmin: boolean;
  showSecurityDialog: boolean;
  showStartMenu: boolean;
  renamedIcons: Record<string, string>;
  hiddenIcons: string[];
  activeContextMenu: ActiveContextMenu | null;
  inboxUnread: number;
  setInboxUnread: (count: number) => void;
  setShowStartMenu: (v: boolean) => void;
  showContextMenu: (
    x: number,
    y: number,
    items: ContextMenuItem[],
    title?: string,
  ) => void;
  hideContextMenu: () => void;
  openWindow: (appId: string) => void;
  openFileExplorer: (initialPath: string[]) => void;
  openRepoWindow: (
    title: string,
    size: { width: number; height: number },
    meta: Record<string, string>,
  ) => void;
  openTextViewer: (filename: string, url: string) => void;
  openNotepad: (filename: string, url: string, fsId?: string) => void;
  openMediaViewer: (filename: string, url: string) => void;
  openBrowserWindow: (url: string) => void;
  openGuestbookEditor: (filename: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowGeometry: (
    id: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
  ) => void;
  setAdmin: (value: boolean) => void;
  setShowSecurityDialog: (value: boolean) => void;
  renameIcon: (id: string, label: string) => void;
  deleteIcon: (id: string) => void;
  restoreIcon: (id: string) => void;
}

export const APP_DEFAULTS: Record<
  string,
  { title: string; size: { width: number; height: number } }
> = {
  "explorer.exe": { title: "File Explorer", size: { width: 640, height: 480 } },
  "about.txt": {
    title: "Notepad — about.txt",
    size: { width: 560, height: 400 },
  },
  "cmd.exe": { title: "Command Prompt", size: { width: 600, height: 380 } },
  "mail.exe": { title: "New Message", size: { width: 520, height: 440 } },
  "minesweeper.exe": {
    title: "Minesweeper",
    size: { width: 340, height: 460 },
  },
  "battleship.exe": {
    title: "Naval Combat",
    size: { width: 760, height: 560 },
  },
  "browser.exe": {
    title: "Internet Browser",
    size: { width: 900, height: 620 },
  },
  "guestbook.exe": { title: "Guestbook", size: { width: 680, height: 480 } },
  "guestbook-editor": { title: "Notepad", size: { width: 560, height: 420 } },
  notepad: { title: "Notepad", size: { width: 560, height: 400 } },
  "taskmgr.exe": {
    title: "Windows Task Manager",
    size: { width: 520, height: 480 },
  },
  "stupid-ai.exe": { title: "Stupid AI", size: { width: 520, height: 480 } },
  "content_editor.exe": {
    title: "Content Editor [ADMIN]",
    size: { width: 700, height: 520 },
  },
  "file_manager.exe": {
    title: "Inbox [ADMIN]",
    size: { width: 620, height: 460 },
  },
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cascadeOffset(windows: WindowState[]): number {
  return (windows.filter((w) => w.isOpen).length % 8) * 24;
}

type SetFn = (fn: (s: DesktopStore) => Partial<DesktopStore>) => void;
type GetFn = () => DesktopStore;

interface PushOptions {
  appId: string;
  title: string;
  size: { width: number; height: number };
  meta?: Record<string, string>;
  dedupe?: (w: WindowState) => boolean;
}

function pushWindow(get: GetFn, set: SetFn, opts: PushOptions): void {
  const { windows, zCounter } = get();

  if (opts.dedupe) {
    const existing = windows.find((w) => w.isOpen && opts.dedupe!(w));
    if (existing) {
      if (existing.isMinimized) {
        set((s) => ({
          zCounter: s.zCounter + 1,
          windows: s.windows.map((w) =>
            w.id === existing.id
              ? { ...w, isMinimized: false, zIndex: s.zCounter + 1 }
              : w,
          ),
        }));
      } else {
        get().focusWindow(existing.id);
      }
      return;
    }
  }

  const offset = cascadeOffset(windows);
  set((s) => ({
    zCounter: s.zCounter + 1,
    windows: [
      ...s.windows,
      {
        id: generateId(),
        appId: opts.appId,
        title: opts.title,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: zCounter + 1,
        position: { x: 80 + offset, y: 60 + offset },
        size: opts.size,
        meta: opts.meta,
      },
    ],
  }));
}

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set, get) => ({
      windows: [],
      zCounter: 10,
      isAdmin: false,
      showSecurityDialog: false,
      showStartMenu: false,
      renamedIcons: {},
      hiddenIcons: [],
      activeContextMenu: null,
      inboxUnread: 0,
      setInboxUnread: (count) => set({ inboxUnread: count }),
      setShowStartMenu: (v) => set({ showStartMenu: v }),

      showContextMenu: (x, y, items, title) => {
        set({ activeContextMenu: { x, y, items, title } });
      },
      hideContextMenu: () => {
        set({ activeContextMenu: null });
      },

      openWindow: (appId) => {
        const defaults = APP_DEFAULTS[appId] ?? {
          title: appId,
          size: { width: 500, height: 380 },
        };
        pushWindow(get, set as SetFn, {
          appId,
          title: defaults.title,
          size: defaults.size,
          dedupe: (w) => w.appId === appId,
        });
      },

      openFileExplorer: (initialPath) => {
        const { title, size } = APP_DEFAULTS["explorer.exe"]!;
        pushWindow(get, set as SetFn, {
          appId: "explorer.exe",
          title,
          size,
          meta: { initialPath: JSON.stringify(initialPath) },
        });
      },

      openRepoWindow: (title, size, meta) => {
        pushWindow(get, set as SetFn, {
          appId: "repo-explorer",
          title,
          size,
          meta,
          dedupe: (w) =>
            w.appId === "repo-explorer" && w.meta?.slug === meta.slug,
        });
      },

      openTextViewer: (filename, url) => {
        pushWindow(get, set as SetFn, {
          appId: "text-viewer",
          title: filename,
          size: { width: 700, height: 520 },
          meta: { filename, url },
          dedupe: (w) => w.appId === "text-viewer" && w.meta?.url === url,
        });
      },

      openNotepad: (filename, url, fsId) => {
        pushWindow(get, set as SetFn, {
          appId: "notepad",
          title: `Notepad — ${filename}`,
          size: { width: 560, height: 400 },
          meta: { filename, url, ...(fsId ? { fsId } : {}) },
          dedupe: (w) => w.appId === "notepad" && w.meta?.url === url,
        });
      },

      openMediaViewer: (filename, url) => {
        pushWindow(get, set as SetFn, {
          appId: "media-viewer",
          title: filename,
          size: { width: 700, height: 520 },
          meta: { filename, url },
          dedupe: (w) => w.appId === "media-viewer" && w.meta?.url === url,
        });
      },

      openBrowserWindow: (url) => {
        const { title, size } = APP_DEFAULTS["browser.exe"]!;
        pushWindow(get, set as SetFn, {
          appId: "browser.exe",
          title,
          size,
          meta: { initialUrl: url },
        });
      },

      openGuestbookEditor: (filename) => {
        const { size } = APP_DEFAULTS["guestbook-editor"]!;
        pushWindow(get, set as SetFn, {
          appId: "guestbook-editor",
          title: `Notepad — ${filename}.txt`,
          size,
          meta: { filename },
          dedupe: (w) =>
            w.appId === "guestbook-editor" && w.meta?.filename === filename,
        });
      },

      closeWindow: (id) => {
        set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }));
      },

      minimizeWindow: (id) => {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: true } : w,
          ),
        }));
      },

      maximizeWindow: (id) => {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w,
          ),
        }));
      },

      focusWindow: (id) => {
        set((s) => ({
          zCounter: s.zCounter + 1,
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, zIndex: s.zCounter + 1 } : w,
          ),
        }));
      },

      updateWindowGeometry: (id, position, size) => {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, position, size } : w,
          ),
        }));
      },

      setAdmin: (value) => {
        set({ isAdmin: value });
      },

      setShowSecurityDialog: (value) => {
        set({ showSecurityDialog: value });
      },

      renameIcon: (id, label) => {
        set((s) => ({ renamedIcons: { ...s.renamedIcons, [id]: label } }));
      },

      deleteIcon: (id) => {
        set((s) => ({
          hiddenIcons: s.hiddenIcons.includes(id)
            ? s.hiddenIcons
            : [...s.hiddenIcons, id],
        }));
      },

      restoreIcon: (id) => {
        set((s) => ({ hiddenIcons: s.hiddenIcons.filter((x) => x !== id) }));
      },
    }),
    {
      name: "portfolio-desktop-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      version: 1,
      migrate: (stored) => {
        const s = stored as Record<string, unknown>;
        delete s.isAdmin;
        delete s.showSecurityDialog;
        delete s.activeContextMenu;
        return s;
      },
      partialize: (state) => ({
        windows: state.windows,
        zCounter: state.zCounter,
        renamedIcons: state.renamedIcons,
        hiddenIcons: state.hiddenIcons,
      }),
    },
  ),
);
