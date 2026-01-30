"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { listCategorySummary, listPostsByCategory, me, pinPost } from "../../../lib/api";
import type { PageResponse, PostSummary, User } from "../../../lib/types";

export default function CategoryPostsClient({
  initialData,
  initialCategoryName,
  initialQueryKey,
}: {
  initialData?: PageResponse<PostSummary> | null;
  initialCategoryName?: string | null;
  initialQueryKey?: string;
}) {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categoryId = Number(params?.id);

  const [data, setData] = useState<PageResponse<PostSummary> | null>(
    initialData ?? null
  );
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState<string | null>(
    initialCategoryName ?? null
  );
  const [user, setUser] = useState<User | null>(null);

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

  useEffect(() => {
    if (initialCategoryName != null) return;
    listCategorySummary()
      .then((cats) => {
        setCategoryName(cats.find((c) => c.id === categoryId)?.name ?? null);
      })
      .catch(() => setCategoryName(null));
  }, [categoryId, initialCategoryName]);

  const load = async () => {
    if (Number.isNaN(categoryId)) return;
    setLoading(true);
    try {
      const res = await listPostsByCategory(categoryId, {
        page,
        size,
        title,
        includePrivate: user?.role === "ADMIN",
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const currentQueryKey = JSON.stringify({ categoryId, page, size, title });
  const skipFirstLoadRef = useRef(true);
  useEffect(() => {
    if (
      skipFirstLoadRef.current &&
      initialData &&
      initialQueryKey === currentQueryKey
    ) {
      skipFirstLoadRef.current = false;
      return;
    }
    skipFirstLoadRef.current = false;
    load();
  }, [categoryId, page, size, title, user?.role, currentQueryKey, initialData, initialQueryKey]);

  const setParams = (entries: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(entries)) {
      if (v !== undefined && v !== null && v !== "") next.set(k, String(v));
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const doSearch = () => setParams({ title: draftTitle, page: "0" });
  const clearSearch = () => {
    setDraftTitle("");
    setParams({ title: "", page: "0" });
  };

  const togglePin = async (id: number, nextPinned: boolean) => {
    await pinPost(id, nextPinned);
    await load();
  };

  if (Number.isNaN(categoryId)) {
    return <div className="card">잘못된 카테고리</div>;
  }

  return (
    <div>
      <h1>{categoryName ? `#${categoryName}` : "Category"}</h1>

      <div className="toolbar">
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
      </div>

      {loading && <p>Loading…</p>}

      <ul className="list">
        {data?.content.map((p) => (
          <li key={p.id} className="list__item">
            <a href={`/posts/${p.id}`} className="title">
              {p.title}
              {p.isPinned && <span className="badge" style={{ marginLeft: 8 }}>Pinned</span>}
            </a>
            <div className="meta">
              <span>❤ {p.likeCount}</span>
              {p.isPrivate && <span className="badge">Private</span>}
              <span>{new Date(p.createdAt).toLocaleString()}</span>
            </div>
            {user?.role === "ADMIN" && (
              <div className="row" style={{ marginTop: 6 }}>
                <button
                  className="btn"
                  onClick={() => togglePin(p.id, !p.isPinned)}
                >
                  {p.isPinned ? "Unpin" : "Pin"}
                </button>
              </div>
            )}
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
