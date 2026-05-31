/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { LOCAL_ICONS, getLocalIconUrl } from "@/lib/client/skill-icons";
import type { Skill } from "../types";
import { fieldStyle, labelStyle, btnPrimary } from "../constants";

interface IconPickerProps {
  current: string | null | undefined;
  onPick: (slug: string | null) => void;
  onClose: () => void;
}

function IconPicker({ current, onPick, onClose }: IconPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        zIndex: 200,
        background: "var(--bg-window)",
        border: "2px solid var(--color-ink)",
        boxShadow: "3px 3px 0 var(--color-ink)",
        padding: "6px",
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        width: "232px",
      }}
    >
      <button
        title="No icon"
        onClick={() => {
          onPick(null);
          onClose();
        }}
        style={{
          width: "28px",
          height: "28px",
          border:
            current == null
              ? "2px solid var(--color-accent)"
              : "1px solid var(--color-muted)",
          background: "var(--bg-window)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-system)",
          fontSize: "12px",
          color: "var(--color-muted)",
        }}
      >
        ×
      </button>

      {LOCAL_ICONS.map((slug) => (
        <button
          key={slug}
          title={slug}
          onClick={() => {
            onPick(slug);
            onClose();
          }}
          style={{
            width: "28px",
            height: "28px",
            border:
              current === slug
                ? "2px solid var(--color-accent)"
                : "1px solid transparent",
            background: "var(--bg-window)",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={getLocalIconUrl(slug)}
            alt={slug}
            width={20}
            height={20}
            style={{ objectFit: "contain" }}
          />
        </button>
      ))}
    </div>
  );
}

export default function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState({ name: "", icon: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [pickerOpen, setPickerOpen] = useState<string | "new" | null>(null);

  function load() {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d: Skill[]) => setSkills(d))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, icon: form.icon || null }),
      });
      if (res.ok) {
        setForm({ name: "", icon: "" });
        load();
      } else {
        setErr("Add failed.");
      }
    } catch {
      setErr("Network error.");
    }
    setSaving(false);
  }

  async function deleteSkill(id: string) {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    load();
  }

  async function setIcon(id: string, icon: string | null) {
    await fetch(`/api/skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon }),
    });
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, icon } : s)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Add form */}
      <form
        onSubmit={(e) => void addSkill(e)}
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-ink)",
          display: "flex",
          gap: "6px",
          alignItems: "flex-end",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <div>
          <label htmlFor="sk-name" style={{ ...labelStyle, fontSize: "13px" }}>
            Name:
          </label>
          <input
            id="sk-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ ...fieldStyle, width: "120px" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label style={{ ...labelStyle, fontSize: "13px", display: "block" }}>
            Icon:
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(pickerOpen === "new" ? null : "new")}
            style={{
              width: "32px",
              height: "32px",
              border: "2px solid var(--color-ink)",
              background: "var(--bg-window)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
            }}
          >
            {form.icon ? (
              <img
                src={getLocalIconUrl(form.icon)}
                alt={form.icon}
                width={22}
                height={22}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "14px",
                  color: "var(--color-muted)",
                }}
              >
                ?
              </span>
            )}
          </button>
          {pickerOpen === "new" && (
            <IconPicker
              current={form.icon || null}
              onPick={(slug) => setForm({ ...form, icon: slug ?? "" })}
              onClose={() => setPickerOpen(null)}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn"
          style={btnPrimary}
        >
          {saving ? "…" : "+ Add"}
        </button>
        {err && (
          <span
            style={{
              color: "var(--color-accent)",
              fontFamily: "var(--font-system)",
              fontSize: "13px",
            }}
          >
            {err}
          </span>
        )}
      </form>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
        {skills.length === 0 && (
          <EmptyState message="No skills yet." font="body" />
        )}
        {skills.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 0",
              position: "relative",
            }}
          >
            <button
              type="button"
              title="Change icon"
              onClick={() => setPickerOpen(pickerOpen === s.id ? null : s.id)}
              style={{
                width: "24px",
                height: "24px",
                flexShrink: 0,
                border: "1px solid var(--color-muted)",
                background: "var(--bg-window)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
              }}
            >
              {s.icon ? (
                <img
                  src={getLocalIconUrl(s.icon)}
                  alt={s.icon}
                  width={18}
                  height={18}
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-system)",
                    fontSize: "12px",
                    color: "var(--color-muted)",
                  }}
                >
                  ?
                </span>
              )}
            </button>

            {pickerOpen === s.id && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  zIndex: 200,
                }}
              >
                <IconPicker
                  current={s.icon}
                  onPick={(slug) => {
                    void setIcon(s.id, slug);
                  }}
                  onClose={() => setPickerOpen(null)}
                />
              </div>
            )}

            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                flex: 1,
              }}
            >
              {s.name}
            </span>
            <button
              onClick={() => void deleteSkill(s.id)}
              className="btn"
              style={{ ...btnPrimary, fontSize: "12px", padding: "1px 8px" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
