/* Copyright (c) 2026 eele14. All Rights Reserved. */

export default function SwErrorPanel({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "var(--font-system)",
        color: "var(--color-ink)",
      }}
    >
      <div
        style={{
          border: "2px solid var(--color-ink)",
          boxShadow: "3px 3px 0 var(--color-ink)",
          padding: 20,
          maxWidth: 480,
        }}
      >
        <div
          style={{
            background: "var(--color-accent)",
            color: "white",
            padding: "4px 12px",
            fontSize: 20,
            marginBottom: 14,
          }}
        >
          SERVICE WORKER ERROR
        </div>
        <p
          style={{
            fontSize: 16,
            fontFamily: "var(--font-body)",
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          Browser.exe requires a secure context (HTTPS or localhost) and a
          browser that supports Service Workers.
        </p>
        <p
          style={{
            fontSize: 14,
            fontFamily: "var(--font-body)",
            color: "var(--color-muted)",
            wordBreak: "break-all",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
