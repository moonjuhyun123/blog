import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  me,
  listCategorySummary, // ← 요약 API (postCount 포함)
} from "../api/client";
import type { User } from "../api/types";
import { useNavigate } from "react-router-dom";

type CategorySummary = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  postCount: number;
};

export default function Categories() {
  const [cats, setCats] = useState<CategorySummary[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const nav = useNavigate();

  const load = async () => setCats(await listCategorySummary());

  useEffect(() => {
    load();
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategory(name.trim());
    setName("");
    await load(); // 새로 만든 카테고리 반영
  };

  const remove = async (id: number) => {
    if (!confirm("이 카테고리를 삭제할까요?")) return;
    await deleteCategory(id);
    await load();
  };

  const startEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    await updateCategory(id, editName.trim());
    setEditingId(null);
    setEditName("");
    await load();
  };

  return (
    <div>
      <h1>CATEGORIES</h1>

      {/* 생성 (ADMIN 전용) */}
      {isAdmin && (
        <form onSubmit={add} className="row" style={{ marginBottom: 16 }}>
          <input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn">Add</button>
        </form>
      )}

      <ul className="list" style={{ marginTop: 12 }}>
        {cats.map((c) => (
          <li
            key={c.id}
            className="list__item"
            style={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() =>
              nav(`/categories/${c.id}`, {
                state: { slug: c.slug, name: c.name },
              })
            }
          >
            {/* 왼쪽: slug 강조, name 보조 */}
            <div>
              {editingId === c.id ? (
                <div className="row" style={{ gap: 8 }}>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // 수정 중 클릭시 이동 방지
                  />
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(c.id);
                    }}
                  >
                    저장
                  </button>
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <span className="title" style={{ fontSize: "1.3em" }}>
                    #{c.name}
                  </span>{" "}
                  {/* <span className="meta">
                    {c.name} (id: {c.id})
                  </span> */}
                </>
              )}
            </div>

            {/* 오른쪽: 게시글 수 + 관리자 액션 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="badge" title="게시글 수">
                📝 {c.postCount}
              </span>
              {isAdmin && editingId !== c.id && (
                <>
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(c.id, c.name);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(c.id);
                    }}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
