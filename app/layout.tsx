import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Search Images",
  description:
    "A simple image search application built with Next.js, Prisma, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-black`}
      >
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-700 shadow-md shadow-black/40">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-white"
            >
              ImageSearch
            </Link>
            <Link
              href="/statistics"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14v4" />
                <path d="M11 10v8" />
                <path d="M15 6v12" />
                <path d="M19 12v6" />
              </svg>
              <span>Statistics</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-3">{children}</main>
      </body>
    </html>
  );
}
