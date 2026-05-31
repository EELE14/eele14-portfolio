/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  blocked: boolean;
  createdAt: string;
}

export function guestbookFilename(entry: { name: string }): string {
  const safe =
    entry.name
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 20) || "Anonymous";
  return `${safe}.txt`;
}

export function guestbookContent(entry: GuestbookEntry): string {
  const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `From: ${entry.name}\nDate: ${date}\n\n${entry.message}`;
}
