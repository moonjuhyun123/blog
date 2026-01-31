"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { analyticsVisit, me } from "../../lib/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    analyticsVisit().catch(() => {}); // 비동기 백그라운드, 렌더 블로킹 안 함
  }, []);

  useEffect(() => {
    me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isHome) {
      root.classList.add("no-scroll");
      body.classList.add("no-scroll", "is-home");
      window.scrollTo(0, 0);
    } else {
      root.classList.remove("no-scroll");
      body.classList.remove("no-scroll", "is-home");
    }

    return () => {
      root.classList.remove("no-scroll");
      body.classList.remove("no-scroll", "is-home");
    };
  }, [isHome]);

  return (
    <div className="app">
      <Nav authed={authed} onAuthedChange={setAuthed} />
      <div className={`container ${isHome ? "page-layer" : ""}`}>{children}</div>
    </div>
  );
}
