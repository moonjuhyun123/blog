import type { Metadata } from "next";
import CategoryPostsClient from "./CategoryPostsClient";
import type { PageResponse, PostSummary } from "../../../lib/types";

type CategorySummary = {
  id: number;
  name: string;
};

function getApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not set in next-seo/.env.local");
  }
  return baseUrl.replace(/\/+$/, "");
}

function getSiteUrl() {
  return process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
}

async function fetchCategoryName(id: string): Promise<string | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${baseUrl}/api/categories/summary?includePrivate=false`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data: CategorySummary[] = await res.json();
    return data.find((c) => c.id === Number(id))?.name ?? null;
  } catch {
    return null;
  }
}

function getFirst(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

type SearchParams = {
  page?: string | string[];
  size?: string | string[];
  title?: string | string[];
};

async function fetchCategoryPosts(
  id: string,
  sp: SearchParams
): Promise<PageResponse<PostSummary> | null> {
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
    const res = await fetch(
      `${baseUrl}/api/categories/${id}/posts${qs ? `?${qs}` : ""}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = await fetchCategoryName(id);
  const title = name ? `#${name}` : `Category ${id}`;
  const description = name
    ? `#${name} 카테고리의 게시글 모음입니다.`
    : "카테고리 게시글 모음입니다.";
  const siteUrl = getSiteUrl();
  const url = new URL(`/categories/${id}`, siteUrl).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: new URL("/shield.png", siteUrl).toString() }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [new URL("/shield.png", siteUrl).toString()],
    },
  };
}

export default async function CategoryPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const initialCategoryName = await fetchCategoryName(id);
  const initialData = await fetchCategoryPosts(id, sp);
  const page = Number(getFirst(sp.page) ?? 0);
  const size = Number(getFirst(sp.size) ?? 10);
  const title = getFirst(sp.title) ?? "";
  const initialQueryKey = JSON.stringify({ categoryId: Number(id), page, size, title });

  return (
    <CategoryPostsClient
      initialData={initialData}
      initialCategoryName={initialCategoryName}
      initialQueryKey={initialQueryKey}
    />
  );
}
