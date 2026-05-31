/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { SHIP_DEFS } from "@/lib/server/battleship";
import { S } from "../constants";

export default function ShipStatus({
  label,
  sunk,
}: {
  label: string;
  sunk: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={S.label(12)}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {SHIP_DEFS.map((def) => {
          const isSunk = sunk.includes(def.id);
          return (
            <div
              key={def.id}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: def.size }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "10px",
                      height: "10px",
                      background: isSunk
                        ? "var(--color-accent)"
                        : "var(--bg-titlebar)",
                      border: "1px solid var(--color-ink)",
                      opacity: isSunk ? 0.6 : 1,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-system)",
                  color: isSunk ? "var(--color-muted)" : "var(--color-ink)",
                  textDecoration: isSunk ? "line-through" : "none",
                  letterSpacing: "0.03em",
                }}
              >
                {def.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
