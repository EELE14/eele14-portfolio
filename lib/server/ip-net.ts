/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface IpPrefix {
  bytes: Uint8Array;
  bits: number;
}

export const DEFAULT_V6_BITS = 64;

function parseIpv4(raw: string): Uint8Array | null {
  const parts = raw.split(".");
  if (parts.length !== 4) return null;

  const out = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part[0] === "0") return null;
    const value = Number(part);
    if (value > 255) return null;
    out[i] = value;
  }
  return out;
}

function parseGroups(raw: string): number[] | null {
  if (raw === "") return [];

  const parts = raw.split(":");
  const groups: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === parts.length - 1 && part.includes(".")) {
      const v4 = parseIpv4(part);
      if (!v4) return null;
      groups.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
      continue;
    }

    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
    groups.push(parseInt(part, 16));
  }
  return groups;
}

function parseIpv6(raw: string): Uint8Array | null {
  if (raw.indexOf("::") !== raw.lastIndexOf("::")) return null;

  const hasGap = raw.includes("::");
  const [headRaw, tailRaw] = hasGap ? raw.split("::") : [raw, undefined];

  const head = parseGroups(headRaw);
  if (!head) return null;
  const tail = tailRaw === undefined ? [] : parseGroups(tailRaw);
  if (!tail) return null;

  const written = head.length + tail.length;
  if (hasGap ? written > 7 : written !== 8) return null;

  const groups = [...head, ...new Array<number>(8 - written).fill(0), ...tail];

  const out = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    out[i * 2] = groups[i] >> 8;
    out[i * 2 + 1] = groups[i] & 0xff;
  }
  return out;
}

function isV4Mapped(bytes: Uint8Array): boolean {
  if (bytes.length !== 16) return false;
  for (let i = 0; i < 10; i++) if (bytes[i] !== 0) return false;
  return bytes[10] === 0xff && bytes[11] === 0xff;
}

export interface ParsedIp {
  bytes: Uint8Array;
  mapped: boolean;
}

export function parseIp(raw: string): ParsedIp | null {
  let text = raw.trim();
  if (text.startsWith("[")) {
    const end = text.lastIndexOf("]");
    if (end === -1) return null;
    text = text.slice(1, end);
  }
  const zone = text.indexOf("%");
  if (zone !== -1) text = text.slice(0, zone);
  if (!text) return null;

  if (!text.includes(":")) {
    const v4 = parseIpv4(text);
    return v4 ? { bytes: v4, mapped: false } : null;
  }

  const v6 = parseIpv6(text);
  if (!v6) return null;
  if (isV4Mapped(v6)) return { bytes: v6.slice(12), mapped: true };
  return { bytes: v6, mapped: false };
}

function maskBytes(bytes: Uint8Array, bits: number): Uint8Array {
  const out = new Uint8Array(bytes);
  for (let i = 0; i < out.length; i++) {
    const consumed = i * 8;
    if (consumed >= bits) {
      out[i] = 0;
    } else if (consumed + 8 > bits) {
      out[i] &= (0xff << (consumed + 8 - bits)) & 0xff;
    }
  }
  return out;
}

export function parsePrefix(raw: string): IpPrefix | null {
  const parts = raw.trim().split("/");
  if (parts.length > 2) return null;

  const parsed = parseIp(parts[0]);
  if (!parsed) return null;

  const maxBits = parsed.bytes.length * 8;
  let bits: number;

  if (parts.length === 1) {
    bits = parsed.bytes.length === 4 ? 32 : DEFAULT_V6_BITS;
  } else {
    if (!/^\d{1,3}$/.test(parts[1])) return null;
    bits = Number(parts[1]);

    if (parsed.mapped) {
      if (bits < 96 || bits > 128) return null;
      bits -= 96;
    }
    if (bits > maxBits) return null;
  }

  return { bytes: maskBytes(parsed.bytes, bits), bits };
}

function formatV6(bytes: Uint8Array): string {
  const groups: number[] = [];
  for (let i = 0; i < 16; i += 2) groups.push((bytes[i] << 8) | bytes[i + 1]);

  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  let runLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] !== 0) {
      runStart = -1;
      runLen = 0;
      continue;
    }
    if (runStart === -1) runStart = i;
    runLen++;
    if (runLen > bestLen) {
      bestLen = runLen;
      bestStart = runStart;
    }
  }

  const hex = (g: number) => g.toString(16);
  if (bestLen < 2) return groups.map(hex).join(":");
  return `${groups.slice(0, bestStart).map(hex).join(":")}::${groups
    .slice(bestStart + bestLen)
    .map(hex)
    .join(":")}`;
}

export function formatPrefix(prefix: IpPrefix): string {
  const address =
    prefix.bytes.length === 4
      ? Array.from(prefix.bytes).join(".")
      : formatV6(prefix.bytes);
  return `${address}/${prefix.bits}`;
}

export function ipInPrefix(ip: Uint8Array, prefix: IpPrefix): boolean {
  if (ip.length !== prefix.bytes.length) return false;

  const wholeBytes = prefix.bits >> 3;
  for (let i = 0; i < wholeBytes; i++) {
    if (ip[i] !== prefix.bytes[i]) return false;
  }

  const remainder = prefix.bits & 7;
  if (remainder === 0) return true;
  const mask = (0xff << (8 - remainder)) & 0xff;
  return (ip[wholeBytes] & mask) === (prefix.bytes[wholeBytes] & mask);
}
