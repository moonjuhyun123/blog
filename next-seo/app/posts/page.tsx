type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  error?: string;
};

type PostSummary = {
  id: number;
  title: string;
  category?: { id: number; name: string; slug: string } | null;
  likeCount: number;
  isPrivate: boolean;
  createdAt: string;
};

const REVALIDATE_SECONDS = 300;

function getApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not set in next-seo/.env.local");
  }
  return baseUrl.replace(/\/+$/, "");
}

async function fetchPosts(): Promise<PageResponse<PostSummary>> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    page: "0",
    size: "50",
    includePrivate: "false",
  });
  try {
    const res = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      return {
        content: [],
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 1,
        error: `API error: ${res.status}`,
      };
    }

    return res.json();
  } catch (err) {
    return {
      content: [],
      page: 0,
      size: 0,
      totalElements: 0,
      totalPages: 1,
      error: "API connection failed",
    };
  }
}

export const revalidate = REVALIDATE_SECONDS;

export default async function PostsPage() {
  const data = await fetchPosts();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <h1>Posts</h1>
      {data.error && (
        <p style={{ marginTop: 12, color: "#c67b00" }}>
          게시글 API에 연결할 수 없습니다. 백엔드 서버 상태와
          `API_BASE_URL`을 확인하세요.
        </p>
      )}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {data.content.map((post) => (
          <li key={post.id} style={{ padding: "12px 0", borderBottom: "1px solid #222" }}>
            <a href={`/posts/${post.id}`} style={{ fontSize: 20, fontWeight: 600 }}>
              {post.title}
            </a>
            <div style={{ marginTop: 6, color: "#888", fontSize: 13 }}>
              {post.category?.name ? `#${post.category.name}` : "#uncategorized"} ·{" "}
              {new Date(post.createdAt).toLocaleString()} · ❤ {post.likeCount}
              {post.isPrivate && <span style={{ marginLeft: 8 }}>(Private)</span>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
