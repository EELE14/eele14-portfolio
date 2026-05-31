/* Copyright (c) 2026 eele14. All Rights Reserved. */

declare const i: Window & typeof globalThis;
declare const c: { sourceUrl: (url: string) => string };

void (function () {
  if ("serviceWorker" in i.navigator) {
    try {
      const s: ServiceWorkerContainer = {
        register() {
          return Promise.reject(new Error("SW unavailable in proxy"));
        },
        ready: new Promise<ServiceWorkerRegistration>(() => {}),
        controller: null,
        getRegistration() {
          return Promise.resolve(undefined);
        },
        getRegistrations() {
          return Promise.resolve([]);
        },
        startMessages() {},
        addEventListener:
          (() => {}) as ServiceWorkerContainer["addEventListener"],
        removeEventListener:
          (() => {}) as ServiceWorkerContainer["removeEventListener"],
        dispatchEvent: (() => false) as ServiceWorkerContainer["dispatchEvent"],
        oncontrollerchange: null,
        onmessage: null,
        onmessageerror: null,
      };
      Object.defineProperty(i.Navigator.prototype, "serviceWorker", {
        get() {
          return s;
        },
        configurable: true,
        enumerable: true,
      });
    } catch {}
  }

  try {
    (i as unknown as { open: (url?: string) => null }).open = function (url) {
      if (!url) return null;
      try {
        let d = String(url);
        try {
          d = c.sourceUrl(d);
        } catch {}
        window.top?.postMessage({ type: "browser-open-tab", value: d }, "*");
      } catch {}
      return null;
    };
  } catch {}

  try {
    document.addEventListener(
      "click",
      function (e) {
        let el = e.target as HTMLElement | null;
        while (el && el.tagName !== "A") el = el.parentElement;
        if (!el) return;
        const anchor = el as HTMLAnchorElement;
        if (!anchor.target) return;
        const t = anchor.target;
        if (t !== "_blank" && t !== "_top" && t !== "_parent") return;
        e.preventDefault();
        e.stopPropagation();
        try {
          const h = anchor.href || "";
          if (!h || h.startsWith("javascript:")) return;
          const tp = t === "_blank" ? "browser-open-tab" : "browser-navigate";
          window.top?.postMessage({ type: tp, value: h }, "*");
        } catch {}
      },
      true,
    );
  } catch {}
})();
