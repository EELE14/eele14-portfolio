/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/server/prisma";
import { getSessionFromRequest } from "@/lib/server/auth";
import { handlePrismaError, parseBody } from "@/lib/server/api";

const MAX_NAME = 100;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 10_000;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function POST(req: NextRequest) {
  const body = await parseBody<{
    fromName?: string;
    subject?: string;
    message?: string;
  }>(req);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fromName, subject, message } = body;

  if (!fromName?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (fromName.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Name too long (max ${MAX_NAME} chars)` },
      { status: 422 },
    );
  }
  if (subject.length > MAX_SUBJECT) {
    return NextResponse.json(
      { error: `Subject too long (max ${MAX_SUBJECT} chars)` },
      { status: 422 },
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE} chars)` },
      { status: 422 },
    );
  }

  try {
    const msg = await prisma.contactMessage.create({
      data: {
        fromName: fromName.trim(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    if (process.env.RESEND_API_KEY) {
      void new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "Portfolio <noreply@eele14.dev>",
        to: "hi@eele14.dev",
        subject: `[Portfolio] ${msg.subject}`,
        text: `From: ${msg.fromName}\n\n${msg.message}`,
      });
    }

    return NextResponse.json(msg, { status: 201 });
  } catch (e) {
    return handlePrismaError(e);
  }
}
