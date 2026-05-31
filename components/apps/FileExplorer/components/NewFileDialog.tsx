/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useState } from "react";

interface GuestbookEntry {
  name: string;
}

interface NewFileDialogProps {
  guestbookEntries: GuestbookEntry[] | null;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function NewFileDialog({
  guestbookEntries,
  onClose,
  onConfirm,
}: NewFileDialogProps) {
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    const name = nameInput.trim();
    if (!name) {
      setError("Name cannot be empty.");
      return;
    }
    if (name.length > 40) {
      setError("Name must be 40 characters or fewer.");
      return;
    }
    if (!/^[a-zA-Z0-9 '_\-]+$/.test(name)) {
      setError("Only letters, numbers, spaces, hyphens, underscores, and apostrophes allowed.");
      return;
    }
    const duplicate = (guestbookEntries ?? []).some(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setError("An entry with that name already exists.");
      return;
    }
    onConfirm(name);
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--bg-window)",
          border: "2px solid var(--color-ink)",
          boxShadow: "4px 4px 0 var(--color-ink)",
          padding: "16px",
          width: "300px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "17px",
            marginBottom: "12px",
          }}
        >
          Sign the Guestbook
        </div>

        <label
          htmlFor="gb-new-name"
          style={{
            display: "block",
            fontFamily: "var(--font-system)",
            fontSize: "14px",
            marginBottom: "4px",
          }}
        >
          Your name:
        </label>
        <input
          id="gb-new-name"
          autoFocus
          type="text"
          maxLength={40}
          value={nameInput}
          onChange={(e) => { setNameInput(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") onClose();
          }}
          style={{
            width: "100%",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            border: "2px solid var(--color-ink)",
            padding: "3px 6px",
            background: "white",
            color: "var(--color-ink)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-muted)",
            marginTop: "3px",
          }}
        >
          {40 - nameInput.length} chars left
        </div>
        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-accent)",
              margin: "6px 0 0",
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            marginTop: "14px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              padding: "3px 14px",
              border: "2px solid var(--color-ink)",
              background: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn"
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              padding: "3px 14px",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              background: "var(--color-ink)",
              color: "var(--bg-window)",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
