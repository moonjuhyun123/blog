import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostDetail";
import PostCreate from "./pages/PostCreate";
import PostEdit from "./pages/PostEdit";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound.tsx";
import CategoryPosts from "./pages/CategoryPosts";
import { analyticsVisit, me } from "./api/client";
import "@toast-ui/editor/dist/toastui-editor.css";
import "prismjs/themes/prism.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    analyticsVisit().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  // ✅ 홈에서만 스크롤 완전 차단 (html+body 클래스 + 스크롤 이벤트 차단)
  useEffect(() => {
    const root = document.documentElement; // <html>
    const body = document.body;

    const prevent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 키보드 스크롤 키 차단
    const onKeydown = (e: KeyboardEvent) => {
      const keys = [
        " ",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];
      if (keys.includes(e.key)) {
        prevent(e);
      }
    };

    if (isHome) {
      root.classList.add("no-scroll");
      body.classList.add("no-scroll", "is-home");
      window.scrollTo(0, 0);

      // wheel / 터치 / 키보드 스크롤 차단
      window.addEventListener("wheel", prevent, { passive: false });
      window.addEventListener("touchmove", prevent, { passive: false });
      window.addEventListener("keydown", onKeydown, { passive: false });
    } else {
      root.classList.remove("no-scroll");
      body.classList.remove("no-scroll", "is-home");
    }

    return () => {
      window.removeEventListener("wheel", prevent as any);
      window.removeEventListener("touchmove", prevent as any);
      window.removeEventListener("keydown", onKeydown as any);
      root.classList.remove("no-scroll");
      body.classList.remove("no-scroll", "is-home");
    };
  }, [isHome]);

  if (!ready) return null;

  return (
    <div className="app">
      <Navbar authed={authed} onAuthedChange={setAuthed} />
      {/* 홈은 배경 위 레이어로만 떠 있게 */}
      <div className={`container ${isHome ? "page-layer" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              !authed ? (
                <Login onLogin={() => setAuthed(true)} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/register"
            element={
              !authed ? (
                <Register onRegistered={() => setAuthed(true)} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/posts" element={<PostList />} />
          <Route
            path="/posts/new"
            element={authed ? <PostCreate /> : <Navigate to="/login" />}
          />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route
            path="/posts/:id/edit"
            element={authed ? <PostEdit /> : <Navigate to="/login" />}
          />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:categoryId" element={<CategoryPosts />} />
          <Route
            path="/me"
            element={authed ? <Profile /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
