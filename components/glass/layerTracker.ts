/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { grown, intersects, relativeRect, type Rect } from "./rect";
import type { SceneLayer } from "./sceneRenderer";
import { snapshot, type Snapshot } from "./snapshot";

const SHADOW_MARGIN = 80;
const SNAPSHOT_INTERVAL = 250;

interface Tracked {
  key: string;
  shot: Snapshot | null;
  version: number;
  dirty: boolean;
  pending: boolean;
  shotAt: number;
  size: string;
}

export interface LayerTracker {
  layers(covered: Rect[], ratio: number): SceneLayer[];
  dispose(): void;
}

const WATCHED = {
  subtree: true,
  childList: true,
  attributes: true,
  characterData: true,
};

function hostElement(node: Node | null): Element | null {
  if (!node) return null;
  if (node.nodeType === Node.DOCUMENT_NODE)
    return (node as Document).defaultView?.frameElement ?? null;
  if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  return node.parentElement;
}

function directChild(root: Element, node: Node | null): Element | null {
  let current = hostElement(node);
  while (current && current.parentElement !== root) {
    current = current.parentElement ?? hostElement(current.ownerDocument);
  }
  return current;
}

function stackOrder(children: Element[]): Element[] {
  const depth = (child: Element) =>
    Number.parseInt(getComputedStyle(child).zIndex) || 0;
  return children
    .map((child, index) => ({ child, index, z: depth(child) }))
    .sort((a, b) => a.z - b.z || a.index - b.index)
    .map(({ child }) => child);
}

function canvasLayer(
  canvas: HTMLCanvasElement,
  key: string,
  origin: DOMRect,
): SceneLayer {
  return {
    key,
    source: canvas,
    version: `${canvas.width}x${canvas.height}`,
    rect: relativeRect(canvas, origin),
  };
}

export function trackLayers(root: HTMLElement): LayerTracker {
  const tracked = new Map<Element, Tracked>();
  let disposed = false;
  let nextKey = 0;

  function entry(child: Element): Tracked {
    let found = tracked.get(child);
    if (!found) {
      found = {
        key: `layer-${nextKey++}`,
        shot: null,
        version: 0,
        dirty: true,
        pending: false,
        shotAt: 0,
        size: "",
      };
      tracked.set(child, found);
    }
    return found;
  }

  function markDirty(node: Node | null) {
    const child = directChild(root, node);
    if (child) entry(child).dirty = true;
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const moved =
        record.type === "attributes" && record.target.parentNode === root;
      if (!moved) markDirty(record.target);
    }
  });
  const listening = new AbortController();
  const onChange = (event: Event) => markDirty(event.target as Node);
  const onLoad = (event: Event) => {
    markDirty(event.target as Node);
    watchFrame(event.target as Element);
  };

  function watch(target: Element | Document) {
    observer.observe(target, WATCHED);
    const options = { capture: true, signal: listening.signal };
    target.addEventListener("input", onChange, options);
    target.addEventListener("scroll", onChange, options);
    target.addEventListener("load", onLoad, options);
    target.querySelectorAll("iframe").forEach(watchFrame);
  }

  function watchFrame(element: Element) {
    if (element.localName !== "iframe") return;
    const doc = (element as HTMLIFrameElement).contentDocument;
    if (doc) watch(doc);
  }

  watch(root);

  function capture(child: HTMLElement, state: Tracked, ratio: number) {
    state.pending = true;
    state.dirty = false;
    state.shotAt = performance.now();
    snapshot(child, ratio, SHADOW_MARGIN)
      .catch(() => null)
      .then((shot) => {
        state.pending = false;
        if (disposed || !shot) return;
        state.shot = shot;
        state.version++;
      });
  }

  function snapshotLayer(
    child: HTMLElement,
    origin: DOMRect,
    covered: Rect[],
    ratio: number,
  ): SceneLayer | null {
    const state = entry(child);
    const rect = relativeRect(child, origin);
    const size = `${Math.round(rect.width)}x${Math.round(rect.height)}@${ratio}`;
    if (size !== state.size) {
      state.size = size;
      state.dirty = true;
    }
    const area = grown(rect, SHADOW_MARGIN);
    const due =
      state.dirty &&
      !state.pending &&
      performance.now() - state.shotAt > SNAPSHOT_INTERVAL;

    if (
      due &&
      (!state.shot || covered.some((lens) => intersects(lens, area)))
    ) {
      capture(child, state, ratio);
    }
    if (!state.shot) return null;
    return {
      key: state.key,
      source: state.shot.canvas,
      version: String(state.version),
      rect: { ...area, width: state.shot.width, height: state.shot.height },
    };
  }

  return {
    layers(covered, ratio) {
      const origin = root.getBoundingClientRect();
      const children = stackOrder([...root.children]);
      return children.flatMap((child) => {
        if (child instanceof HTMLCanvasElement)
          return [canvasLayer(child, entry(child).key, origin)];
        if (!(child instanceof HTMLElement) || !child.getClientRects().length)
          return [];
        const layer = snapshotLayer(child, origin, covered, ratio);
        return layer ? [layer] : [];
      });
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      listening.abort();
    },
  };
}
