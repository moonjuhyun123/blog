import { notFound } from "next/navigation";

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

const REVALIDATE_SECONDS = 300;

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
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
      description: "요청한 게시글을 찾을 수 없습니다.",
    };
  }

  const description = buildDescription(post);
  const siteUrl = getSiteUrl();
  const url = new URL(`/posts/${params.slug}`, siteUrl).toString();

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
    },
  };
}

export const revalidate = REVALIDATE_SECONDS;

export default async function PostDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);
  if (!post) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
        <h1>게시글을 불러올 수 없습니다</h1>
        <p style={{ marginTop: 12, color: "#c67b00" }}>
          백엔드 서버 상태와 `API_BASE_URL`을 확인하세요.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>{post.title}</h1>
        <div style={{ color: "#888", fontSize: 13 }}>
          {post.category?.name ? `#${post.category.name}` : "#uncategorized"} ·{" "}
          {new Date(post.createdAt).toLocaleString()} · ❤ {post.likeCount}
        </div>
      </header>
      {post.contentHtml ? (
        <article dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      ) : post.contentMd ? (
        <article>
          <pre style={{ whiteSpace: "pre-wrap" }}>{post.contentMd}</pre>
        </article>
      ) : (
        <p>(내용 없음)</p>
      )}
    </main>
  );
}
