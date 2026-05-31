/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { APPS } from "@/lib/client/apps";
import {
  listDir,
  readFile,
  resolvePath,
  resolveParentForWrite,
  formatPath,
  formatSize,
  tokenise,
} from "@/lib/shared/vfs";
import { mkLine } from "../constants";
import type { Line, OpenActions } from "../types";

interface CommandResult {
  lines: Line[];
  newCwd?: string[];
}

function ok(lines: Line[], newCwd?: string[]): CommandResult {
  return { lines, newCwd };
}

async function createFsNode(
  cmdName: string,
  type: "file" | "folder",
  name: string,
  cwd: string[],
): Promise<Line[]> {
  const parentId = await resolveParentForWrite(cwd);
  if (parentId === undefined)
    return [mkLine("error", `${cmdName}: Cannot resolve current directory`)];
  try {
    const res = await fetch("/api/fs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        parentId,
        isPublic: true,
        ...(type === "file" ? { content: "" } : {}),
      }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return [mkLine("error", `${cmdName}: ${err.error ?? "Failed"}`)];
    }
    return [
      mkLine(
        "output",
        `${type === "folder" ? "Directory" : "File"} created: ${name}`,
      ),
    ];
  } catch {
    return [mkLine("error", `${cmdName}: Network error`)];
  }
}

export async function runCommand(
  raw: string,
  cwd: string[],
  actions: OpenActions,
  isAdmin: boolean,
): Promise<CommandResult> {
  const {
    openWindow,
    openFileExplorer,
    openRepoWindow,
    openTextViewer,
    openBrowserWindow,
    showSecurity,
  } = actions;
  const tokens = tokenise(raw.trim());
  const cmd = tokens[0]?.toLowerCase() ?? "";
  const args = tokens.slice(1);

  switch (cmd) {
    case "":
      return ok([]);

    case "help": {
      const lines: Line[] = [
        mkLine("output", "Available commands:"),
        mkLine("output", ""),
        mkLine("output", "  help              Show this help"),
        mkLine("output", "  pwd               Print working directory"),
        mkLine("output", "  ls [path]         List directory contents"),
        mkLine("output", "  cd <path>         Change directory"),
        mkLine("output", "  cat <file>        Show file contents"),
        mkLine("output", "  open <path>       Open file, directory, or app"),
        mkLine("output", "  clear             Clear terminal"),
        mkLine("output", "  mines             Launch Minesweeper"),
        mkLine("output", "  taskmgr           Open Task Manager"),
        mkLine("output", "  whoami            Who is eele?"),
        mkLine("output", ""),
        mkLine(
          "output",
          "Filesystem roots: Desktop  Projects  About  Skills  Files",
        ),
      ];
      if (isAdmin) {
        lines.push(mkLine("output", ""));
        lines.push(mkLine("output", "Admin commands:"));
        lines.push(mkLine("output", "  mkdir <name>      Create folder"));
        lines.push(mkLine("output", "  touch <name>      Create empty file"));
        lines.push(
          mkLine("output", "  rm <name>         Delete file or folder"),
        );
        lines.push(mkLine("output", "  sudo logout       End admin session"));
      }
      return ok(lines);
    }

    case "pwd":
      return ok([mkLine("output", formatPath(cwd))]);

    case "cd": {
      const target = args[0];
      if (!target) return ok([], []);

      const resolved = resolvePath(cwd, target);
      if (!resolved)
        return ok([mkLine("error", `cd: path resolves above filesystem root`)]);

      const entries = await listDir(resolved, isAdmin);
      if (entries === null)
        return ok([mkLine("error", `cd: "${target}": No such directory`)]);

      return ok([], resolved);
    }

    case "ls": {
      const targetPath = args[0] ? resolvePath(cwd, args[0]) : cwd;
      if (targetPath === null) return ok([mkLine("error", `ls: invalid path`)]);

      const entries = await listDir(targetPath, isAdmin);
      if (entries === null)
        return ok([
          mkLine(
            "error",
            `ls: "${args[0] ?? formatPath(cwd)}": No such directory`,
          ),
        ]);

      if (entries.length === 0) return ok([mkLine("output", "(empty)")]);

      const lines: Line[] = [];
      for (const e of entries) {
        let tag: string;
        let extra = "";
        switch (e.kind) {
          case "dir":
            tag = "[DIR] ";
            break;
          case "app":
            tag = "[APP] ";
            break;
          case "link":
            tag = "[LNK] ";
            break;
          default:
            tag = "[FILE]";
            extra = e.size !== undefined ? `  ${formatSize(e.size)}` : "";
        }
        lines.push(mkLine("output", `  ${tag}  ${e.name}${extra}`));
      }
      lines.push(mkLine("output", ""));
      return ok(lines);
    }

    case "cat": {
      const filePath = args[0];
      if (!filePath) return ok([mkLine("error", "Usage: cat <file>")]);

      const resolved = resolvePath(cwd, filePath);
      if (!resolved) return ok([mkLine("error", `cat: invalid path`)]);
      if (resolved.length === 0)
        return ok([mkLine("error", `cat: "${filePath}": Is a directory`)]);

      const content = await readFile(resolved, isAdmin);
      if (content === null)
        return ok([
          mkLine("error", `cat: "${filePath}": No such file or directory`),
        ]);

      return ok([
        mkLine("output", "─".repeat(40)),
        ...content.split("\n").map((l) => mkLine("output", l)),
        mkLine("output", "─".repeat(40)),
        mkLine("output", ""),
      ]);
    }

    case "whoami":
      return ok([
        mkLine("output", "eele"),
        mkLine("output", ""),
        mkLine("output", "  Role     : Full-stack developer."),
        mkLine("output", "  Location : Germany"),
        mkLine(
          "output",
          "  Interests: TypeScript, self-hosted infra, aviation,",
        ),
        mkLine("output", "             Roblox game dev, web projects"),
        mkLine("output", ""),
      ]);

    case "open": {
      const target = args[0];
      if (!target)
        return ok([
          mkLine("error", "Usage: open <path>  (file, directory, or app id)"),
        ]);

      const resolved = resolvePath(cwd, target);
      if (resolved !== null) {
        const dirEntries = await listDir(resolved, isAdmin);
        if (dirEntries !== null) {
          if (
            resolved.length === 2 &&
            resolved[0].toLowerCase() === "desktop"
          ) {
            const slug = resolved[1];
            try {
              const res = await fetch("/api/projects");
              const projects = (await res.json()) as Array<{
                slug: string;
                title: string;
                githubRepo: string | null;
                githubBranch: string | null;
              }>;
              const project = projects.find(
                (p) => p.slug.toLowerCase() === slug.toLowerCase(),
              );
              if (project?.githubRepo) {
                const [owner, repo] = project.githubRepo.split("/");
                openRepoWindow(
                  `${project.title} — Repository`,
                  { width: 700, height: 520 },
                  {
                    owner,
                    repo,
                    branch: project.githubBranch ?? "",
                    slug: project.slug,
                    projectTitle: project.title,
                  },
                );
                return ok([
                  mkLine("output", `Opening ${project.title} repository...`),
                ]);
              }
            } catch {
              /* fall through */
            }
          }
          openWindow("explorer.exe");
          return ok([mkLine("output", "Opening File Explorer...")]);
        }

        if (resolved.length > 0) {
          const parentEntries = await listDir(resolved.slice(0, -1), isAdmin);
          const nodeName = resolved[resolved.length - 1].toLowerCase();
          const node = parentEntries?.find(
            (e) => e.name.toLowerCase() === nodeName,
          );

          if (node) {
            if (node.kind === "app" && node.appId) {
              openWindow(node.appId);
              return ok([mkLine("output", `Opening ${node.name}...`)]);
            }
            if (node.kind === "link" && node.href) {
              openBrowserWindow(node.href);
              return ok([
                mkLine("output", `Opening ${node.name} in browser...`),
              ]);
            }
            if (node.kind === "file") {
              if (
                resolved[0]?.toLowerCase() === "desktop" &&
                resolved.length >= 2
              ) {
                const slug = resolved[1];
                try {
                  const res = await fetch("/api/projects");
                  const projects = (await res.json()) as Array<{
                    slug: string;
                    title: string;
                    githubRepo: string | null;
                    githubBranch: string | null;
                  }>;
                  const project = projects.find(
                    (p) => p.slug.toLowerCase() === slug.toLowerCase(),
                  );
                  if (project?.githubRepo) {
                    const [owner, repo] = project.githubRepo.split("/");
                    const filePath = resolved
                      .slice(2)
                      .map(encodeURIComponent)
                      .join("/");
                    const branch = project.githubBranch
                      ? `?branch=${encodeURIComponent(project.githubBranch)}`
                      : "";
                    const blobUrl = `/api/github/${owner}/${repo}/blob/${filePath}${branch}`;
                    openTextViewer(node.name, blobUrl);
                    return ok([mkLine("output", `Opening ${node.name}...`)]);
                  }
                } catch {}
              }
              openFileExplorer(resolved.slice(0, -1));
              return ok([mkLine("output", `Opening File Explorer...`)]);
            }
          }
        }
      }

      const app = APPS.find((a) => a.id === target);
      if (app) {
        openWindow(app.id);
        return ok([mkLine("output", `Opening ${app.title}...`)]);
      }

      return ok([
        mkLine(
          "error",
          `open: "${target}": No such file, directory, or application`,
        ),
      ]);
    }

    case "clear":
      return ok([{ id: "__clear__", kind: "output", text: "" }]);

    case "mines":
      openWindow("minesweeper.exe");
      return ok([
        mkLine("output", ""),
        mkLine("output", "Starting Minesweeper..."),
        mkLine("output", "Good luck. You'll need it."),
        mkLine("output", ""),
      ]);

    case "taskmgr":
      openWindow("taskmgr.exe");
      return ok([
        mkLine("output", ""),
        mkLine("output", "Starting Windows Task Manager..."),
        mkLine("output", ""),
      ]);

    case "sudo": {
      const sub = args[0]?.toLowerCase();
      if (sub === "login") {
        showSecurity();
        return ok([
          mkLine("output", ""),
          mkLine("output", "Launching Windows Security..."),
          mkLine("output", ""),
        ]);
      }
      if (sub === "logout") {
        actions.logout?.();
        return ok([
          mkLine("output", ""),
          mkLine("output", "Session terminated. Goodbye, root."),
          mkLine("output", ""),
        ]);
      }
      return ok([
        mkLine("error", `sudo: ${args.join(" ")}: command not found`),
      ]);
    }

    case "mkdir": {
      if (!isAdmin)
        return ok([
          mkLine("error", "mkdir: Access denied. Requires admin session."),
        ]);
      const name = args[0];
      if (!name) return ok([mkLine("error", "Usage: mkdir <name>")]);
      return ok(await createFsNode("mkdir", "folder", name, cwd));
    }

    case "touch": {
      if (!isAdmin)
        return ok([
          mkLine("error", "touch: Access denied. Requires admin session."),
        ]);
      const name = args[0];
      if (!name) return ok([mkLine("error", "Usage: touch <name>")]);
      return ok(await createFsNode("touch", "file", name, cwd));
    }

    case "rm": {
      if (!isAdmin)
        return ok([
          mkLine("error", "rm: Access denied. Requires admin session."),
        ]);
      const name = args[0];
      if (!name) return ok([mkLine("error", "Usage: rm <name>")]);

      const entries = await listDir(cwd, isAdmin);
      const node = entries?.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (!node?.fsId)
        return ok([
          mkLine("error", `rm: "${name}": No such file or directory`),
        ]);

      try {
        const res = await fetch(`/api/fs/${node.fsId}`, { method: "DELETE" });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          return ok([mkLine("error", `rm: ${err.error ?? "Failed"}`)]);
        }
        const data = (await res.json()) as { deleted?: number };
        const count = data.deleted ?? 1;
        return ok([
          mkLine(
            "output",
            `Deleted: ${name}${count > 1 ? ` (${count} items)` : ""}`,
          ),
        ]);
      } catch {
        return ok([mkLine("error", "rm: Network error")]);
      }
    }

    case "ipconfig": {
      try {
        const res = await fetch("/api/skills");
        const skills = (await res.json()) as Array<{ name: string }>;
        if (!skills.length) {
          return ok([
            mkLine("output", "Windows IP Configuration"),
            mkLine("output", ""),
            mkLine(
              "output",
              "  No network adapters found. Add skills via Content Editor.",
            ),
            mkLine("output", ""),
          ]);
        }
        const lines: Line[] = [
          mkLine("output", "Windows IP Configuration"),
          mkLine("output", ""),
          mkLine("output", "Ethernet adapter Local Area Connection:"),
          mkLine("output", ""),
          mkLine("output", "   Connection-specific DNS Suffix: eele14.dev"),
        ];
        skills.forEach((skill, i) => {
          const ip = `${i + 1}.${(i + 1) * 17}.1.${(i + 2) * 7}`;
          lines.push(
            mkLine(
              "output",
              `   IPv4 Address [${skill.name.padEnd(18)}]: ${ip}`,
            ),
          );
        });
        lines.push(mkLine("output", ""));
        return ok(lines);
      } catch {
        return ok([mkLine("error", "Error: could not reach skills API.")]);
      }
    }

    case "tasklist": {
      try {
        const res = await fetch("/api/projects");
        const projects = (await res.json()) as Array<{
          title: string;
          stack: string[];
        }>;
        if (!projects.length) {
          return ok([
            mkLine(
              "output",
              "Image Name                     PID  Session Name   Mem Usage",
            ),
            mkLine("output", "─".repeat(62)),
            mkLine("output", "  No processes."),
            mkLine("output", ""),
          ]);
        }
        const lines: Line[] = [
          mkLine(
            "output",
            "Image Name                     PID  Session Name   Mem Usage",
          ),
          mkLine("output", "─".repeat(62)),
        ];
        projects.forEach((p) => {
          const pid = String(Math.floor(1000 + Math.random() * 8999));
          const mem = `${Math.floor(12 + Math.random() * 200)} MB`;
          const name = (p.title.slice(0, 28) + ".exe").padEnd(31);
          lines.push(mkLine("output", `${name} ${pid}  Console        ${mem}`));
        });
        lines.push(mkLine("output", ""));
        return ok(lines);
      } catch {
        return ok([mkLine("error", "Error: could not reach projects API.")]);
      }
    }

    case "systeminfo":
      return ok([
        mkLine("output", ""),
        mkLine("output", "Host Name:          PORTFOLIO-PC"),
        mkLine("output", "OS Name:            eele14 OS v1.0.0 (Build 2026)"),
        mkLine(
          "output",
          "OS Version:         Next.js 16, React 19, TypeScript 5",
        ),
        mkLine("output", "System Type:        x64-based Developer Machine"),
        mkLine("output", ""),
        mkLine("output", "Owner:              eele, Germany"),
        mkLine(
          "output",
          "Interests:          TypeScript, self-hosted infra, aviation,",
        ),
        mkLine("output", "                    Roblox game dev, full-stack web"),
        mkLine("output", ""),
        mkLine(
          "output",
          "Processor:          Brain running on caffeine and curiosity",
        ),
        mkLine("output", "RAM:                Sufficient (barely)"),
        mkLine("output", ""),
        mkLine("output", "Installed Software:"),
        mkLine("output", "  Runtime           Node.js 22 LTS"),
        mkLine("output", "  Database          PostgreSQL 16 (Prisma ORM)"),
        mkLine("output", "  CDN / Assets      Cloudflare R2"),
        mkLine("output", "  Deployment        Hetzner via Dokploy"),
        mkLine("output", "  Version Control   Git"),
        mkLine("output", ""),
        mkLine("output", "Network:            Connected to DE  (1 Gbps)"),
        mkLine("output", "Uptime:             Continuous since 2024"),
        mkLine("output", ""),
      ]);

    default:
      return ok([
        mkLine(
          "error",
          `'${cmd}' is not recognized as an internal or external command.`,
        ),
      ]);
  }
}
