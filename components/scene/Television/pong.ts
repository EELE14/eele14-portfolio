/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { PICTURE } from "./screen";
import { sfxPong } from "../sfx";

const { W, H } = PICTURE;
const PADDLE_H = 42;
const PADDLE_W = 6;
const BALL = 6;
const PLAYER_X = 12;
const AI_X = W - 12 - PADDLE_W;
const PLAYER_SPEED = 150;
const AI_SPEED = 95;
const SERVE_SPEED = 130;

export interface PongState {
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  player: number;
  ai: number;
  scoreL: number;
  scoreR: number;
}

const UP_KEYS = ["KeyW", "ArrowUp"];
const DOWN_KEYS = ["KeyS", "ArrowDown"];
export const PONG_KEYS = new Set([...UP_KEYS, ...DOWN_KEYS]);

function serve(state: PongState, toLeft: boolean) {
  state.ballX = W / 2;
  state.ballY = H / 2;
  state.vx = toLeft ? -SERVE_SPEED : SERVE_SPEED;
  state.vy = (state.ballY % 2 ? 1 : -1) * SERVE_SPEED * 0.4;
}

export function freshPong(): PongState {
  const state = {
    ballX: 0,
    ballY: 0,
    vx: 0,
    vy: 0,
    player: H / 2,
    ai: H / 2,
    scoreL: 0,
    scoreR: 0,
  };
  serve(state, false);
  return state;
}

function paddleClamp(y: number): number {
  return Math.min(H - PADDLE_H / 2, Math.max(PADDLE_H / 2, y));
}

function bounceOffPaddle(state: PongState, paddleY: number, dir: 1 | -1) {
  state.vx = dir * Math.min(Math.abs(state.vx) * 1.05, 280);
  state.vy += ((state.ballY - paddleY) / (PADDLE_H / 2)) * 70;
}

export function stepPong(state: PongState, pressed: Set<string>, dt: number) {
  const up = UP_KEYS.some((k) => pressed.has(k));
  const down = DOWN_KEYS.some((k) => pressed.has(k));
  state.player = paddleClamp(
    state.player + (Number(down) - Number(up)) * PLAYER_SPEED * dt,
  );

  const chase = Math.max(
    -AI_SPEED * dt,
    Math.min(AI_SPEED * dt, state.ballY - state.ai),
  );
  state.ai = paddleClamp(state.ai + chase);

  state.ballX += state.vx * dt;
  state.ballY += state.vy * dt;
  if (state.ballY < BALL / 2 || state.ballY > H - BALL / 2) {
    state.vy *= -1;
    state.ballY = Math.min(H - BALL / 2, Math.max(BALL / 2, state.ballY));
    sfxPong("wall");
  }
  const hitsPlayer =
    state.ballX - BALL / 2 <= PLAYER_X + PADDLE_W &&
    state.vx < 0 &&
    Math.abs(state.ballY - state.player) <= PADDLE_H / 2 + BALL / 2;
  const hitsAi =
    state.ballX + BALL / 2 >= AI_X &&
    state.vx > 0 &&
    Math.abs(state.ballY - state.ai) <= PADDLE_H / 2 + BALL / 2;
  if (hitsPlayer || hitsAi) {
    bounceOffPaddle(state, hitsPlayer ? state.player : state.ai, hitsPlayer ? 1 : -1);
    sfxPong("paddle");
  } else if (state.ballX < -BALL) {
    state.scoreR += 1;
    serve(state, true);
    sfxPong("score");
  } else if (state.ballX > W + BALL) {
    state.scoreL += 1;
    serve(state, false);
    sfxPong("score");
  }
}

export function drawPong(
  ctx: CanvasRenderingContext2D,
  s: PongState,
  live: boolean,
) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3a3a3a";
  for (let y = 4; y < H; y += 14) ctx.fillRect(W / 2 - 1, y, 2, 8);
  ctx.fillStyle = "#e8e8e8";
  ctx.textAlign = "center";
  ctx.font = "20px 'Courier New', monospace";
  ctx.fillText(String(s.scoreL), W / 2 - 32, 24);
  ctx.fillText(String(s.scoreR), W / 2 + 32, 24);
  ctx.fillRect(PLAYER_X, s.player - PADDLE_H / 2, PADDLE_W, PADDLE_H);
  ctx.fillRect(AI_X, s.ai - PADDLE_H / 2, PADDLE_W, PADDLE_H);
  ctx.fillRect(s.ballX - BALL / 2, s.ballY - BALL / 2, BALL, BALL);
  if (!live) {
    ctx.fillStyle = "#7d7d7d";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText("w/s to play", W / 2, H - 10);
  }
}
