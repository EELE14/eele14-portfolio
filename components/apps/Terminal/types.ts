/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface Line {
  id: string;
  kind: "prompt" | "output" | "error";
  text: string;
}

export interface OpenActions {
  openWindow: (id: string) => void;
  openFileExplorer: (initialPath: string[]) => void;
  openRepoWindow: (
    title: string,
    size: { width: number; height: number },
    meta: Record<string, string>,
  ) => void;
  openTextViewer: (filename: string, url: string) => void;
  openBrowserWindow: (url: string) => void;
  showSecurity: () => void;
  logout?: () => void;
}
