/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState } from "react";
import type { Tab } from "./types";
import BioTab from "./tabs/BioTab";
import ProjectsTab from "./tabs/ProjectsTab";
import SkillsTab from "./tabs/SkillsTab";
import GuestbookTab from "./tabs/GuestbookTab";

const TABS: { id: Tab; label: string }[] = [
  { id: "bio", label: "Bio" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "guestbook", label: "Guestbook" },
];

export default function ContentEditor() {
  const [tab, setTab] = useState<Tab>("bio");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--color-ink)",
          padding: "0 8px",
          background: "var(--bg-window)",
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "5px 18px",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              background: "none",
              border: "none",
              borderBottom:
                tab === t.id
                  ? "3px solid var(--color-accent)"
                  : "3px solid transparent",
              marginBottom: "-2px",
              color: tab === t.id ? "var(--color-ink)" : "var(--color-muted)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tab === "bio" && <BioTab />}
        {tab === "projects" && <ProjectsTab />}
        {tab === "skills" && <SkillsTab />}
        {tab === "guestbook" && <GuestbookTab />}
      </div>
    </div>
  );
}
