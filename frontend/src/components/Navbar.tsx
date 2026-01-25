import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout, analyticsSummary, me } from "../api/client";
import { useEffect, useRef, useState } from "react";
import type { User } from "../api/types";

export default function Navbar({
  authed,
  onAuthedChange,
}: {
  authed: boolean;
  onAuthedChange: (v: boolean) => void;
}) {
  const nav = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/"; // 홈 화면 여부 확인

  const [visit, setVisit] = useState<{
    dailyCount: number;
    totalCount: number;
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [visible, setVisible] = useState(isHome ? false : true); // 홈일 때만 감춤
  const navRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    analyticsSummary()
      .then(setVisit)
      .catch(() => setVisit(null));
    if (authed)
      me()
        .then(setUser)
        .catch(() => setUser(null));
    else setUser(null);
  }, [authed]);

  // 🟢 홈 화면일 때만 마우스 감지
  useEffect(() => {
    if (!isHome) {
      setVisible(true); // 홈 아니면 항상 보이게
      return;
    }

    const onMove = (e: MouseEvent) => {
      if (e.clientY <= 50) setVisible(true);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isHome]);

  // 🟢 홈 화면일 때만 자동 숨김 처리
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
      nav("/");
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      {/* 화면 상단 트리거존 (홈 화면에서만 활성화) */}
      {isHome && (
        <div
          className="nav-triggerzone"
          onMouseEnter={() => setVisible(true)}
        />
      )}

      <nav
        ref={navRef}
        className={`nav ${isHome ? "auto-slide" : "fixed"} ${
          visible ? "show" : ""
        }`}
      >
        <div className="nav__inner">
          <div className="nav__left">
            <Link to="/" className="brand">
              IT MOON&nbsp;
            </Link>
            <Link to="/posts">&nbsp;FEED&nbsp;</Link>
            <Link to="/categories">&nbsp;CATEGORIES&nbsp;</Link>
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
                {isAdmin && <Link to="/posts/new">Write</Link>}
                <Link to="/me">My</Link>
                <button className="btn danger" onClick={doLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register" className="btn">
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
