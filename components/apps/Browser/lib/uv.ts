/* Copyright (c) 2026 eele14. All Rights Reserved. */

type UvConfig = {
  prefix: string;
  encodeUrl: (u: string) => string;
  decodeUrl: (u: string) => string;
};

function getUvConfig(): UvConfig | undefined {
  return (window as unknown as Record<string, unknown>).__uv$config as
    | UvConfig
    | undefined;
}

export function injectUvScripts(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (getUvConfig()) {
      resolve();
      return;
    }
    const bundle = document.createElement("script");
    bundle.src = "/uv/uv.bundle.js";
    bundle.onload = () => {
      const config = document.createElement("script");
      config.src = "/uv/uv.config.js";
      config.onload = () => resolve();
      config.onerror = () => reject(new Error("Failed to load uv.config.js"));
      document.head.appendChild(config);
    };
    bundle.onerror = () => reject(new Error("Failed to load uv.bundle.js"));
    document.head.appendChild(bundle);
  });
}

export function encodeForUv(rawUrl: string): string {
  const cfg = getUvConfig()!;
  let url = rawUrl.trim();
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(url)) {
      url = "https://duckduckgo.com/?q=" + encodeURIComponent(url);
    } else if (url.includes(".") && !url.includes(" ")) {
      url = "https://" + url;
    } else {
      url = "https://duckduckgo.com/?q=" + encodeURIComponent(url);
    }
  }
  return cfg.prefix + cfg.encodeUrl(url);
}

export function decodeFromUv(href: string): string | null {
  const cfg = getUvConfig();
  if (!cfg) return null;
  const full = window.location.origin + cfg.prefix;
  if (!href.startsWith(full)) return null;
  try {
    return cfg.decodeUrl(href.slice(full.length));
  } catch {
    return null;
  }
}
