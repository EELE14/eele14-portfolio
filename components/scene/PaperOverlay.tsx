/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PaperSide } from "./RoomContext";

function renderInline(text: string, key: number): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const bold = match[1] ?? match[2];
    const italic = match[3] ?? match[4];
    if (bold !== undefined) parts.push(<strong key={i++}>{bold}</strong>);
    else if (italic !== undefined) parts.push(<em key={i++}>{italic}</em>);
    else parts.push(<code key={i++}>{match[5]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span key={key}>{parts}</span>;
}

function renderMarkdown(source: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flushList = (key: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={key}>
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, i)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  source.split("\n").forEach((line, i) => {
    const image = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
    if (image) {
      flushList(`l${i}`);
      blocks.push(
        <span className="paper-photo" key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image[2]} alt={image[1]} />
        </span>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      return;
    }
    flushList(`l${i}`);
    if (line.startsWith("## ")) blocks.push(<h3 key={i}>{line.slice(3)}</h3>);
    else if (line.startsWith("# "))
      blocks.push(<h2 key={i}>{line.slice(2)}</h2>);
    else if (line.trim()) blocks.push(<p key={i}>{renderInline(line, i)}</p>);
  });
  flushList("tail");
  return blocks;
}

function usePages(side: PaperSide): string[] | null {
  const [pages, setPages] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const texts: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const res = await fetch(`/notes/${side}${i === 1 ? "" : i}.md`);
        if (!res.ok) break;
        texts.push(await res.text());
      }
      if (!cancelled) setPages(texts.length ? texts : ["# note missing"]);
    })().catch(() => {
      if (!cancelled) setPages(["# note missing"]);
    });
    return () => {
      cancelled = true;
    };
  }, [side]);

  return pages;
}

interface PaperOverlayProps {
  side: PaperSide;
  onClose: () => void;
}

export default function PaperOverlay({ side, onClose }: PaperOverlayProps) {
  const pages = usePages(side);
  const [page, setPage] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const turnTo = (index: number) => {
    setPage(index);
    sheetRef.current?.scrollTo(0, 0);
  };

  return (
    <div className="paper-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        className={`paper-sheet paper-sheet-${side}`}
        onClick={(e) => e.stopPropagation()}
      >
        {pages === null ? (
          <p className="paper-loading">…</p>
        ) : (
          renderMarkdown(pages[page])
        )}
        <div className="paper-footer">
          {pages !== null && pages.length > 1 && (
            <nav className="paper-pages">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => turnTo(page - 1)}
              >
                &lsaquo;
              </button>
              {page + 1}/{pages.length}
              <button
                type="button"
                disabled={page === pages.length - 1}
                onClick={() => turnTo(page + 1)}
              >
                &rsaquo;
              </button>
            </nav>
          )}
          <button type="button" className="paper-close" onClick={onClose}>
            put back
          </button>
        </div>
      </div>
    </div>
  );
}
