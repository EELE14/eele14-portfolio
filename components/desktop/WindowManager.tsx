/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import dynamic from "next/dynamic";
import { useDesktopStore } from "@/store/windowStore";
import Window from "@/components/windows/Window";
import { getApp } from "@/lib/client/apps";

const FileExplorer = dynamic(() => import("@/components/apps/FileExplorer"), {
  ssr: false,
});
const Notepad = dynamic(() => import("@/components/apps/Notepad"), {
  ssr: false,
});
const Terminal = dynamic(() => import("@/components/apps/Terminal"), {
  ssr: false,
});
const ContactMail = dynamic(() => import("@/components/apps/ContactMail"), {
  ssr: false,
});
const ContentEditor = dynamic(() => import("@/components/apps/ContentEditor"), {
  ssr: false,
});
const FileManager = dynamic(() => import("@/components/apps/FileManager"), {
  ssr: false,
});
const Minesweeper = dynamic(() => import("@/components/apps/Minesweeper"), {
  ssr: false,
});
const Battleship = dynamic(() => import("@/components/apps/Battleship"), {
  ssr: false,
});
const Browser = dynamic(() => import("@/components/apps/Browser"), {
  ssr: false,
});
const RepoExplorer = dynamic(() => import("@/components/apps/RepoExplorer"), {
  ssr: false,
});
const MediaViewer = dynamic(() => import("@/components/apps/MediaViewer"), {
  ssr: false,
});
const TextViewer = dynamic(() => import("@/components/apps/TextViewer"), {
  ssr: false,
});

const Guestbook = dynamic(() => import("@/components/apps/Guestbook"), {
  ssr: false,
});

const GuestbookEditor = dynamic(
  () => import("@/components/apps/GuestbookEditor"),
  { ssr: false },
);

const TaskManager = dynamic(() => import("@/components/apps/TaskManager"), {
  ssr: false,
});

const StupidAI = dynamic(() => import("@/components/apps/StupidAI"), {
  ssr: false,
});

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  "explorer.exe": FileExplorer,
  "cmd.exe": Terminal,
  "mail.exe": ContactMail,
  "content_editor.exe": ContentEditor,
  "file_manager.exe": FileManager,
  "minesweeper.exe": Minesweeper,
  "battleship.exe": Battleship,
  "browser.exe": Browser,
  "guestbook.exe": Guestbook,
  "taskmgr.exe": TaskManager,
  "stupid-ai.exe": StupidAI,
};

const REPO_EXPLORER_MIN = { width: 480, height: 340 };

export default function WindowManager() {
  const windows = useDesktopStore((s) => s.windows);
  const visible = windows.filter((w) => w.isOpen && !w.isMinimized);

  return (
    <>
      {visible.map((win) => {
        const isRepo = win.appId === "repo-explorer";

        const isMedia = win.appId === "media-viewer";
        const isText = win.appId === "text-viewer";

        let content: React.ReactNode;
        if (isRepo && win.meta) {
          content = (
            <RepoExplorer
              owner={win.meta.owner ?? ""}
              repo={win.meta.repo ?? ""}
              branch={win.meta.branch}
              projectTitle={win.meta.projectTitle ?? ""}
            />
          );
        } else if (isText && win.meta) {
          content = (
            <TextViewer
              filename={win.meta.filename ?? ""}
              url={win.meta.url ?? ""}
            />
          );
        } else if (isMedia && win.meta) {
          content = (
            <MediaViewer
              url={win.meta.url ?? ""}
              filename={win.meta.filename ?? ""}
            />
          );
        } else if (win.appId === "about.txt") {
          content = <Notepad />;
        } else if (win.appId === "notepad" && win.meta) {
          content = (
            <Notepad
              url={win.meta.url}
              filename={win.meta.filename}
              fsId={win.meta.fsId}
            />
          );
        } else if (win.appId === "guestbook-editor" && win.meta?.filename) {
          content = <GuestbookEditor filename={win.meta.filename} />;
        } else if (win.appId === "browser.exe" && win.meta?.initialUrl) {
          content = <Browser initialUrl={win.meta.initialUrl} />;
        } else if (win.appId === "explorer.exe" && win.meta?.initialPath) {
          const path = JSON.parse(win.meta.initialPath) as string[];
          content = <FileExplorer initialPath={path} />;
        } else {
          const AppComponent = APP_COMPONENTS[win.appId];
          content = AppComponent ? (
            <AppComponent />
          ) : (
            <div style={{ padding: "16px", fontFamily: "var(--font-body)" }}>
              App not found: {win.appId}
            </div>
          );
        }

        const appDef = getApp(win.appId);
        const minWidth =
          isRepo || isMedia || isText
            ? REPO_EXPLORER_MIN.width
            : appDef?.minSize.width;
        const minHeight =
          isRepo || isMedia || isText
            ? REPO_EXPLORER_MIN.height
            : appDef?.minSize.height;

        return (
          <Window
            key={win.id}
            id={win.id}
            appId={win.appId}
            title={win.title}
            zIndex={win.zIndex}
            isMaximized={win.isMaximized}
            position={win.position}
            size={win.size}
            minWidth={minWidth}
            minHeight={minHeight}
          >
            {content}
          </Window>
        );
      })}
    </>
  );
}
