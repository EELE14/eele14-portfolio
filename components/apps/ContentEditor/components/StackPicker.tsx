/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { getLocalIconUrl } from "@/lib/client/skill-icons";
import { labelStyle } from "../constants";

interface Skill {
  id: string;
  name: string;
  icon?: string | null;
}

interface StackPickerProps {
  selected: string[];
  onChange: (stack: string[]) => void;
}

export default function StackPicker({ selected, onChange }: StackPickerProps) {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d: Skill[]) => setSkills(d))
      .catch(() => {});
  }, []);

  function toggle(name: string) {
    onChange(
      selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name],
    );
  }

  if (!skills.length) {
    return (
      <div>
        <label style={labelStyle}>Stack:</label>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-muted)",
          }}
        >
          No skills defined.
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          marginBottom: "4px",
        }}
      >
        <label style={labelStyle}>Stack:</label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            clear all
          </button>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "6px",
          border: "2px solid var(--color-ink)",
          background: "white",
        }}
      >
        {skills.map((s) => {
          const isSelected = selected.includes(s.name);
          return (
            <button
              key={s.id}
              type="button"
              title={s.name}
              onClick={() => toggle(s.name)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                width: "56px",
                padding: "4px 2px",
                border: isSelected
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-muted)",
                background: isSelected
                  ? "rgba(232,71,42,0.06)"
                  : "var(--bg-window)",
                cursor: "pointer",
              }}
            >
              {s.icon ? (
                <img
                  src={getLocalIconUrl(s.icon)}
                  alt={s.name}
                  width={20}
                  height={20}
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
              <span
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "10px",
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                  textAlign: "center",
                  color: "var(--color-ink)",
                }}
              >
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-muted)",
            marginTop: "3px",
          }}
        >
          {selected.length} selected
        </div>
      )}
    </div>
  );
}
