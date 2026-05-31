/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest } from "next/server";

const UPSTREAM = "https://ai.eele14.dev/completion";
const TIMEOUT_MS = 60_000;
const MAX_PROMPT = 500;

// single inference at pi
let busy = false;

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.LLAMA_API_KEY;
  if (!apiKey) {
    return json({ error: "AI not configured" }, 503);
  }

  let prompt: string;
  try {
    const body = (await req.json()) as { prompt?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return json({ error: "prompt is required" }, 400);
    }
    prompt = body.prompt.trim().slice(0, MAX_PROMPT);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (busy) {
    return json({ error: "AI is busy, try again in a moment." }, 429);
  }
  busy = true;

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        prompt: `Q: ${prompt}`,
        n_predict: 150,
        temperature: 0.8,
        stop: ["\n\n"],
        stream: true,
      }),
      signal: abort.signal,
    });

    if (upstream.status === 429) {
      clearTimeout(timeout);
      busy = false;
      return json({ error: "Upstream rate limit, try again later." }, 429);
    }
    if (!upstream.ok || !upstream.body) {
      clearTimeout(timeout);
      busy = false;
      return json({ error: "Upstream error" }, 502);
    }

    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async pull(ctrl) {
        const { done, value } = await reader.read();
        if (done) {
          ctrl.close();
          clearTimeout(timeout);
          busy = false;
        } else {
          ctrl.enqueue(value);
        }
      },
      cancel() {
        clearTimeout(timeout);
        busy = false;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    busy = false;
    if (err instanceof Error && err.name === "AbortError") {
      return json({ error: "Request timed out (60 s)." }, 504);
    }
    return json({ error: "Failed to reach AI" }, 502);
  }
}

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
