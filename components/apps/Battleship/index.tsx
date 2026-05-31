/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  SHIP_DEFS,
  type PlacedShip,
  type ClientRoom,
  type GameEvent,
} from "@/lib/server/battleship";
import { useDesktopStore } from "@/store/windowStore";
import { S } from "./constants";
import { useBattleshipWS } from "./hooks/useBattleshipWS";
import { useAudio } from "./hooks/useAudio";
import VolumeControl from "./components/VolumeControl";
import MenuPhase from "./phases/MenuPhase";
import LobbyPhase from "./phases/LobbyPhase";
import PlacingPhase from "./phases/PlacingPhase";
import PlayingPhase from "./phases/PlayingPhase";
import FinishedPhase from "./phases/FinishedPhase";
import type { UIPhase } from "./types";

function readSession(): { code: string; pid: string } {
  if (typeof window === "undefined") return { code: "", pid: "" };
  try {
    const saved = sessionStorage.getItem("battleship-session");
    if (saved) {
      const { code, pid } = JSON.parse(saved) as { code: string; pid: string };
      if (code && pid) return { code, pid };
    }
  } catch {
    // malformed entry
  }
  return { code: "", pid: "" };
}

export default function Battleship() {
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);
  const [gameRoom, setGameRoom] = useState<ClientRoom | null>(null);
  const [placedShips, setPlacedShips] = useState<Map<string, PlacedShip>>(
    new Map(),
  );
  const [roomCode, setRoomCode] = useState(() => readSession().code);
  const [playerId, setPlayerId] = useState(() => readSession().pid);
  const [joinInput, setJoinInput] = useState("");
  const [status, setStatus] = useState("");
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const uiPhase: UIPhase = useMemo(() => {
    if (!gameRoom) return "menu";
    if (gameRoom.phase === "waiting") return "lobby";
    if (gameRoom.phase === "placing") return "placing";
    if (gameRoom.phase === "playing") return "playing";
    return "finished";
  }, [gameRoom]);

  const isMyTurn =
    gameRoom?.phase === "playing" && gameRoom.turn === gameRoom.playerIndex;

  const [volume, setVolume] = useState(0.7);
  const playSfx = useAudio(uiPhase, volume);

  const handleEvent = useCallback(
    (event: GameEvent) => {
      switch (event.type) {
        case "room_state": {
          const r = event.room;
          setGameRoom(r);
          if (r.phase === "placing" && r.myShips.length > 0) {
            const m = new Map<string, PlacedShip>();
            for (const ship of r.myShips) m.set(ship.id, ship);
            setPlacedShips(m);
            if (r.myReady) setIsReady(true);
          }
          if (r.phase === "playing") {
            setStatus(
              r.turn === r.playerIndex
                ? "Your turn — fire!"
                : "Opponent's turn.",
            );
            setStatusOk(null);
          }
          break;
        }
        case "opponent_joined":
          setGameRoom((prev) =>
            prev
              ? { ...prev, phase: "placing", opponentConnected: true }
              : null,
          );
          setStatus("Opponent connected. Place your ships.");
          setStatusOk(null);
          break;
        case "opponent_ready":
          setStatus("Opponent is ready and waiting.");
          setStatusOk(null);
          break;
        case "game_start":
          setGameRoom(event.room);
          setStatus(
            event.turn === event.room.playerIndex
              ? "Your turn — fire!"
              : "Opponent's turn.",
          );
          setStatusOk(null);
          break;
        case "move_result":
          playSfx(event.hit ? "hit" : "miss");
          setLoading(false);
          setGameRoom(event.room);
          if (event.sunk) {
            setStatus(
              event.hit
                ? `Hit! ${event.sunk.toUpperCase()} sunk!`
                : `Miss. Opponent's turn.`,
            );
            setStatusOk(event.hit);
          } else {
            setStatus(event.hit ? "Hit!" : "Miss.");
            setStatusOk(event.hit);
          }
          if (event.room.phase === "playing") {
            setTimeout(() => {
              setStatus(
                event.room.turn === event.room.playerIndex
                  ? "Your turn — fire!"
                  : "Opponent's turn.",
              );
              setStatusOk(null);
            }, 1500);
          }
          break;
        case "game_over":
          playSfx(event.winner === event.room.playerIndex ? "win" : "lose");
          setGameRoom(event.room);
          setStatus(
            event.winner === event.room.playerIndex ? "Victory!" : "Defeat.",
          );
          setStatusOk(event.winner === event.room.playerIndex);
          break;
        case "opponent_left":
          setStatus("Opponent disconnected.");
          setStatusOk(false);
          break;
        case "opponent_rejoined":
          setStatus("Opponent reconnected.");
          setStatusOk(true);
          break;
        case "error":
          setError(event.message);
          setRoomCode("");
          setPlayerId("");
          sessionStorage.removeItem("battleship-session");
          break;
      }
    },
    [playSfx],
  );

  const { send: wsSend, closeWS } = useBattleshipWS(
    roomCode,
    playerId,
    handleEvent,
  );

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/battleship/rooms", { method: "POST" });
      const data = (await res.json()) as {
        code: string;
        playerId: string;
        room: ClientRoom;
      };
      sessionStorage.setItem(
        "battleship-session",
        JSON.stringify({ code: data.code, pid: data.playerId }),
      );
      setRoomCode(data.code);
      setPlayerId(data.playerId);
      setGameRoom(data.room);
      setStatus("Waiting for opponent...");
    } catch {
      setError("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJoin = useCallback(async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Room code must be 4 letters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/battleship/rooms/${code}/join`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        playerId?: string;
        room?: ClientRoom;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to join room.");
        return;
      }
      sessionStorage.setItem(
        "battleship-session",
        JSON.stringify({ code, pid: data.playerId! }),
      );
      setRoomCode(code);
      setPlayerId(data.playerId!);
      if (data.room) setGameRoom(data.room);
      setStatus("Joined. Place your ships.");
    } catch {
      setError("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  }, [joinInput]);

  const handleReady = useCallback(() => {
    if (!SHIP_DEFS.every((def) => placedShips.has(def.id)) || isReady) return;
    const ships = Array.from(placedShips.values());
    wsSend({ type: "ready", ships });
    setIsReady(true);
    setStatus("Ready! Waiting for opponent...");
    setStatusOk(null);
  }, [isReady, placedShips, wsSend]);

  const handleFire = useCallback(
    (row: number, col: number) => {
      if (!isMyTurn || loading || !gameRoom) return;
      if (gameRoom.opponentBoard[row][col].hit) return;
      setLoading(true); // cleared when move_result arrives
      wsSend({ type: "fire", row, col });
    },
    [isMyTurn, loading, gameRoom, wsSend],
  );

  const handleReset = useCallback(() => {
    closeWS();
    sessionStorage.removeItem("battleship-session");
    setGameRoom(null);
    setPlacedShips(new Map());
    setRoomCode("");
    setPlayerId("");
    setJoinInput("");
    setStatus("");
    setError("");
    setIsReady(false);
    setLoading(false);
  }, [closeWS]);

  const showReset = uiPhase !== "menu";
  const turnIndicator =
    gameRoom?.phase === "playing"
      ? isMyTurn
        ? "[ YOUR TURN ]"
        : "[ WAITING ]"
      : null;

  return (
    <div
      style={S.wrap}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const items = [];
        if (uiPhase !== "menu") {
          items.push({ label: "New Game", onClick: handleReset });
        }
        if (uiPhase === "playing") {
          items.push({
            label: "Surrender",
            onClick: handleReset,
            danger: true,
          });
        }
        if (items.length === 0) return;
        showContextMenu(e.clientX, e.clientY, items);
      }}
    >
      <div style={S.toolbar}>
        {roomCode && (
          <span
            style={{
              fontSize: "14px",
              fontFamily: "var(--font-system)",
              color: "var(--color-muted)",
              letterSpacing: "0.08em",
            }}
          >
            ROOM:{" "}
            <strong style={{ color: "var(--color-ink)" }}>{roomCode}</strong>
          </span>
        )}
        {turnIndicator && (
          <span
            style={{
              fontSize: "14px",
              fontFamily: "var(--font-system)",
              color: isMyTurn ? "var(--color-teal)" : "var(--color-muted)",
              letterSpacing: "0.05em",
            }}
          >
            {turnIndicator}
          </span>
        )}
        <span style={S.status(statusOk ?? undefined)}>
          {status || (uiPhase === "menu" ? "Select an option to start." : "")}
        </span>
        {error && (
          <span
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              color: "var(--color-accent)",
            }}
          >
            {error}
          </span>
        )}
        <VolumeControl volume={volume} onVolumeChange={setVolume} />
        {showReset && (
          <button
            className="btn"
            style={S.btn(false, false)}
            onClick={handleReset}
          >
            QUIT
          </button>
        )}
      </div>

      <div style={S.body}>
        {uiPhase === "menu" && (
          <MenuPhase
            error={error}
            loading={loading}
            joinInput={joinInput}
            onJoinInputChange={setJoinInput}
            onCreate={handleCreate}
            onJoin={handleJoin}
          />
        )}
        {uiPhase === "lobby" && (
          <LobbyPhase roomCode={roomCode} onCancel={handleReset} />
        )}
        {uiPhase === "placing" && gameRoom && (
          <PlacingPhase
            gameRoom={gameRoom}
            placedShips={placedShips}
            setPlacedShips={setPlacedShips}
            isReady={isReady}
            loading={loading}
            onReady={handleReady}
          />
        )}
        {uiPhase === "playing" && gameRoom && (
          <PlayingPhase
            gameRoom={gameRoom}
            isMyTurn={isMyTurn}
            loading={loading}
            onFire={handleFire}
          />
        )}
        {uiPhase === "finished" && gameRoom && (
          <FinishedPhase gameRoom={gameRoom} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
