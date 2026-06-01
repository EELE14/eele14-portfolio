/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { parseBody } from "@/lib/server/api";
import { filterContent } from "@/lib/server/content-filter";
import { getSessionFromRequest } from "@/lib/server/auth";

const MAX_NAME = 40;
const MAX_MESSAGE = 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

const LOCALHOST = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  try {
    const entries = await prisma.guestbookEntry.findMany({
      where: session?.isAdmin ? undefined : { approved: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}

function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\0/g, "");
}

export async function POST(req: NextRequest) {
  const body = await parseBody<{ name?: string; message?: string }>(req);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  if (typeof body.name !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const name = sanitize(body.name).trim();
  const message = sanitize(body.message).trim();

  if (!name || !message) {
    return NextResponse.json(
      { error: "name and message are required" },
      { status: 422 },
    );
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME} characters or fewer.` },
      { status: 422 },
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE} characters or fewer.` },
      { status: 422 },
    );
  }

  const ip = getClientIp(req);
  const isDev = process.env.NODE_ENV === "development";
  const skipIpCheck = isDev && LOCALHOST.has(ip);

  if (!skipIpCheck && ip !== "unknown") {
    const block = await prisma.guestbookBlock.findUnique({ where: { ip } });
    if (block) {
      const hasBlockedEntry = await prisma.guestbookEntry.findFirst({
        where: { ipAddress: ip, blocked: true },
      });
      if (!hasBlockedEntry) {
        await prisma.guestbookEntry.create({
          data: {
            name,
            message,
            approved: false,
            blocked: true,
            ipAddress: ip,
          },
        });
      }
      return NextResponse.json(
        { error: "You are not allowed to submit." },
        { status: 403 },
      );
    }

    const existing = await prisma.guestbookEntry.findFirst({
      where: { ipAddress: ip, blocked: false },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already signed the guestbook." },
        { status: 403 },
      );
    }
  }

  const filterResult = filterContent(`${name} ${message}`);
  if (!filterResult.ok) {
    if (!skipIpCheck && ip !== "unknown") {
      await prisma.guestbookBlock.upsert({
        where: { ip },
        create: { ip, reason: filterResult.category ?? "policy" },
        update: { reason: filterResult.category ?? "policy" },
      });
      await prisma.guestbookEntry.create({
        data: { name, message, approved: false, blocked: true, ipAddress: ip },
      });
    }
    const msg =
      filterResult.category === "link-shortener"
        ? "Link shorteners are not allowed. Use the full URL."
        : filterResult.category === "nsfw"
          ? "NSFW or adult-content links are not allowed."
          : "Your entry contains content that violates our community guidelines.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const duplicate = await prisma.guestbookEntry.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "An entry with that name already exists." },
      { status: 422 },
    );
  }

  try {
    const entry = await prisma.guestbookEntry.create({
      data: { name, message, approved: true, ipAddress: ip },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }
}
