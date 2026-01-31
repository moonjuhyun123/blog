import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT MOON",
  description: "보안과 개발 이야기를 담는 블로그",
  metadataBase: new URL(
    process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000"
  ),
  icons: {
    icon: "/shield.png",
    shortcut: "/shield.png",
    apple: "/shield.png",
  },
  openGraph: {
    title: "IT MOON",
    description: "보안과 개발 이야기를 담는 블로그",
    siteName: "IT MOON",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/shield.png" }],
  },
  twitter: {
    card: "summary",
    title: "IT MOON",
    description: "보안과 개발 이야기를 담는 블로그",
    images: ["/shield.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
