import type { MetadataRoute } from "next";

// Sitemap is generated at runtime so Docker/CI build does not need a running backend.
export const dynamic = "force-dynamic";

type PostSummary = {
  id: number;
  createdAt: string;
};

type CategorySummary = {
  id: number;
};

type PageResponse<T> = {
  content: T[];
};

type NewsBriefingSummary = {
  briefingDate: string;
};

function getApiBaseUrl(): string | null {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) return null;
  return baseUrl.replace(/\/+$/, "");
}

function getSiteUrl() {
  return process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
}

async function fetchPostsForSitemap(): Promise<PostSummary[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return [];
  try {
    const params = new URLSearchParams({
      page: "0",
      size: "1000",
      includePrivate: "false",
    });
    const res = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data: PageResponse<PostSummary> = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}

async function fetchCategoriesForSitemap(): Promise<CategorySummary[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return [];
  try {
    const params = new URLSearchParams({ includePrivate: "false" });
    const res = await fetch(`${baseUrl}/api/categories/summary?${params.toString()}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchNewsForSitemap(): Promise<NewsBriefingSummary[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}/api/news`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [posts, categories, news] = await Promise.all([
    fetchPostsForSitemap(),
    fetchCategoriesForSitemap(),
    fetchNewsForSitemap(),
  ]);

  const postUrls = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
  }));

  const categoryUrls = categories.map((category) => ({
    url: `${siteUrl}/categories/${category.id}`,
    lastModified: new Date(),
  }));

  const newsUrls = news.map((item) => ({
    url: `${siteUrl}/news/${item.briefingDate}`,
    lastModified: new Date(item.briefingDate),
  }));

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/posts`, lastModified: new Date() },
    { url: `${siteUrl}/news`, lastModified: new Date() },
    { url: `${siteUrl}/categories`, lastModified: new Date() },
    ...postUrls,
    ...categoryUrls,
    ...newsUrls,
  ];
}
