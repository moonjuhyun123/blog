import type { Metadata } from "next";
import MatrixRain from "./components/MatrixRain";
import IntroPane from "./components/IntroPane";

const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IT MOON",
  description: "보안과 개발 이야기를 담는 블로그",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "IT MOON",
    description: "보안과 개발 이야기를 담는 블로그",
    url: siteUrl,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "IT MOON",
    description: "보안과 개발 이야기를 담는 블로그",
  },
};

export default function Home() {
  return (
    <div className="app-viewport">
      <div className="bg-full">
        <MatrixRain fontSize={16} minSpeed={1.2} maxSpeed={2.6} />
      </div>
      <div className="overlay-center">
        <IntroPane />
      </div>
    </div>
  );
}
