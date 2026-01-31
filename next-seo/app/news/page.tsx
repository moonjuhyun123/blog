import type { Metadata } from "next";
import NewsClient from "./NewsClient";
import type { NewsBriefing } from "../../lib/types";

const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NEWS",
  description: "보안 브리핑과 최신 보안 뉴스를 모아봅니다.",
  alternates: { canonical: `${siteUrl}/news` },
  openGraph: {
    title: "NEWS",
    description: "보안 브리핑과 최신 보안 뉴스를 모아봅니다.",
    url: `${siteUrl}/news`,
    type: "website",
    images: [{ url: `${siteUrl}/shield.png` }],
  },
  twitter: {
    card: "summary",
    title: "NEWS",
    description: "보안 브리핑과 최신 보안 뉴스를 모아봅니다.",
    images: [`${siteUrl}/shield.png`],
  },
};

type SearchParams = {
  from?: string | string[];
  to?: string | string[];
  q?: string | string[];
};

function getApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not set in next-seo/.env.local");
  }
  return baseUrl.replace(/\/+$/, "");
}

function getFirst(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function fetchNews(sp: SearchParams): Promise<NewsBriefing[] | null> {
  const baseUrl = getApiBaseUrl();
  const usp = new URLSearchParams();
  const from = getFirst(sp.from);
  const to = getFirst(sp.to);
  const q = getFirst(sp.q);
  if (from) usp.set("from", from);
  if (to) usp.set("to", to);
  if (q) usp.set("q", q);
  const qs = usp.toString();
  try {
    const res = await fetch(`${baseUrl}/api/news${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const from = getFirst(sp.from);
  const to = getFirst(sp.to);
  const q = getFirst(sp.q);
  const initialFilters = { from, to, q };
  const initialItems = await fetchNews(sp);
  return <NewsClient initialItems={initialItems} initialFilters={initialFilters} />;
}
