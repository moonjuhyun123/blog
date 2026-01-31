import type { Metadata } from "next";
import PostsClient from "./PostsClient";
import type { PageResponse, PostSummary } from "../../lib/types";

const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FEED",
  description: "최신 게시글을 모아봅니다.",
  alternates: { canonical: `${siteUrl}/posts` },
  openGraph: {
    title: "FEED",
    description: "최신 게시글을 모아봅니다.",
    url: `${siteUrl}/posts`,
    type: "website",
    images: [{ url: `${siteUrl}/shield.png` }],
  },
  twitter: {
    card: "summary",
    title: "FEED",
    description: "최신 게시글을 모아봅니다.",
    images: [`${siteUrl}/shield.png`],
  },
};

type SearchParams = {
  page?: string | string[];
  size?: string | string[];
  title?: string | string[];
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

async function fetchPosts(sp: SearchParams): Promise<PageResponse<PostSummary> | null> {
  const baseUrl = getApiBaseUrl();
  const usp = new URLSearchParams();
  const page = getFirst(sp.page);
  const size = getFirst(sp.size);
  const title = getFirst(sp.title);
  if (page) usp.set("page", page);
  if (size) usp.set("size", size);
  if (title) usp.set("title", title);
  const qs = usp.toString();
  try {
    const res = await fetch(`${baseUrl}/api/posts${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(getFirst(sp.page) ?? 0);
  const size = Number(getFirst(sp.size) ?? 10);
  const title = getFirst(sp.title) ?? "";
  const initialQueryKey = JSON.stringify({ page, size, title });
  const initialData = await fetchPosts(sp);

  return <PostsClient initialData={initialData} initialQueryKey={initialQueryKey} />;
}
