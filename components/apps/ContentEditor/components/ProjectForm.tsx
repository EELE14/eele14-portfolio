/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useState } from "react";
import type { Project } from "../types";
import { fieldStyle, labelStyle, btnPrimary, btnSecondary } from "../constants";
import StackPicker from "./StackPicker";

interface ProjectFormProps {
  editing: Project;
  isNew: boolean;
  saving: boolean;
  err: string;
  onChange: (patch: Partial<Project>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const TEXT_FIELDS: { id: string; label: string; key: keyof Project }[] = [
  { id: "p-slug", label: "Slug", key: "slug" },
  { id: "p-title", label: "Title", key: "title" },
  { id: "p-desc", label: "Description", key: "description" },
  { id: "p-src", label: "Source URL", key: "sourceUrl" },
  { id: "p-live", label: "Live URL", key: "liveUrl" },
  { id: "p-gh", label: "GitHub Repo (owner/repo)", key: "githubRepo" },
  { id: "p-branch", label: "GitHub Branch (optional)", key: "githubBranch" },
];

const SEP = "|||";

function encodeEntry(filename: string, url: string) {
  return `${filename}${SEP}${url}`;
}
function decodeEntry(entry: string): { filename: string; url: string } {
  const idx = entry.indexOf(SEP);
  if (idx === -1) return { filename: "", url: entry };
  return { filename: entry.slice(0, idx), url: entry.slice(idx + SEP.length) };
}

function urlToFilename(url: string): string {
  const seg = url.split("/").pop()?.split("?")[0] ?? "";
  return seg.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
}

function ImageUrlsInput({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [draftUrl, setDraftUrl] = useState("");
  const [draftName, setDraftName] = useState("");

  function handleUrlChange(val: string) {
    setDraftUrl(val);
    if (!draftName) setDraftName(urlToFilename(val));
  }

  function add() {
    const url = draftUrl.trim();
    const name = (draftName.trim() || urlToFilename(url)) + ".png";
    if (!url) return;
    onChange([...urls, encodeEntry(name, url)]);
    setDraftUrl("");
    setDraftName("");
  }

  return (
    <div>
      <label style={labelStyle}>Images:</label>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          marginBottom: "4px",
        }}
      >
        <input
          type="text"
          value={draftUrl}
          placeholder="Image URL (https://…)"
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          style={fieldStyle}
        />
        <div style={{ display: "flex", gap: "4px" }}>
          <input
            type="text"
            value={draftName}
            placeholder="Filename (without .png)"
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={add}
            className="btn"
            style={{
              ...btnPrimary,
              fontSize: "13px",
              padding: "2px 10px",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      </div>
      {urls.map((entry, i) => {
        const { filename, url } = decodeEntry(entry);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 6px",
              border: "1px solid var(--color-muted)",
              marginBottom: "3px",
              background: "white",
            }}
          >
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "12px",
                  color: "var(--color-ink)",
                }}
              >
                {filename}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {url}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              style={{
                fontFamily: "var(--font-system)",
                fontSize: "14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-muted)",
                padding: "0 2px",
                flexShrink: 0,
              }}
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectForm({
  editing,
  isNew,
  saving,
  err,
  onChange,
  onSave,
  onCancel,
}: ProjectFormProps) {
  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflowY: "auto",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "16px",
          marginBottom: "4px",
        }}
      >
        {isNew ? "New Project" : "Edit Project"}
      </span>

      {TEXT_FIELDS.map(({ id, label, key }) => (
        <div key={id}>
          <label htmlFor={id} style={labelStyle}>
            {label}:
          </label>
          {key === "description" ? (
            <textarea
              id={id}
              rows={3}
              value={(editing[key] as string) ?? ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          ) : (
            <input
              id={id}
              type="text"
              value={(editing[key] as string) ?? ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
              style={fieldStyle}
            />
          )}
        </div>
      ))}

      <StackPicker
        selected={editing.stack}
        onChange={(stack) => onChange({ stack })}
      />

      <ImageUrlsInput
        urls={editing.imageUrls}
        onChange={(imageUrls) => onChange({ imageUrls })}
      />

      <div>
        <label htmlFor="p-order" style={labelStyle}>
          Order:
        </label>
        <input
          id="p-order"
          type="number"
          value={editing.order}
          onChange={(e) => onChange({ order: Number(e.target.value) })}
          style={{ ...fieldStyle, width: "80px" }}
        />
      </div>

      {err && (
        <span
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-system)",
            fontSize: "14px",
          }}
        >
          {err}
        </span>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          onClick={onSave}
          disabled={saving}
          className="btn"
          style={btnPrimary}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="btn" style={btnSecondary}>
          Cancel
        </button>
      </div>
    </div>
  );
}
