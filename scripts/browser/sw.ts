/* Copyright (c) 2026 eele14. All Rights Reserved. */

const swSelf = self as unknown as ServiceWorkerGlobalScope;

const _nativeFetch: typeof fetch = swSelf.fetch.bind(swSelf);
let __bareToken: string | null = null;
let __tokenFlight: Promise<void> | null = null;

function refreshToken(): Promise<void> {
  if (__tokenFlight) return __tokenFlight;
  __tokenFlight = (async () => {
    try {
      const res = await _nativeFetch("/api/bare-token");
      const data = (await res.json()) as { token?: string };
      __bareToken = data.token ?? null;
    } catch {}
  })().finally(() => {
    __tokenFlight = null;
  });
  return __tokenFlight;
}

async function fetchBare(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string,
): Promise<Response> {
  const headers = new Headers(
    input instanceof Request ? input.headers : (init?.headers ?? {}),
  );
  headers.set("X-Portfolio-Auth", token);
  if (input instanceof Request)
    return _nativeFetch(new Request(input, { headers }));
  return _nativeFetch(input, { ...init, headers });
}

(swSelf as unknown as { fetch: typeof fetch }).fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;

  if (!url?.includes("/bare/")) return _nativeFetch(input, init);

  if (!__bareToken) await refreshToken();
  if (!__bareToken) return _nativeFetch(input, init);

  const res = await fetchBare(input, init, __bareToken);
  if (res.status !== 401) return res;

  __bareToken = null;
  await refreshToken();
  if (!__bareToken) return res;

  return fetchBare(input, init, __bareToken);
};

importScripts("uv.bundle.js");
importScripts("uv.config.js");
importScripts(__uv$config.sw ?? "uv.sw.js");

const uvSw = new UVServiceWorker();

swSelf.addEventListener("install", () => swSelf.skipWaiting());
swSelf.addEventListener("activate", (event) =>
  (event as ExtendableEvent).waitUntil(swSelf.clients.claim()),
);
swSelf.addEventListener("message", (event) => {
  const msg = event as ExtendableMessageEvent;
  if (msg.data?.type === "bare-token") __bareToken = msg.data.token as string;
});
swSelf.addEventListener("fetch", (event) => {
  const fe = event as FetchEvent;
  fe.respondWith(uvSw.fetch(fe));
});
