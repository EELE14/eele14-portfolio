/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useEffect, useState } from "react";
import { fieldStyle, labelStyle, btnPrimary } from "../constants";

export default function BioTab() {
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    fetch("/api/bio")
      .then((r) => r.json())
      .then((d: { bio?: string }) => setBio(d.bio ?? ""))
      .catch(() => {});
  }, []);

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/bio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px 16px",
      }}
    >
      <label htmlFor="bio-field" style={labelStyle}>
        Bio text (shown in about.txt):
      </label>
      <textarea
        id="bio-field"
        value={bio}
        onChange={(e) => {
          setBio(e.target.value);
          setStatus("idle");
        }}
        rows={10}
        style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={save}
          disabled={status === "saving"}
          className="btn"
          style={btnPrimary}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && (
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              color: "var(--color-teal)",
            }}
          >
            Saved.
          </span>
        )}
        {status === "error" && (
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              color: "var(--color-accent)",
            }}
          >
            Save failed.
          </span>
        )}
      </div>
    </div>
  );
}
