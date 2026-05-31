/* Copyright (c) 2026 eele14. All Rights Reserved. */

const BINARY_EXTENSIONS = new Set([
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".ico",
  ".tiff",
  ".tif",
  ".avif",
  ".heic",
  ".heif",
  ".raw",
  // Video
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
  ".flv",
  ".wmv",
  ".m4v",
  ".ogv",
  // Audio
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",
  ".opus",
  ".wma",
  // Fonts
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  // Archives
  ".zip",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".7z",
  ".rar",
  ".br",
  ".zst",
  // Executables & compiled
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".pkg",
  ".deb",
  ".rpm",
  ".msi",
  ".o",
  ".a",
  ".pyc",
  ".class",
  ".jar",
  ".war",
  ".wasm",
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  // Databases
  ".db",
  ".sqlite",
  ".sqlite3",
]);

export function isBinary(filename: string): boolean {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return false;
  return BINARY_EXTENSIONS.has(filename.slice(dot).toLowerCase());
}
