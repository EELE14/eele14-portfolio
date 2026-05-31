/* Copyright (c) 2026 eele14. All Rights Reserved. */

interface UVConfig {
  prefix: string;
  bare: string;
  encodeUrl: (str: string) => string;
  decodeUrl: (str: string) => string;
  handler: string;
  client: string;
  bundle: string;
  config: string;
  sw: string;
}

declare class UVServiceWorker {
  fetch(event: FetchEvent): Promise<Response>;
}

declare let __uv$config: UVConfig;
