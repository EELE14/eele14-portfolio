/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { getLocalIconUrl } from "@/lib/client/skill-icons";
import { eq, getProjects } from "./api";
import type { VFSRootName } from "./constants";
import type { VFSNode } from "./types";

export const DESKTOP_APP_IDS = [
  "explorer.exe",
  "about.txt",
  "cmd.exe",
  "mail.exe",
  "battleship.exe",
  "browser.exe",
  "guestbook.exe",
];

export function sanitizeName(
  raw: string,
  maxLen = 20,
  fallback = "Unknown",
): string {
  return (
    raw
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, maxLen) || fallback
  );
}

export function guestbookFilenames(entries: { name: string }[]): string[] {
  const seen = new Map<string, number>();
  return entries.map((e) => {
    const base = sanitizeName(e.name, 20, "Anonymous");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? `${base}.txt` : `${base}-${count + 1}.txt`;
  });
}

export async function listVirtualRootTop(
  root: VFSRootName,
): Promise<VFSNode[] | null> {
  if (root === "Desktop") {
    const projects = await getProjects();
    return [
      ...DESKTOP_APP_IDS.map((id) => ({
        kind: "app" as const,
        name: id,
        appId: id,
      })),
      ...projects
        .filter((p) => p.githubRepo)
        .map((p) => ({ kind: "dir" as const, name: p.slug })),
    ];
  }

  if (root === "Projects") {
    const projects = await getProjects();
    return projects.map((p) => ({ kind: "dir" as const, name: p.title }));
  }

  if (root === "About") {
    return [{ kind: "file" as const, name: "about.txt" }];
  }

  if (root === "Skills") {
    try {
      const res = await fetch("/api/skills");
      const skills = (await res.json()) as Array<{
        name: string;
        icon?: string | null;
      }>;
      return skills.map((s) => ({
        kind: "file" as const,
        name: s.name,
        iconUrl: s.icon ? getLocalIconUrl(s.icon) : undefined,
        content: s.name,
      }));
    } catch {
      return [];
    }
  }

  if (root === "Guestbook") {
    try {
      const res = await fetch("/api/guestbook");
      if (!res.ok) return [];
      const entries = (await res.json()) as Array<{ id: string; name: string }>;
      const names = guestbookFilenames(entries);
      return entries.map((e, i) => ({ kind: "file" as const, name: names[i] }));
    } catch {
      return [];
    }
  }

  if (root === "Recycle Bin") {
    return [];
  }

  return null;
}

export async function listProjectSubdir(
  titleSeg: string,
): Promise<VFSNode[] | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.title, titleSeg));
  if (!project) return null;

  const items: VFSNode[] = [
    { kind: "file", name: "README.txt" },
    { kind: "dir", name: "Stack" },
  ];
  if (project.imageUrls.length > 0) items.push({ kind: "dir", name: "Images" });
  if (project.sourceUrl)
    items.push({ kind: "link", name: "source.lnk", href: project.sourceUrl });
  if (project.liveUrl)
    items.push({ kind: "link", name: "live.lnk", href: project.liveUrl });
  return items;
}

function parseImageEntry(entry: string): { name: string; url: string } {
  const sep = entry.indexOf("|||");
  if (sep !== -1) {
    return { name: entry.slice(0, sep), url: entry.slice(sep + 3) };
  }
  const raw = entry.split("/").pop()?.split("?")[0] ?? "";
  const base = raw.replace(/[^a-zA-Z0-9_-]/g, "") || "image";
  return { name: `${base}.png`, url: entry };
}

export async function listProjectImagesDir(
  titleSeg: string,
): Promise<VFSNode[] | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.title, titleSeg));
  if (!project) return null;

  return project.imageUrls.map((entry) => {
    const { name, url } = parseImageEntry(entry);
    return { kind: "image" as const, name, href: url };
  });
}

export async function listProjectStackDir(
  titleSeg: string,
): Promise<VFSNode[] | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.title, titleSeg));
  if (!project) return null;

  const iconMap = new Map<string, string | null>();
  try {
    const res = await fetch("/api/skills");
    const skills = (await res.json()) as Array<{
      name: string;
      icon?: string | null;
    }>;
    for (const s of skills) iconMap.set(s.name.toLowerCase(), s.icon ?? null);
  } catch {
    /* show stack without icons */
  }

  return project.stack.map((name) => {
    const iconSlug = iconMap.get(name.toLowerCase()) ?? null;
    return {
      kind: "file" as const,
      name: `${name}.txt`,
      iconUrl: iconSlug ? getLocalIconUrl(iconSlug) : undefined,
      content: name,
    };
  });
}

export async function readProjectFile(
  titleSeg: string,
  fileSeg: string,
): Promise<string | null> {
  const projects = await getProjects();
  const project = projects.find((p) => eq(p.title, titleSeg));
  if (!project) return null;
  if (eq(fileSeg, "README.txt")) return project.description;
  if (eq(fileSeg, "source.lnk")) return project.sourceUrl ?? null;
  if (eq(fileSeg, "live.lnk")) return project.liveUrl ?? null;
  return null;
}
