/* Copyright (c) 2026 eele14. All Rights Reserved. */

const INHERITED = [
  "color",
  "direction",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "text-align",
  "text-transform",
  "word-spacing",
];

const cachedCss = new WeakMap<Document, { sheets: number; text: string }>();

export function styleOf(element: Element): CSSStyleDeclaration {
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(
    element,
  );
}

export function documentCss(doc: Document): string {
  const sheets = [...doc.styleSheets];
  const cached = cachedCss.get(doc);
  if (cached?.sheets === sheets.length) return cached.text;
  const text = sheets
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
  cachedCss.set(doc, { sheets: sheets.length, text });
  return text;
}

export function inheritedStyle(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return "";
  const style = styleOf(parent);
  return INHERITED.map(
    (name) => `${name}:${style.getPropertyValue(name)}`,
  ).join(";");
}
