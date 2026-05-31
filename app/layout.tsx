/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Metadata } from "next";
import { VT323, Courier_Prime, Space_Mono } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://eele14.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  icons: { icon: "/image.ico" },
  title: "eele",
  description:
    "This is a portfolio website. EELE14.OS is definitely a real operating system. It runs in your browser :D",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "eele14.dev",
    title: "eele",
    description:
      "This is a portfolio website. EELE14.OS is definitely a real operating system. It runs in your browser :D",
    images: [
      {
        url: "/image.png",
        width: 2922,
        height: 1492,
        alt: "EELE14.OS, brutalist desktop portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eele",
    description:
      "This is a portfolio website. EELE14.OS is definitely a real operating system. It runs in your browser :D",
    images: ["/image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${vt323.variable} ${courierPrime.variable} ${spaceMono.variable} h-full`}
    >
      <body className="h-full overflow-hidden">
        <noscript>
          <div
            style={{
              background: "#1a1a1a",
              color: "#d4c5a9",
              fontFamily: "monospace",
              padding: "48px 32px",
              minHeight: "100vh",
              lineHeight: 1.6,
            }}
          >
            <h1
              style={{
                color: "#e8472a",
                fontSize: "2rem",
                marginBottom: "16px",
              }}
            >
              EELE14.OS
            </h1>
            <p style={{ maxWidth: "560px", marginBottom: "12px" }}>
              This is the portfolio of eele14, a full-stack developer from
              Germany building web apps with TypeScript, Next.js, and React.
            </p>
            <p style={{ maxWidth: "560px", marginBottom: "12px" }}>
              The portfolio runs as a fake Windows 9x desktop with working apps:
              a terminal, file explorer, multiplayer Battleship, a guestbook,
              and an in-OS web browser. It is over-engineered on purpose.
            </p>
            <p style={{ color: "#8a7e6a", fontSize: "0.875rem" }}>
              JavaScript is required to run EELE14.OS. Enable it and reload.
            </p>
          </div>
        </noscript>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
