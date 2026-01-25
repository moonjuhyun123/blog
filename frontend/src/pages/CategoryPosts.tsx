import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { listPostsByCategory } from "../api/client";
import type { PageResponsePostSummary } from "../api/types";

export default function CategoryPosts() {
  const { categoryId } = useParams();
  const cid = Number(categoryId);
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<PageResponsePostSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const loc = useLocation() as { state?: { slug?: string; name?: string } };

  const page = Number(sp.get("page") ?? 0);
  const size = Number(sp.get("size") ?? 10);
  const title = sp.get("title") ?? "";

  // 🔍 입력값은 별도의 draft로 관리 (쿼리와 분리)
  const [draftTitle, setDraftTitle] = useState(title);
  useEffect(() => setDraftTitle(title), [title]);

  const setParams = (entries: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(entries)) {
      if (v !== undefined && v !== null && v !== "") next.set(k, String(v));
      else next.delete(k);
    }
    setSp(next, { replace: true });
  };

  const doSearch = () => setParams({ title: draftTitle, page: "0" });
  const clearSearch = () => {
    setDraftTitle("");
    setParams({ title: "", page: "0" });
  };

  const load = async () => {
    if (Number.isNaN(cid)) return;
    setLoading(true);
    try {
      const res = await listPostsByCategory(cid, { page, size, title });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [cid, page, size, title]);

  if (Number.isNaN(cid)) return <p>Invalid category</p>;

  const inferredSlug =
    loc.state?.slug || (data?.content?.[0]?.category?.slug ?? undefined);
  const inferredName =
    loc.state?.name || (data?.content?.[0]?.category?.name ?? undefined);

  return (
    <div>
      <h1>{inferredSlug ? `#${inferredName}` : `#${cid}`}</h1>

      <div className="toolbar">
        {/* 🔍 검색창 + X버튼 (PostList와 동일 패턴) */}
        <div className="searchbar">
          <input
            className="searchbar__input"
            placeholder="Search title…"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
          <button
            type="button"
            className="searchbar__btn"
            onClick={doSearch}
            aria-label="Search"
            title="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {draftTitle && (
            <button
              type="button"
              className="searchbar__clear"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <Link to="/posts" className="btn">
          All Posts
        </Link>
      </div>

      {loading && <p>Loading…</p>}

      <ul className="list">
        {data?.content.map((p) => (
          <li key={p.id} className="list__item">
            <Link to={`/posts/${p.id}`} className="title">
              {p.title}
            </Link>
            <div className="meta">
              {p.category && (
                <Link
                  to={`/categories/${p.category.id}`}
                  state={{ slug: p.category.slug, name: p.category.name }}
                  title={p.category.name}
                >
                  #{p.category.name}
                </Link>
              )}
              <span>❤ {p.likeCount}</span>
              {p.isPrivate && <span className="badge">Private</span>}
              <span>{new Date(p.createdAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="pager">
        <button
          disabled={!data || page <= 0}
          onClick={() => setParams({ page: String(page - 1) })}
        >
          Prev
        </button>
        <span>
          {page + 1} / {data?.totalPages ?? 1}
        </span>
        <button
          disabled={!data || page + 1 >= (data?.totalPages ?? 1)}
          onClick={() => setParams({ page: String(page + 1) })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
