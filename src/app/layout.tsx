import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZipShift - High Performance File Zipping Utility",
  description: "Group, date-shift, and compress merchant and bank files individually in your browser instantly. 100% private & client-side.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
