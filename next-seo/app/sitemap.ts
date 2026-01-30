import type { MetadataRoute } from "next";

type PostSummary = {
  id: number;
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
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

async function fetchPostsForSitemap(): Promise<PostSummary[]> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    page: "0",
    size: "1000",
    includePrivate: "false",
  });

  const res = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    return [];
  }

  const data: PageResponse<PostSummary> = await res.json();
  return data.content ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const posts = await fetchPostsForSitemap();

  const postUrls = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.id}`,
    lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
  }));

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/posts`, lastModified: new Date() },
    ...postUrls,
  ];
}
