import type { Metadata } from "next";
import CategoriesClient from "./CategoriesClient";

const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "CATEGORIES",
  description: "카테고리별로 게시글을 찾아봅니다.",
  alternates: { canonical: `${siteUrl}/categories` },
  openGraph: {
    title: "CATEGORIES",
    description: "카테고리별로 게시글을 찾아봅니다.",
    url: `${siteUrl}/categories`,
    type: "website",
    images: [{ url: `${siteUrl}/shield.png` }],
  },
  twitter: {
    card: "summary",
    title: "CATEGORIES",
    description: "카테고리별로 게시글을 찾아봅니다.",
    images: [`${siteUrl}/shield.png`],
  },
};

type CategorySummary = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  postCount: number;
};

function getApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not set in next-seo/.env.local");
  }
  return baseUrl.replace(/\/+$/, "");
}

async function fetchCategories(): Promise<CategorySummary[] | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/categories/summary?includePrivate=false`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CategoriesPage() {
  const initialCategories = await fetchCategories();
  return <CategoriesClient initialCategories={initialCategories} />;
}
