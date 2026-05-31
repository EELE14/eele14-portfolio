/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface Tab {
  id: string;
  url: string;
  src: string;
  inputValue: string;
  title: string;
  loading: boolean;
}

export interface TabHistory {
  urls: string[];
  idx: number;
}

export const MAX_TABS = 6;
export const NEWTAB = "/browser/newtab.html";
export const HOMEPAGE = "/browser/home.html?context=browser";

let tabCounter = 0;

export function makeTab(url = NEWTAB): Tab {
  return {
    id: `tab-${++tabCounter}`,
    url,
    src: "",
    inputValue: url,
    title: "New Tab",
    loading: true,
  };
}
