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
        <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900 shadow-md shadow-black/40">
          <div className="container mx-auto px-4 py-3">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-white"
            >
              ImageSearch
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-3">{children}</main>
      </body>
    </html>
  );
}
