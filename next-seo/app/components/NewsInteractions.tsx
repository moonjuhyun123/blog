"use client";

import { useEffect, useMemo, useState } from "react";
import {
  blockUser,
  createNewsComment,
  deleteNewsComment,
  listNewsComments,
  me,
  toggleNewsLike,
} from "../../lib/api";
import type { Comment, User } from "../../lib/types";

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
    if (/^https?:\/\//i.test(src)) return src;
    const clean = src.startsWith("/") ? src : `/${src}`;
    return `/uploads${clean}`;
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

export default function NewsInteractions({
  newsId,
  initialLikeCount,
}: {
  newsId: number;
  initialLikeCount: number;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [blocking, setBlocking] = useState<Record<number, boolean>>({});
  const [addingComment, setAddingComment] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
    listNewsComments(newsId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [newsId]);

  const like = async () => {
    const res = await toggleNewsLike(newsId);
    setLikeCount(res.likeCount);
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
      await createNewsComment(newsId, text);
      setNewComment("");
      setComments(await listNewsComments(newsId));
    } finally {
      setAddingComment(false);
    }
  };

  const canDeleteComment = (c: Comment) =>
    !!user && (isAdmin || user.id === c.author.id);

  const removeComment = async (commentId: number) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    await deleteNewsComment(commentId);
    setComments(await listNewsComments(newsId));
  };

  const blockAuthor = async (authorId: number, blocked: boolean) => {
    if (!confirm(blocked ? "이 사용자를 차단할까요?" : "차단을 해제할까요?"))
      return;
    setBlocking((prev) => ({ ...prev, [authorId]: true }));
    try {
      await blockUser(authorId, blocked);
      setComments(await listNewsComments(newsId));
    } finally {
      setBlocking((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  const visibleComments = isAdmin
    ? comments
    : comments.filter((c) => !c.deleted);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={like}
          aria-label="좋아요"
          title="좋아요"
          style={{
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
          ❤ {likeCount}
        </button>
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
            const avatarUrl = c.author?.profileImageUrl ?? null;
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

                      {isAdmin && (
                        <>
                          <button
                            className="btn danger"
                            style={{ marginLeft: 6 }}
                            onClick={() => blockAuthor(c.author.id, true)}
                            disabled={!!blocking[c.author.id]}
                            title="사용자 차단"
                          >
                            차단
                          </button>
                          <button
                            className="btn"
                            style={{ marginLeft: 6 }}
                            onClick={() => blockAuthor(c.author.id, false)}
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
