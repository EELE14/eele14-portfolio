/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: https://eele14.dev/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
