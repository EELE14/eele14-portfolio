/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ReactNode } from "react";
import { useDesktopStore } from "@/store/windowStore";

export interface AppDef {
  id: string;
  title: string;
  description: string;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  adminOnly: boolean;
  icon: ReactNode;
}

const stroke = "var(--color-ink)";
const sw = "2";

function FolderIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="14"
        width="44"
        height="30"
        rx="1"
        stroke={stroke}
        strokeWidth={sw}
        fill="var(--color-yellow)"
      />
      <path
        d="M2 18V14a1 1 0 0 1 1-1h14l4 4H2z"
        fill="var(--color-yellow)"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="14"
        width="44"
        height="30"
        rx="1"
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
      />
    </svg>
  );
}

function NotepadIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="4"
        width="32"
        height="40"
        rx="1"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <line
        x1="14"
        y1="14"
        x2="34"
        y2="14"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="21"
        x2="34"
        y2="21"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="28"
        x2="28"
        y2="28"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="35"
        x2="22"
        y2="35"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <rect
        x="18"
        y="1"
        width="12"
        height="6"
        rx="1"
        fill="var(--color-muted)"
        stroke={stroke}
        strokeWidth={sw}
      />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="6"
        width="44"
        height="36"
        rx="1"
        fill="var(--color-ink)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <rect
        x="2"
        y="6"
        width="44"
        height="8"
        rx="1"
        fill="var(--color-muted)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <polyline
        points="10,26 18,22 10,18"
        stroke="var(--color-teal)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="22"
        y1="26"
        x2="36"
        y2="26"
        stroke="var(--color-teal)"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <circle cx="8" cy="10" r="1.5" fill="var(--color-accent)" />
      <circle cx="14" cy="10" r="1.5" fill="var(--color-yellow)" />
      <circle cx="20" cy="10" r="1.5" fill="var(--color-teal)" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="40"
        height="28"
        rx="1"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <polyline
        points="4,10 24,28 44,10"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="4"
        y1="38"
        x2="18"
        y2="24"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="44"
        y1="38"
        x2="30"
        y2="24"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditorIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="4"
        width="28"
        height="36"
        rx="1"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <line
        x1="12"
        y1="13"
        x2="28"
        y2="13"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="20"
        x2="28"
        y2="20"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="27"
        x2="22"
        y2="27"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <path
        d="M30 28 L44 14 L40 10 L26 24 L26 32 L34 32 Z"
        fill="var(--color-teal)"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon() {
  const unread = useDesktopStore((s) => s.inboxUnread);
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Tray — open box */}
      <path
        d="M4 44 L4 30 L44 30 L44 44 Z"
        fill="var(--color-muted)"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* Envelope body, resting in tray */}
      <rect
        x="10"
        y="12"
        width="28"
        height="20"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Envelope V-fold */}
      <polyline
        points="10,12 24,24 38,12"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
        fill="none"
      />
      {/* Unread badge — only shown when there are unread messages */}
      {unread > 0 && (
        <>
          <circle cx="36" cy="10" r="7" fill="var(--color-accent)" />
          <text
            x="36"
            y="10"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={unread > 9 ? "8" : "10"}
            fontFamily="var(--font-body)"
            fontWeight="bold"
            fill="black"
          >
            {unread > 99 ? "99+" : unread}
          </text>
        </>
      )}
    </svg>
  );
}

// function MinesweeperIcon() {
//   return (
//     <svg
//       width="48"
//       height="48"
//       viewBox="0 0 48 48"
//       fill="none"
//       aria-hidden="true"
//     >
//       <rect
//         x="4"
//         y="4"
//         width="40"
//         height="40"
//         rx="2"
//         fill="var(--color-muted)"
//         stroke={stroke}
//         strokeWidth={sw}
//       />
//       {/* Mines on grid */}
//       <circle cx="14" cy="14" r="5" fill={stroke} />
//       <circle cx="34" cy="14" r="5" fill={stroke} />
//       <circle cx="14" cy="34" r="5" fill={stroke} />
//       <rect
//         x="22"
//         y="22"
//         width="8"
//         height="8"
//         fill="var(--color-accent)"
//         stroke={stroke}
//         strokeWidth={sw}
//       />
//       {/* Spikes */}
//       <line
//         x1="14"
//         y1="5"
//         x2="14"
//         y2="9"
//         stroke={stroke}
//         strokeWidth="2"
//         strokeLinecap="round"
//       />
//       <line
//         x1="14"
//         y1="19"
//         x2="14"
//         y2="23"
//         stroke={stroke}
//         strokeWidth="2"
//         strokeLinecap="round"
//       />
//       <line
//         x1="5"
//         y1="14"
//         x2="9"
//         y2="14"
//         stroke={stroke}
//         strokeWidth="2"
//         strokeLinecap="round"
//       />
//       <line
//         x1="19"
//         y1="14"
//         x2="23"
//         y2="14"
//         stroke={stroke}
//         strokeWidth="2"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

function BattleshipIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      <line
        x1="2"
        y1="16"
        x2="46"
        y2="16"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="2"
        y1="30"
        x2="46"
        y2="30"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="46"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="30"
        y1="2"
        x2="30"
        y2="46"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.35"
      />
      {/* Ship hull */}
      <rect
        x="5"
        y="10"
        width="38"
        height="10"
        fill="var(--bg-titlebar)"
        stroke={stroke}
        strokeWidth="1.5"
        rx="1"
      />
      {/* Turret */}
      <rect
        x="18"
        y="5"
        width="12"
        height="6"
        fill="var(--bg-titlebar)"
        stroke={stroke}
        strokeWidth="1.5"
        rx="1"
      />
      {/* Target crosshair */}
      <circle
        cx="32"
        cy="34"
        r="8"
        stroke="var(--color-accent)"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="32"
        y1="24"
        x2="32"
        y2="22"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="46"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="34"
        x2="20"
        y2="34"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="34"
        x2="44"
        y2="34"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="34" r="2" fill="var(--color-accent)" />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Monitor bezel */}
      <rect
        x="4"
        y="6"
        width="40"
        height="30"
        stroke={stroke}
        strokeWidth={sw}
      />
      <line
        x1="16"
        y1="36"
        x2="14"
        y2="44"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="36"
        x2="34"
        y2="44"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="44"
        x2="36"
        y2="44"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Globe on screen */}
      <circle cx="24" cy="21" r="10" stroke={stroke} strokeWidth={sw} />
      <ellipse
        cx="24"
        cy="21"
        rx="5"
        ry="10"
        stroke={stroke}
        strokeWidth={sw}
      />
      <line x1="14" y1="21" x2="34" y2="21" stroke={stroke} strokeWidth={sw} />
      <line x1="15" y1="16" x2="33" y2="16" stroke={stroke} strokeWidth={sw} />
      <line x1="15" y1="26" x2="33" y2="26" stroke={stroke} strokeWidth={sw} />
      {/* Accent dot */}
      <circle cx="24" cy="21" r="2" fill="var(--color-accent)" />
    </svg>
  );
}

function GuestbookIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Book cover */}
      <rect
        x="8"
        y="4"
        width="32"
        height="40"
        rx="1"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Spine */}
      <line x1="14" y1="4" x2="14" y2="44" stroke={stroke} strokeWidth={sw} />
      {/* Lines of text */}
      <line
        x1="20"
        y1="14"
        x2="36"
        y2="14"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="20"
        x2="36"
        y2="20"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="26"
        x2="36"
        y2="26"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="32"
        x2="30"
        y2="32"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="38"
        x2="28"
        y2="38"
        stroke="var(--color-accent)"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

function StupidAIIcon() {
  const petal = "M-2.5,4 L2.5,4 L2,-16 L0.8,-19.5 L-0.8,-19.5 L-2,-16 Z";
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(24, 24)">
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={petal}
            fill="var(--color-accent)"
            transform={`rotate(${(360 / 11) * i})`}
          />
        ))}
      </g>
    </svg>
  );
}

function RecycleBinIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 14 L38 14 L34 42 L14 42 Z"
        fill="var(--bg-window)"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <line
        x1="6"
        y1="14"
        x2="42"
        y2="14"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <path
        d="M18 8 L30 8 L32 14 L16 14 Z"
        fill="var(--color-muted)"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <line
        x1="20"
        y1="20"
        x2="19"
        y2="36"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="20"
        x2="24"
        y2="36"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="20"
        x2="29"
        y2="36"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const APPS: AppDef[] = [
  {
    id: "explorer.exe",
    title: "File Explorer",
    description: "Browse projects and files",
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 400, height: 300 },
    adminOnly: false,
    icon: <FolderIcon />,
  },
  {
    id: "about.txt",
    title: "Notepad — about.txt",
    description: "Who is eele?",
    defaultSize: { width: 560, height: 400 },
    minSize: { width: 320, height: 240 },
    adminOnly: false,
    icon: <NotepadIcon />,
  },
  {
    id: "cmd.exe",
    title: "Command Prompt",
    description: "C:\\> _",
    defaultSize: { width: 600, height: 380 },
    minSize: { width: 380, height: 240 },
    adminOnly: false,
    icon: <TerminalIcon />,
  },
  {
    id: "mail.exe",
    title: "New Message",
    description: "Get in touch",
    defaultSize: { width: 520, height: 440 },
    minSize: { width: 360, height: 320 },
    adminOnly: false,
    icon: <MailIcon />,
  },
  {
    id: "battleship.exe",
    title: "Naval Combat",
    description: "Multiplayer battleship — two players",
    defaultSize: { width: 760, height: 560 },
    minSize: { width: 580, height: 440 },
    adminOnly: false,
    icon: <BattleshipIcon />,
  },
  {
    id: "browser.exe",
    title: "Internet Browser",
    description:
      "Browse the web through a proxy. Supports Google Search and most sites.",
    defaultSize: { width: 900, height: 620 },
    minSize: { width: 640, height: 440 },
    adminOnly: false,
    icon: <BrowserIcon />,
  },
  {
    id: "guestbook.exe",
    title: "Guestbook",
    description: "Sign the visitor guestbook",
    defaultSize: { width: 680, height: 480 },
    minSize: { width: 480, height: 360 },
    adminOnly: false,
    icon: <GuestbookIcon />,
  },
  {
    id: "stupid-ai.exe",
    title: "Stupid AI",
    description: "GPT-2 on a Raspberry Pi, extremely dumb.",
    defaultSize: { width: 520, height: 480 },
    minSize: { width: 360, height: 320 },
    adminOnly: false,
    icon: <StupidAIIcon />,
  },
  {
    id: "content_editor.exe",
    title: "Content Editor",
    description: "Edit site content [ADMIN]",
    defaultSize: { width: 700, height: 520 },
    minSize: { width: 500, height: 380 },
    adminOnly: true,
    icon: <EditorIcon />,
  },
  {
    id: "file_manager.exe",
    title: "Inbox",
    description: "View received messages [ADMIN]",
    defaultSize: { width: 620, height: 460 },
    minSize: { width: 440, height: 320 },
    adminOnly: true,
    icon: <InboxIcon />,
  },
];

export const RECYCLE_BIN: AppDef = {
  id: "recycle_bin",
  title: "Recycle Bin",
  description: "Empty",
  defaultSize: { width: 400, height: 300 },
  minSize: { width: 300, height: 200 },
  adminOnly: false,
  icon: <RecycleBinIcon />,
};

export function getApp(id: string): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}
