"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { analyticsSummary, logout, me } from "../../lib/api";
import type { User } from "../../lib/types";

export default function Nav({
  authed,
  onAuthedChange,
}: {
  authed: boolean;
  onAuthedChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [visit, setVisit] = useState<{
    dailyCount: number;
    totalCount: number;
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [visible, setVisible] = useState(isHome ? false : true);
  const navRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    analyticsSummary()
      .then(setVisit)
      .catch(() => setVisit(null));
    if (authed) {
      me()
        .then(setUser)
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [authed]);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }
    const onMove = (e: MouseEvent) => {
      if (e.clientY <= 50) setVisible(true);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    const el = navRef.current;
    if (!el) return;
    const onEnter = () => {
      setVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
    const onLeave = () => {
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 800);
    };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [isHome]);

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      onAuthedChange(false);
      router.push("/");
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      {isHome && (
        <div className="nav-triggerzone" onMouseEnter={() => setVisible(true)} />
      )}
      <nav
        ref={navRef}
        className={`nav ${isHome ? "auto-slide" : "fixed"} ${
          visible ? "show" : ""
        }`}
      >
        <div className="nav__inner">
          <div className="nav__left">
            <Link href="/" className="brand">
              IT MOON&nbsp;
            </Link>
            <Link href="/posts">&nbsp;FEED&nbsp;</Link>
            <Link href="/news">&nbsp;NEWS&nbsp;</Link>
            <Link href="/categories">&nbsp;CATEGORIES&nbsp;</Link>
          </div>
          <div className="nav__spacer" />
          <div className="nav__right">
            {visit && (
              <span className="badge" title="방문자 요약">
                오늘 {visit.dailyCount.toLocaleString()} / 총{" "}
                {visit.totalCount.toLocaleString()}
              </span>
            )}
            {authed ? (
              <>
                {isAdmin && <Link href="/posts/new">Write</Link>}
                <Link href="/me">My</Link>
                <button className="btn danger" onClick={doLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/register" className="btn">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
