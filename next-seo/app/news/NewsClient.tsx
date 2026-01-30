"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listNews, me, runNewsBriefing } from "../../lib/api";
import type { NewsBriefing, User } from "../../lib/types";

export default function NewsClient({
  initialItems,
  initialFilters,
}: {
  initialItems?: NewsBriefing[] | null;
  initialFilters?: { from?: string; to?: string; q?: string };
}) {
  const [items, setItems] = useState<NewsBriefing[]>(initialItems ?? []);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const [from, setFrom] = useState(initialFilters?.from ?? "");
  const [to, setTo] = useState(initialFilters?.to ?? "");
  const [q, setQ] = useState(initialFilters?.q ?? "");
  const isInvalidRange = !!from && !!to && from > to;

  const load = (params?: { from?: string | null; to?: string | null; q?: string }) => {
    setLoading(true);
    const raw = params ?? { from, to, q };
    const target = {
      from: raw.from ?? undefined,
      to: raw.to ?? undefined,
      q: raw.q,
    };
    listNews(target)
      .then((data) => setItems(data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const initialKey = JSON.stringify(initialFilters ?? {});
  const currentKey = JSON.stringify({ from, to, q });
  const skipFirstLoadRef = useRef(true);
  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
    if (
      skipFirstLoadRef.current &&
      initialItems &&
      initialKey === currentKey
    ) {
      skipFirstLoadRef.current = false;
      return;
    }
    skipFirstLoadRef.current = false;
    load();
  }, []);

  const doSearch = () => {
    if (isInvalidRange) {
      setSearchError("시작 날짜는 종료 날짜보다 늦을 수 없습니다.");
      return;
    }
    setSearchError(null);
    load({ from, to, q });
  };

  const clearSearch = () => {
    setFrom("");
    setTo("");
    setQ("");
    setSearchError(null);
    load({});
  };

  const runBriefing = async () => {
    setError(null);
    setRunning(true);
    try {
      await runNewsBriefing();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to run briefing";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <h1>NEWS</h1>
      <div className="toolbar">
        <div className="searchbar">
          <input
            type="date"
            className="searchbar__input news-date-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
            max={to || undefined}
          />
          <input
            type="date"
            className="searchbar__input news-date-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
            min={from || undefined}
          />
          <input
            className="searchbar__input"
            placeholder="Search content…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className="searchbar__btn"
            onClick={doSearch}
            disabled={isInvalidRange}
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

          {(from || to || q) && (
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
          <button className="btn" onClick={runBriefing} disabled={running}>
            {running ? "Running…" : "Run briefing"}
          </button>
        )}
      </div>

      {error && <p className="err">{error}</p>}
      {searchError && <p className="err">{searchError}</p>}
      {loading && <p>Loading…</p>}
      {!loading && items.length === 0 && <p>No news yet.</p>}
      <ul className="list">
        {items.map((item) => (
          <li key={item.id} className="list__item">
            <Link href={`/news/${item.briefingDate}`} className="title">
              {item.briefingDate} 주요 보안 뉴스
            </Link>
            <div className="meta">
              <span>❤ {item.likeCount}</span>
              <span>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : new Date(item.briefingDate).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
