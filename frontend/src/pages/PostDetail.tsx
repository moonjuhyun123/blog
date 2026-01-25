import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getPost,
  toggleLike,
  listComments,
  createComment,
  deletePost,
  deleteComment,
  me,
  blockUser,
} from "../api/client";
import type { PostDetail as Detail, Comment, User } from "../api/types";
import PostViewer from "../components/PostViewer"; // ✅ Toast UI Viewer 컴포넌트

// ✅ Avatar (호스트 하드코딩 제거 + /files 접두사 자동 부착)
function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  const initials =
    name
      ?.trim()
      ?.split(/\s+/)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  const resolvedSrc = useMemo(() => {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src; // 절대 URL은 그대로
    const clean = src.startsWith("/") ? src : `/${src}`; // 상대 경로 보정
    // 서버의 정적 매핑이 /uploads/** 라는 전제
    return `/uploads${clean}`; // 배포땐 바꾸기
  }, [src]);

  return (
    <div className="avatar" title={name ?? "user"}>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name ?? "user"}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="avatar__initials">{initials}</span>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const [post, setPost] = useState<Detail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [blocking, setBlocking] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const nav = useNavigate();

  const isAdmin = user?.role === "ADMIN";
  const canBlockUser = () => !!user && isAdmin;

  // ✅ 게시글 관리 권한: 관리자 or 글 작성자
  const canManagePost = () => !!user && !!post && isAdmin;

  const blockAuthor = async (authorId: number) => {
    if (!confirm("이 사용자를 차단할까요?")) return;
    setBlocking((prev) => ({ ...prev, [authorId]: true }));
    try {
      await blockUser(authorId, true);
      await load();
    } finally {
      setBlocking((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  const unblockAuthor = async (authorId: number) => {
    if (!confirm("이 사용자의 차단을 해제할까요?")) return;
    setBlocking((prev) => ({ ...prev, [authorId]: true }));
    try {
      await blockUser(authorId, false);
      await load();
    } finally {
      setBlocking((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  const load = async () => {
    if (Number.isNaN(postId)) return;
    setLoading(true);
    try {
      const p = await getPost(postId);
      setPost(p);
      try {
        setComments(await listComments(postId));
      } catch {
        // 댓글 불러오기 실패해도 본문은 표시
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    me()
      .then(setUser)
      .catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const like = async () => {
    // 서버 응답 스펙에 맞게 처리 (res.likeCount 가정)
    const res = await toggleLike(postId);
    setPost((prev) => (prev ? { ...prev, likeCount: res.likeCount } : prev));
  };

  const addComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    if (text.length > 500) {
      alert("댓글은 500자 이하로 입력해주세요.");
      return;
    }
    setAddingComment(true);
    try {
      await createComment(postId, text);
      setNewComment("");
      await load();
    } finally {
      setAddingComment(false);
    }
  };

  const removePost = async () => {
    if (!confirm("게시글을 삭제할까요?")) return;
    await deletePost(postId);
    nav("/posts");
  };

  // ✅ 댓글 삭제 권한: 관리자 or 본인 댓글
  const canDeleteComment = (c: Comment) =>
    !!user && (isAdmin || user.id === c.author.id);

  const removeComment = async (commentId: number) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    await deleteComment(commentId);
    await load();
  };

  if (Number.isNaN(postId)) return <p>잘못된 접근입니다.</p>;
  if (loading && !post) return <p>Loading…</p>;
  if (!post) return <p>게시글을 찾을 수 없습니다.</p>;

  // ✅ 일반 사용자는 삭제된 댓글 비표시, 관리자는 모두 표시
  const visibleComments = isAdmin
    ? comments
    : comments.filter((c) => !c.deleted);

  return (
    <div>
      <div className="post__head">
        <h2>{post.title}</h2>
        <div className="meta">
          {post.category ? (
            <Link to={`/categories/${post.category.id}`}>
              #{post.category.name}
            </Link>
          ) : (
            <span>#uncategorized</span>
          )}
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* ✅ 본문 우상단 하트 고정 */}
      <article
        className="post__content"
        style={{ position: "relative", paddingTop: 40 }}
      >
        {/* ❤️ 좋아요 버튼 */}
        <button
          onClick={like}
          aria-label="좋아요"
          title="좋아요"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "transparent",
            border: "none",
            borderRadius: "50%",
            padding: "6px 10px",
            lineHeight: 1,
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "1.2rem",
            transition: "color 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#eb4b4b";
            e.currentTarget.style.transform = "scale(1.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1.2)";
          }}
        >
          ❤ {post.likeCount}
        </button>

        {/* ✅ Markdown 렌더: Toast UI Viewer 사용 (contentHtml 있으면 그걸 우선 표시하고 싶다면 DOMPurify 등을 병행 권장) */}
        {post.contentMd ? (
          <PostViewer content={post.contentMd} />
        ) : post.contentHtml ? (
          <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        ) : (
          <p>(내용 없음)</p>
        )}
      </article>

      <div
        className="actions"
        style={{ marginTop: 12, display: "flex", gap: 8 }}
      >
        {canManagePost() && (
          <>
            <Link to={`/posts/${post.id}/edit`} className="btn">
              Edit
            </Link>
            <button className="btn danger" onClick={removePost}>
              Delete
            </button>
          </>
        )}
      </div>

      <section className="comments">
        <h3>Comments</h3>
        <div className="comment__new">
          <input
            placeholder="Write a comment (max 500)…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
          />
          <button
            onClick={addComment}
            disabled={addingComment || newComment.trim().length === 0}
          >
            {addingComment ? "Adding…" : "Add"}
          </button>
        </div>

        <ul className="comment__list">
          {visibleComments.map((c) => {
            const avatarUrl =
              (c.author as any)?.avatarUrl ??
              (c.author as any)?.imageUrl ??
              (c.author as any)?.profileImageUrl ??
              null;

            const displayName = c.author?.displayName ?? "user";

            return (
              <li key={c.id} className="comment__item">
                <div className="comment__row">
                  <Avatar name={displayName} src={avatarUrl} />
                  <div className="comment__body">
                    <div className="comment__meta">
                      <b className="comment__name">{displayName}</b>
                      <span className="comment__date">
                        {c.createdAt && new Date(c.createdAt).toLocaleString()}
                      </span>
                      {c.deleted && <span className="badge">deleted</span>}

                      {canDeleteComment(c) && !c.deleted && (
                        <button
                          className="btn danger"
                          onClick={() => removeComment(c.id)}
                        >
                          삭제
                        </button>
                      )}

                      {canBlockUser() && (
                        <>
                          <button
                            className="btn danger"
                            style={{ marginLeft: 6 }}
                            onClick={() => blockAuthor(c.author.id)}
                            disabled={!!blocking[c.author.id]}
                            title="사용자 차단"
                          >
                            차단
                          </button>
                          <button
                            className="btn"
                            style={{ marginLeft: 6 }}
                            onClick={() => unblockAuthor(c.author.id)}
                            disabled={!!blocking[c.author.id]}
                            title="차단 해제"
                          >
                            차단 해제
                          </button>
                        </>
                      )}
                    </div>

                    <p
                      className="comment__text"
                      style={{ opacity: c.deleted ? 0.6 : 1 }}
                    >
                      {c.deleted ? "(삭제된 댓글입니다)" : c.content}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
