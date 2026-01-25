import { useEffect, useState } from "react";
import { getPost } from "../api/client";

type PostDetail = {
  id: number;
  title?: string | null;
  content?: string | null;
  contentHtml?: string | null;
};

export default function IntroPane() {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPost(1);
        setPost(data);
      } catch {
        setPost({
          id: 1,
          title: "About Me",
          content:
            "안녕하세요! 해커 감성의 개인 사이트입니다.\n\n" +
            "이 중앙 패널에는 '게시글 1번의 본문'이 표시되고,\n" +
            "뒤에는 0과 1이 흘러내리는 코드비 애니메이션이 깔립니다.\n\n" +
            "긴 본문은 화면 안에 맞게 자동 말줄임 처리됩니다.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="center-panel neon-border">
      <div className="panel-header">
        <span className="header-dot" />
        <h1 className="neon" style={{ fontSize: 22, margin: 0 }}>
          {post?.title ?? "게시글 #1"}
        </h1>
      </div>

      {loading ? (
        <p className="neon">로딩 중...</p>
      ) : post?.contentHtml ? (
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      ) : (
        <div className="content-body">
          {(post?.content ?? "").split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}
