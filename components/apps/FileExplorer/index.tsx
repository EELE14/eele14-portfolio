/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState } from "react";
import { useDesktopStore, type ContextMenuItem } from "@/store/windowStore";
import StatusBar from "@/components/ui/StatusBar";
import EmptyState from "@/components/ui/EmptyState";
import { useNavigation } from "./hooks/useNavigation";
import { useVFSItems } from "./hooks/useVFSItems";
import {
  readFile,
  resolveParentForWrite,
  formatSize,
  type VFSNode,
} from "@/lib/shared/vfs";
import { VFS_ROOTS, canonicalRootName } from "@/lib/shared/vfs/constants";
import Toolbar from "./components/Toolbar";
import FileViewer from "./components/FileViewer";
import ImageViewer from "./components/ImageViewer";
import SkillsView from "./components/SkillsView";
import NewFileDialog from "./components/NewFileDialog";
import ItemIcon from "./components/ItemIcon";
import PropertiesDialog from "@/components/windows/PropertiesDialog";

interface FsNodeFull {
  id: string;
  name: string;
  type: string;
  content: string | null;
  isPublic: boolean;
  createdAt: string;
}

interface PropsFor {
  name: string;
  type: string;
  location: string;
  size?: string;
  created?: string;
}

export default function FileExplorer({
  initialPath,
}: {
  initialPath?: string[];
}) {
  const [fileView, setFileView] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [imageView, setImageView] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editInput, setEditInput] = useState<string | null>(null);
  const [propsFor, setPropsFor] = useState<PropsFor | null>(null);

  const { currentPath, canBack, canFwd, push, goBack, goForward, goUp } =
    useNavigation(initialPath ?? [], () => {
      setFileView(null);
      setImageView(null);
      setEditInput(null);
    });

  const openGuestbookEditor = useDesktopStore((s) => s.openGuestbookEditor);
  const openNotepad = useDesktopStore((s) => s.openNotepad);
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);
  const isAdmin = useDesktopStore((s) => s.isAdmin);

  const { items, refresh } = useVFSItems(currentPath, isAdmin);

  const addressInput = editInput ?? ["C:", ...currentPath].join("\\");
  const topName = currentPath[0]?.toLowerCase() ?? "";
  const isSkillsFolder = topName === "skills" && currentPath.length === 1;
  const isGuestbookFolder = topName === "guestbook" && currentPath.length === 1;
  const isProjectStackFolder =
    topName === "projects" &&
    currentPath.length === 3 &&
    currentPath[2]?.toLowerCase() === "stack";

  const displayItems = (() => {
    if (!isGuestbookFolder) return items;
    try {
      const raw = localStorage.getItem("guestbook_shadow");
      if (!raw) return items;
      const s = JSON.parse(raw) as {
        name: string;
        message: string;
        createdAt: string;
      };
      const safeName =
        s.name
          .replace(/[^a-zA-Z0-9 _-]/g, "")
          .trim()
          .slice(0, 20) || "Anonymous";
      const filename = `${safeName}.txt`;
      if (items.some((i) => i.name.toLowerCase() === filename.toLowerCase()))
        return items;
      const date = new Date(s.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const shadowNode: VFSNode = {
        kind: "file",
        name: filename,
        content: `From: ${s.name}\nDate: ${date}\n\n${s.message}`,
      };
      return [shadowNode, ...items];
    } catch {
      return items;
    }
  })();

  const isWritable = (() => {
    if (currentPath.length === 0) return true;
    const root = canonicalRootName(topName);
    if (root !== undefined) return VFS_ROOTS[root].writable;
    return true;
  })();

  async function createFsNode(type: "file" | "folder") {
    const name = window.prompt(`Enter ${type} name:`);
    if (!name?.trim()) return;
    if (/[\\\/]/.test(name)) {
      alert("Name must not contain \\ or /");
      return;
    }
    const parentId = await resolveParentForWrite(currentPath);
    if (parentId === undefined) {
      alert("Cannot create here.");
      return;
    }
    const res = await fetch("/api/fs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        parentId,
        isPublic: true,
      }),
    });
    if (res.ok) {
      refresh();
    } else {
      const err = (await res.json()) as { error?: string };
      alert(err.error ?? "Failed to create.");
    }
  }

  async function openProperties(item: VFSNode) {
    const location = ["C:", ...currentPath].join("\\");
    const typeLabel =
      item.kind === "dir"
        ? "File Folder"
        : item.name.endsWith(".txt")
          ? "Text Document"
          : item.kind === "app"
            ? "Application"
            : "File";

    if (item.fsId) {
      try {
        const res = await fetch(`/api/fs/${item.fsId}`);
        if (res.ok) {
          const node = (await res.json()) as FsNodeFull;
          setPropsFor({
            name: item.name,
            type: typeLabel,
            location,
            size:
              node.content !== null
                ? formatSize(new TextEncoder().encode(node.content).length)
                : undefined,
            created: node.createdAt,
          });
          return;
        }
      } catch {
        /* fall through */
      }
    }
    setPropsFor({ name: item.name, type: typeLabel, location });
  }

  function handleItemContextMenu(e: React.MouseEvent, item: VFSNode) {
    e.preventDefault();
    e.stopPropagation();
    const menuItems: ContextMenuItem[] = [];

    if (item.kind === "file" && item.fsId) {
      menuItems.push({
        label: "Open",
        onClick: () => void handleItemDoubleClick(item),
      });
      menuItems.push({ label: "", onClick: () => {}, separator: true });
    }
    menuItems.push({
      label: "Properties",
      onClick: () => void openProperties(item),
    });

    showContextMenu(e.clientX, e.clientY, menuItems, item.name);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const path = ["C:", ...currentPath].join("\\");
    const menuItems: ContextMenuItem[] = [
      {
        label: "Copy path",
        onClick: () => void navigator.clipboard.writeText(path),
      },
    ];
    if (isGuestbookFolder) {
      menuItems.push({ label: "", onClick: () => {}, separator: true });
      menuItems.push({
        label: "New entry",
        onClick: () => setShowDialog(true),
      });
    }
    if (isAdmin && isWritable) {
      menuItems.push({ label: "", onClick: () => {}, separator: true });
      menuItems.push({
        label: "New folder",
        onClick: () => void createFsNode("folder"),
      });
      menuItems.push({
        label: "New file",
        onClick: () => void createFsNode("file"),
      });
    }
    showContextMenu(
      e.clientX,
      e.clientY,
      menuItems,
      currentPath.at(-1) ?? "File Explorer",
    );
  }

  async function handleItemDoubleClick(item: VFSNode) {
    if (item.kind === "dir") {
      push([...currentPath, item.name]);
    } else if (item.kind === "app" && item.appId) {
    } else if (item.kind === "image" && item.href) {
      setImageView({ name: item.name, url: item.href });
    } else if (item.kind === "link" && item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else if (item.kind === "file") {
      if (item.fsId) {
        openNotepad(item.name, `/api/fs/${item.fsId}?raw`, item.fsId);
      } else {
        const content =
          item.content !== undefined
            ? item.content
            : ((await readFile([...currentPath, item.name], isAdmin)) ??
              "(No content)");
        setFileView({ name: item.name, content });
      }
    }
  }

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = addressInput.replace(/^[Cc]:\\?/, "").replace(/\\/g, "/");
    const parts = raw.split("/").filter(Boolean);
    push(parts);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      <Toolbar
        canBack={canBack}
        canFwd={canFwd}
        canUp={currentPath.length > 0}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        addressInput={addressInput}
        onAddressChange={setEditInput}
        onAddressSubmit={handleAddressSubmit}
      />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px",
          position: "relative",
        }}
        onContextMenu={handleContextMenu}
      >
        {fileView ? (
          <FileViewer
            name={fileView.name}
            content={fileView.content}
            onBack={() => setFileView(null)}
          />
        ) : imageView ? (
          <ImageViewer
            name={imageView.name}
            url={imageView.url}
            onBack={() => setImageView(null)}
          />
        ) : displayItems.length === 0 ? (
          <EmptyState
            message={
              topName === "projects"
                ? "No projects found."
                : "This folder is empty."
            }
          />
        ) : isSkillsFolder || isProjectStackFolder ? (
          <SkillsView
            skills={displayItems}
            onOpen={(item) => {
              const content = item.content ?? `${item.name}\n${"─".repeat(32)}`;
              setFileView({ name: item.name, content });
            }}
          />
        ) : (
          <div
            role="list"
            aria-label={`Contents of ${["C:", ...currentPath].join("\\")}`}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              alignContent: "flex-start",
            }}
          >
            {displayItems.map((item) => (
              <button
                key={item.fsId ?? item.name}
                role="listitem"
                onDoubleClick={() => void handleItemDoubleClick(item)}
                onContextMenu={(e) => handleItemContextMenu(e, item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleItemDoubleClick(item);
                }}
                aria-label={`${item.name} (${item.kind})`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  width: "80px",
                  padding: "6px 4px",
                  background: "none",
                  border: "1px solid transparent",
                  cursor: "default",
                  textAlign: "center",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border =
                    "1px dashed var(--color-accent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid transparent";
                }}
              >
                <ItemIcon item={item} />
                <span
                  style={{
                    fontFamily: "var(--font-system)",
                    fontSize: "13px",
                    wordBreak: "break-word",
                    lineHeight: 1.2,
                    color: "var(--color-ink)",
                  }}
                >
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <StatusBar style={{ fontSize: "14px" }}>
        {isGuestbookFolder
          ? `${displayItems.length} entr${displayItems.length === 1 ? "y" : "ies"} — right-click to sign`
          : `${displayItems.length} object(s)`}
      </StatusBar>

      {showDialog && (
        <NewFileDialog
          guestbookEntries={null}
          onClose={() => setShowDialog(false)}
          onConfirm={(name) => {
            openGuestbookEditor(name);
            setShowDialog(false);
          }}
        />
      )}

      {propsFor && (
        <PropertiesDialog
          name={propsFor.name}
          type={propsFor.type}
          location={propsFor.location}
          size={propsFor.size}
          created={propsFor.created}
          onClose={() => setPropsFor(null)}
        />
      )}
    </div>
  );
}
