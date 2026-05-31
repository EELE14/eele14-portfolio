/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import type { Project } from "../types";
import { btnPrimary, btnSecondary } from "../constants";
import ProjectForm from "../components/ProjectForm";
import { invalidateProjectCache } from "@/lib/shared/vfs";

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function load() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d: Project[]) => setProjects(d))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing({
      id: "",
      slug: "",
      title: "",
      description: "",
      stack: [],
      imageUrls: [],
      sourceUrl: "",
      liveUrl: "",
      githubRepo: "",
      githubBranch: "",
      order: projects.length,
    });
    setIsNew(true);
    setErr("");
  }

  function startEdit(p: Project) {
    setEditing({ ...p });
    setIsNew(false);
    setErr("");
  }

  async function saveProject() {
    if (!editing) return;
    setSaving(true);
    setErr("");
    try {
      const url = isNew ? "/api/projects" : `/api/projects/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editing.slug,
          title: editing.title,
          description: editing.description,
          stack: editing.stack,
          imageUrls: editing.imageUrls,
          sourceUrl: editing.sourceUrl || undefined,
          liveUrl: editing.liveUrl || undefined,
          githubRepo: editing.githubRepo || undefined,
          githubBranch: editing.githubBranch || undefined,
          order: editing.order,
        }),
      });
      if (res.ok) {
        invalidateProjectCache();
        setEditing(null);
        load();
      } else {
        setErr("Save failed.");
      }
    } catch {
      setErr("Network error.");
    }
    setSaving(false);
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    invalidateProjectCache();
    load();
    setConfirmId(null);
  }

  if (confirmId) {
    return (
      <ConfirmDialog
        message="Delete this project? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => void deleteProject(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    );
  }

  if (editing) {
    return (
      <ProjectForm
        editing={editing}
        isNew={isNew}
        saving={saving}
        err={err}
        onChange={(patch) => setEditing({ ...editing, ...patch })}
        onSave={() => void saveProject()}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--color-ink)",
          flexShrink: 0,
        }}
      >
        <button onClick={startNew} className="btn" style={btnPrimary}>
          + New Project
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {projects.length === 0 && (
          <EmptyState message="No projects yet. Add one above." font="body" />
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div>
              <span
                style={{ fontFamily: "var(--font-system)", fontSize: "15px" }}
              >
                {p.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  marginLeft: "8px",
                }}
              >
                {p.stack.slice(0, 3).join(", ")}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => startEdit(p)}
                className="btn"
                style={{
                  ...btnSecondary,
                  fontSize: "13px",
                  padding: "2px 10px",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmId(p.id)}
                className="btn"
                style={{ ...btnPrimary, fontSize: "13px", padding: "2px 10px" }}
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
