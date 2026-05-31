/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useCallback, useEffect, useRef } from "react";
import type { GameEvent } from "@/lib/server/battleship";
import type { ClientMessage } from "../types";

export function useBattleshipWS(
  roomCode: string,
  playerId: string,
  onEvent: (event: GameEvent) => void,
): { send: (msg: ClientMessage) => void; closeWS: () => void } {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const unmounted = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!roomCode || !playerId) return;
    unmounted.current = false;
    retryCount.current = 0;

    function connect() {
      if (unmounted.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/battleship/ws?code=${roomCode}&playerId=${playerId}`,
      );
      wsRef.current = ws;

      ws.onmessage = (e: MessageEvent) => {
        try {
          onEventRef.current(JSON.parse(e.data as string) as GameEvent);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = (e) => {
        if (unmounted.current) return;

        if (e.code === 1000) return;

        const delay = Math.min(500 * 2 ** retryCount.current, 8_000);
        retryCount.current++;
        retryTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {};
    }

    connect();

    return () => {
      unmounted.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      wsRef.current?.close(1000);
      wsRef.current = null;
    };
  }, [roomCode, playerId]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const closeWS = useCallback(() => {
    unmounted.current = true;
    if (retryTimer.current) clearTimeout(retryTimer.current);
    wsRef.current?.close(1000);
    wsRef.current = null;
  }, []);

  return { send, closeWS };
}
