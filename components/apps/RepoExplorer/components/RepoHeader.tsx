/* Copyright (c) 2026 eele14. All Rights Reserved. */

interface RepoHeaderProps {
  projectTitle: string;
  owner: string;
  repo: string;
  branch?: string;
  onOpenBrowser: (url: string) => void;
}

export default function RepoHeader({
  projectTitle,
  owner,
  repo,
  branch,
  onOpenBrowser,
}: RepoHeaderProps) {
  return (
    <div
      style={{
        padding: "3px 8px",
        borderBottom: "1px solid var(--color-ink)",
        background: "var(--bg-window)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "13px",
          color: "var(--color-muted)",
        }}
      >
        {projectTitle} —
      </span>
      <button
        onClick={() => onOpenBrowser(`https://github.com/${owner}/${repo}`)}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--color-teal)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        github.com/{owner}/{repo}
      </button>
      {branch && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-muted)",
          }}
        >
          @ {branch}
        </span>
      )}
    </div>
  );
}
