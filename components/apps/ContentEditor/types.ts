/* Copyright (c) 2026 eele14. All Rights Reserved. */

export type { GuestbookEntry } from "@/lib/shared/guestbook";

export type Tab = "bio" | "projects" | "skills" | "guestbook" | "bans";

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  stack: string[];
  imageUrls: string[];
  sourceUrl?: string;
  liveUrl?: string;
  githubRepo?: string;
  githubBranch?: string;
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  icon?: string | null;
}

export interface IpBan {
  network: string;
  reason: string;
  createdAt: string;
}

export interface GuestbookBlock {
  ip: string;
  reason: string;
  createdAt: string;
  entryCount: number;
}
