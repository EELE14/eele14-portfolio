/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
import { FileSm } from "@/components/icons/FileIcons";
import EmptyState from "@/components/ui/EmptyState";
import type { VFSNode } from "@/lib/shared/vfs";

interface SkillsViewProps {
  skills: VFSNode[];
  onOpen: (item: VFSNode) => void;
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  width: "80px",
  padding: "6px 4px",
  background: "none",
  border: "1px solid transparent",
  cursor: "default",
  textAlign: "center",
};

export default function SkillsView({ skills, onOpen }: SkillsViewProps) {
  if (!skills.length) {
    return <EmptyState message="No skills yet — add via Content Editor." />;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {skills.map((skill) => (
        <button
          key={skill.fsId ?? skill.name}
          onDoubleClick={() => onOpen(skill)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpen(skill);
          }}
          aria-label={skill.name}
          style={itemStyle}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px dashed var(--color-accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid transparent";
          }}
        >
          {skill.iconUrl ? (
            <img
              src={skill.iconUrl}
              alt={skill.name}
              width={24}
              height={24}
              style={{ display: "block", objectFit: "contain" }}
            />
          ) : (
            <FileSm />
          )}
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "13px",
              wordBreak: "break-word",
              lineHeight: 1.2,
              color: "var(--color-ink)",
            }}
          >
            {skill.name}
          </span>
        </button>
      ))}
    </div>
  );
}
