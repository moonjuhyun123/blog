import type { Metadata } from "next";
import NewsInteractions from "../../components/NewsInteractions";

type NewsDetail = {
  id: number;
  briefingDate: string;
  contentHtml: string;
  createdAt: string;
  likeCount: number;
};

const REVALIDATE_SECONDS = 0;

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

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildDescription(item: NewsDetail) {
  const raw = item.contentHtml?.trim() || `${item.briefingDate} 보안 뉴스`;
  const clean = stripHtml(raw);
  return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean;
}

async function fetchNews(date: string): Promise<NewsDetail | null> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/news/${date}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const item = await fetchNews(date);
  if (!item) {
    return {
      title: "뉴스를 찾을 수 없습니다",
      description: "요청한 보안 뉴스가 없습니다.",
    };
  }

  const description = buildDescription(item);
  const siteUrl = getSiteUrl();
  const url = new URL(`/news/${date}`, siteUrl).toString();

  return {
    title: `${date} 주요 보안 뉴스`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${date} 주요 보안 뉴스`,
      description,
      type: "article",
      url,
      images: [{ url: new URL("/shield.png", siteUrl).toString() }],
    },
    twitter: {
      card: "summary",
      title: `${date} 주요 보안 뉴스`,
      description,
      images: [new URL("/shield.png", siteUrl).toString()],
    },
  };
}

export const revalidate = REVALIDATE_SECONDS;

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const item = await fetchNews(date);

  if (!item) {
    return (
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <h1>뉴스를 불러올 수 없습니다</h1>
        <p style={{ marginTop: 12, color: "#c67b00" }}>
          백엔드 서버 상태와 `API_BASE_URL`을 확인하세요.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>{date} 주요 보안 뉴스</h1>
        <div style={{ color: "#888", fontSize: 13 }}>
          {new Date(item.briefingDate).toLocaleDateString("ko-KR")} · ❤{" "}
          {item.likeCount}
        </div>
      </header>

      <article className="post__content" style={{ position: "relative" }}>
        <div dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: `${date} 주요 보안 뉴스`,
            datePublished: item.createdAt ?? item.briefingDate,
            dateModified: item.createdAt ?? item.briefingDate,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": new URL(`/news/${date}`, getSiteUrl()).toString(),
            },
            author: {
              "@type": "Organization",
              name: "IT MOON",
            },
            publisher: {
              "@type": "Organization",
              name: "IT MOON",
            },
          }),
        }}
      />
      <NewsInteractions newsId={item.id} initialLikeCount={item.likeCount} />
    </main>
  );
}
