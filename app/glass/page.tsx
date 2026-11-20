/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Metadata } from "next";
import GlassDemo from "@/components/glass/GlassDemo";
import "./glass.css";

export const metadata: Metadata = {
  title: "Liquid Glass demo",
  robots: { index: false },
};

export default function GlassPage() {
  return <GlassDemo />;
}
