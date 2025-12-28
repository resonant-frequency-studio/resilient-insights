import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resilient Insights",
  description: "A blog powered by Next.js and Sanity CMS",
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

