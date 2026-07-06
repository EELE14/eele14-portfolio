/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Metadata } from "next";
import Desktop from "@/components/desktop/Desktop";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function OsPage() {
  return (
    <>
      <div className="mobile-guard">
        <iframe
          src="/browser/home.html?context=mobile"
          title="EELE14.OS"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </div>

      <Desktop />
    </>
  );
}
