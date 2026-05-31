/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { createServer } from "http";
import next from "next";
import { createBareServer } from "@tomphttp/bare-server-node";
import { WebSocketServer } from "ws";
import { guardHttp, guardWs } from "./lib/server/bare-guards";
import {
  subscribe,
  unsubscribe,
  getRoom,
  submitBoard,
  fireShot,
} from "./lib/server/battleship";
import type { PlacedShip } from "./lib/server/battleship";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, turbo: dev });
const handle = app.getRequestHandler();
const bare = createBareServer("/bare/", {
  logErrors: false,
  connectionLimiter: {
    maxConnectionsPerIP: 500,
    windowDuration: 60,
    blockDuration: 1,
  },
});

app.prepare().then(() => {
  const upgradeHandler = app.getUpgradeHandler();

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const code = url.searchParams.get("code")?.toUpperCase() ?? "";
    const pid = url.searchParams.get("playerId") ?? "";
    const room = getRoom(code);

    if (!room || !room.players.some((p) => p?.id === pid)) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Room not found or player not registered",
        }),
      );
      ws.close(1008);
      return;
    }

    subscribe(code, pid, ws);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          type: string;
          ships?: PlacedShip[];
          row?: number;
          col?: number;
        };
        if (msg.type === "ready" && Array.isArray(msg.ships)) {
          submitBoard(code, pid, msg.ships);
        } else if (msg.type === "fire" && msg.row != null && msg.col != null) {
          fireShot(code, pid, msg.row, msg.col);
        }
      } catch {
        /* ignore malformed messages */
      }
    });

    ws.on("close", () => unsubscribe(code, pid));
  });

  const server = createServer((req, res) => {
    if (bare.shouldRoute(req)) {
      guardHttp(req, res)
        .then((ok) => {
          if (!ok) return;
          delete req.headers["x-portfolio-auth"];
          bare.routeRequest(req, res);
        })
        .catch((err) => {
          console.error("[bare] unhandled error", err);
          res.writeHead(500).end();
        });
    } else {
      void handle(req, res);
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host}`)
      .pathname;

    if (pathname === "/api/battleship/ws") {
      wss.handleUpgrade(req, socket, head, (ws) =>
        wss.emit("connection", ws, req),
      );
    } else if (bare.shouldRoute(req)) {
      guardWs(req, socket)
        .then((ok) => {
          if (!ok) return;
          delete req.headers["x-portfolio-auth"];
          bare.routeUpgrade(req, socket, head);
        })
        .catch((err) => {
          console.error("[bare] ws unhandled error", err);
          socket.destroy();
        });
    } else {
      upgradeHandler(req, socket, head);
    }
  });

  server.listen(port, () => console.log(`> Ready on http://localhost:${port}`));
});
