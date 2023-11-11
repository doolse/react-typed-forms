"use client";
import React, { ReactNode } from "react";
import "../globals.css";
import { CssBaseline } from "@mui/material";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <CssBaseline />
      <body>{children}</body>
    </html>
  );
}
