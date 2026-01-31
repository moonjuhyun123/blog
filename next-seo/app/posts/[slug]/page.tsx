import { notFound } from "next/navigation";
import PostInteractions from "../../components/PostInteractions";

type PostDetail = {
  id: number;
  title: string;
  category?: { id: number; name: string; slug: string } | null;
  likeCount: number;
  isPrivate: boolean;
  createdAt: string;
  contentMd?: string | null;
  contentHtml?: string | null;
  updatedAt?: string | null;
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

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildDescription(post: PostDetail) {
  const raw =
    post.contentHtml?.trim() ||
    post.contentMd?.trim() ||
    `${post.title} 게시글입니다.`;
  const clean = stripHtml(raw);
  return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean;
}

async function fetchPost(slug: string): Promise<PostDetail | null> {
  const id = Number(slug);
  if (Number.isNaN(id)) return null;

  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
      description: "요청한 게시글을 찾을 수 없습니다.",
    };
  }

  const description = buildDescription(post);
  const siteUrl = getSiteUrl();
  const url = new URL(`/posts/${slug}`, siteUrl).toString();

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? post.createdAt,
      images: [{ url: new URL("/shield.png", siteUrl).toString() }],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
      images: [new URL("/shield.png", siteUrl).toString()],
    },
  };
}

export const revalidate = 0;

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) {
    return (
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <h1>게시글을 불러올 수 없습니다</h1>
        <p style={{ marginTop: 12, color: "#c67b00" }}>
          백엔드 서버 상태와 `API_BASE_URL`을 확인하세요.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>{post.title}</h1>
        <div style={{ color: "#888", fontSize: 13 }}>
          {post.category?.name ? `#${post.category.name}` : "#uncategorized"} ·{" "}
          {new Date(post.createdAt).toLocaleString()} · ❤ {post.likeCount}
        </div>
      </header>
      <article className="post__content" style={{ position: "relative" }}>
        {post.contentHtml || post.contentMd ? (
          <div
            dangerouslySetInnerHTML={{
              __html: post.contentHtml || post.contentMd || "",
            }}
          />
        ) : (
          <p>(내용 없음)</p>
        )}
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            datePublished: post.createdAt,
            dateModified: post.updatedAt ?? post.createdAt,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": new URL(`/posts/${post.id}`, getSiteUrl()).toString(),
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
      <PostInteractions postId={post.id} initialLikeCount={post.likeCount} />
    </main>
  );
}
