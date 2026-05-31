/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EELE14.OS",
    short_name: "EELE14.OS",
    description:
      "This is a portfolio website. EELE14.OS is definitely a real operating system. It runs in your browser :D",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#e8472a",
    icons: [
      {
        src: "/image.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/image.png",
        sizes: "2922x1492",
        type: "image/png",
      },
    ],
  };
}
