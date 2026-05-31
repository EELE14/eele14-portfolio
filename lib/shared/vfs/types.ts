/* Copyright (c) 2026 eele14. All Rights Reserved. */

export type VFSNodeKind = "dir" | "file" | "link" | "app" | "image";

export interface VFSNode {
  name: string;
  kind: VFSNodeKind;
  fsId?: string;
  appId?: string;
  href?: string;
  iconUrl?: string;
  content?: string;
  size?: number;
}

export interface ProjectRecord {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  imageUrls: string[];
  sourceUrl: string | null;
  liveUrl: string | null;
  githubRepo: string | null;
  githubBranch: string | null;
}

export interface FsNodeRecord {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  content: string | null;
  isPublic: boolean;
}

export interface MessageRecord {
  id: string;
  fromName: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface GitHubEntry {
  name: string;
  type: string;
  size: number;
}
