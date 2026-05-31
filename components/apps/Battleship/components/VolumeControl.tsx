/* Copyright (c) 2026 eele14. All Rights Reserved. */

const LEVELS = [0.25, 0.5, 0.75, 1] as const;

const BAR_HEIGHTS = [5, 8, 12, 16] as const;

interface Props {
  volume: number;
  onVolumeChange: (v: number) => void;
}

export default function VolumeControl({ volume, onVolumeChange }: Props) {
  const muted = volume === 0;

  function toggleMute() {
    onVolumeChange(muted ? 0.5 : 0);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        border: "2px solid var(--color-ink)",
        boxShadow: "2px 2px 0 var(--color-ink)",
        padding: "2px 6px",
        background: "var(--bg-window)",
        flexShrink: 0,
        alignSelf: "stretch",
        cursor: "default",
      }}
      title="Volume"
    >
      <button
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          color: "var(--color-ink)",
          lineHeight: 1,
        }}
      >
        <SpeakerIcon muted={muted} />
      </button>

      {/* Stepped volume bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          marginLeft: "2px",
        }}
      >
        {LEVELS.map((level, i) => (
          <button
            key={level}
            onClick={() => onVolumeChange(level)}
            title={`${Math.round(level * 100)}%`}
            style={{
              width: "7px",
              height: `${BAR_HEIGHTS[i]}px`,
              background:
                !muted && volume >= level ? "var(--color-ink)" : "transparent",
              border: `1px solid ${!muted && volume >= level ? "var(--color-ink)" : "var(--color-muted)"}`,
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Speaker cone */}
      <polygon
        points="2,6 6,6 10,2 10,16 6,12 2,12"
        fill="currentColor"
        stroke="none"
      />
      <rect
        x="2"
        y="6"
        width="4"
        height="6"
        fill="currentColor"
        stroke="none"
      />

      {muted ? (
        <>
          <line x1="13" y1="6" x2="17" y2="12" />
          <line x1="17" y1="6" x2="13" y2="12" />
        </>
      ) : (
        <>
          <path d="M12 6.5 C13.5 7.5 13.5 10.5 12 11.5" fill="none" />
          <path d="M14 4.5 C16.5 6.5 16.5 11.5 14 13.5" fill="none" />
        </>
      )}
    </svg>
  );
}
