/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function resolvePath(cwd: string[], raw: string): string[] | null {
  const isAbsolute =
    /^[Cc]:/.test(raw) || raw.startsWith("\\") || raw.startsWith("/");
  const stripped = raw.replace(/^[Cc]:[\\\/]?/, "").replace(/\//g, "\\");
  const parts = stripped.split("\\").filter(Boolean);

  let result = isAbsolute ? [] : [...cwd];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (result.length === 0) return null;
      result = result.slice(0, -1);
    } else {
      result = [...result, part];
    }
  }
  return result;
}

export function formatPath(path: string[]): string {
  return path.length === 0 ? "C:\\" : `C:\\${path.join("\\")}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function tokenise(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of input) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === " " && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}
