/* Copyright (c) 2026 eele14. All Rights Reserved. */

export type Tab = "bio" | "projects" | "skills" | "guestbook";

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

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  blocked: boolean;
  createdAt: string;
}
