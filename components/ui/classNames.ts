/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function classNames(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
