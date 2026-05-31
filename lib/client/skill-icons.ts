/* Copyright (c) 2026 eele14. All Rights Reserved. */

// put into public/icons
// reference as /icons/{name}.svg
export const LOCAL_ICONS = [
  "bunjs",
  "cloudflare",
  "css",
  "discordjs",
  "docker",
  "dokploy",
  "git",
  "html",
  "java",
  "linux",
  "mongodb",
  "nextjs",
  "nginx",
  "nodejs",
  "npmjs",
  "postgresql",
  "python",
  "react",
  "redis",
  "sqlite",
  "tailwind",
  "typescript",
  "vite",
  "roblox",
  "roblox-ts",
  "luau",
  "swift",
] as const;

export type LocalIconSlug = (typeof LOCAL_ICONS)[number];

export function getLocalIconUrl(slug: string): string {
  return `/icons/${slug}.svg`;
}
