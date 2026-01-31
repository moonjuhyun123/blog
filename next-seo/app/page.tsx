import type { Metadata } from "next";
import MatrixRain from "./components/MatrixRain";
import IntroPane from "./components/IntroPane";

type PinnedPost = {
  id: number;
  title: string;
  contentHtml?: string | null;
  contentMd?: string | null;
};

function getApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not set in next-seo/.env.local");
  }
  return baseUrl.replace(/\/+$/, "");
}

async function fetchPinnedPost(): Promise<PinnedPost | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/posts/pinned`, { cache: "no-store" });
    if (res.status === 204) return null;
    if (!res.ok) return null;
    const summary = (await res.json()) as { id: number };
    if (!summary?.id) return null;
    const detailRes = await fetch(`${baseUrl}/api/posts/${summary.id}`, {
      cache: "no-store",
    });
    if (!detailRes.ok) return null;
    return detailRes.json();
  } catch {
    return null;
  }
}

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

export default async function Home() {
  const pinned = await fetchPinnedPost();
  return (
    <div className="app-viewport">
      <div className="bg-full">
        <MatrixRain fontSize={16} minSpeed={1.2} maxSpeed={2.6} />
      </div>
      <div className="overlay-center">
        <IntroPane />
        {pinned && <div style={{ marginTop: 16 }} />}
      </div>
    </div>
  );
}
