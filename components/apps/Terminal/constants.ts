/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Line } from "./types";

let lineCounter = 0;

export function mkLine(kind: Line["kind"], text: string): Line {
  return { id: String(lineCounter++), kind, text };
}

export function makeWelcome(isAdmin: boolean): Line[] {
  return [
    mkLine("output", "Microsoft(R) Portfolio Shell v1.0.0"),
    mkLine("output", "Copyright (C) 2026 eele14. All Rights Reserved."),
    mkLine("output", ""),
    mkLine(
      "output",
      isAdmin
        ? "Logged in as: root, full filesystem access enabled."
        : 'Type "help" for available commands.',
    ),
    mkLine(
      "output",
      isAdmin
        ? 'Type "sudo logout" to end session.'
        : 'Type "sudo login" to elevate privileges.',
    ),
    mkLine("output", ""),
  ];
}
