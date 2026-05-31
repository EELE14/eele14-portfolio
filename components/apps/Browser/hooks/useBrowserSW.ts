/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useEffect, useState } from "react";
import { injectUvScripts } from "../lib/uv";

async function sendBareToken(): Promise<void> {
  const res = await fetch("/api/bare-token");
  const data = (await res.json()) as { token?: string };
  if (data.token && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "bare-token",
      token: data.token,
    });
  }
}

export function useBrowserSW(): { swReady: boolean; swError: string | null } {
  const [swReady, setSwReady] = useState(false);
  const [swError, setSwError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setSwError("Service workers are not supported in this browser.");
      return;
    }
    injectUvScripts()
      .then(() =>
        navigator.serviceWorker.register("/uv/sw.js", {
          scope: "/uv/service/",
        }),
      )
      .then((reg) => {
        if (reg.active) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("SW activation timed out")),
            10_000,
          );
          const sw = reg.installing ?? reg.waiting;
          if (!sw) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          const onStateChange = function (this: ServiceWorker) {
            if (this.state === "activated") {
              clearTimeout(timeout);
              this.removeEventListener("statechange", onStateChange);
              resolve();
            }
          };
          sw.addEventListener("statechange", onStateChange);
        });
      })
      .then(() => sendBareToken())
      .then(() => setSwReady(true))
      .catch((err: unknown) => {
        setSwError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return { swReady, swError };
}
