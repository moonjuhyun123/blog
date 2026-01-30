import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPosts, me } from "../api/client";
import type { PageResponsePostSummary, User } from "../api/types";

export default function PostList() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<PageResponsePostSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const page = Number(sp.get("page") ?? 0);
  const size = Number(sp.get("size") ?? 10);
  const title = sp.get("title") ?? "";

  const [draftTitle, setDraftTitle] = useState(title);
  useEffect(() => setDraftTitle(title), [title]);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPosts({ page, size, title });
      setData(res);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [page, size, title]);

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

  return (
    <div>
      <h1>FEED</h1>

      <div className="toolbar">
        {/* 🔍 검색창 + X버튼 */}
        <div className="searchbar">
          <input
            className="searchbar__input"
            placeholder="Search title…"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
          />

          <button
            type="button"
            className="searchbar__btn"
            onClick={doSearch}
            aria-label="Search"
            title="Search"
          >
            {/* 돋보기 */}
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

        {isAdmin && (
          <Link to="/posts/new" className="btn">
            Write
          </Link>
        )}
      </div>

      {loading && <p>Loading…</p>}

      <ul className="list">
        {data?.content.map((p) => (
          <li key={p.id} className="list__item">
            {/* SEO 전용 Next 라우트는 <a href={`/posts/${p.id}`}> 형태로 이동하도록 안내 */}
            <Link to={`/posts/${p.id}`} className="title">
              {p.title}
            </Link>
            <div className="meta">
              <Link to={`/categories/${p.category.id}`}>
                #{p.category?.name}
              </Link>
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
