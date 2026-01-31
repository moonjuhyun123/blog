"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  deleteCategory,
  listCategorySummary,
  me,
  reorderCategories,
  updateCategory,
} from "../../lib/api";
import type { CategorySummary, User } from "../../lib/types";

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories?: CategorySummary[] | null;
}) {
  const [cats, setCats] = useState<CategorySummary[]>(
    initialCategories ?? []
  );
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const router = useRouter();

  const load = async () => setCats(await listCategorySummary());

  useEffect(() => {
    if (initialCategories == null) {
      load();
    }
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
    await load();
  };

  const remove = async (id: number) => {
    const category = cats.find((c) => c.id === id);
    if (!category) return;

    // 게시글이 있으면 경고
    if (category.postCount > 0) {
      if (
        !confirm(
          `⚠️ 이 카테고리에 ${category.postCount}개의 게시글이 있습니다.\n정말 삭제하시겠습니까?\n\n게시글도 함께 삭제될 수 있습니다.`
        )
      ) {
        return;
      }
    } else {
      if (!confirm("이 카테고리를 삭제할까요?")) return;
    }

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

  const moveItem = (list: CategorySummary[], from: number, to: number) => {
    const next = list.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const persistOrder = async () => {
    if (!orderDirty) return;
    setSavingOrder(true);
    try {
      await reorderCategories(cats.map((c) => c.id));
      setOrderDirty(false);
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div>
      <h1>CATEGORIES</h1>

      {isAdmin && (
        <form onSubmit={add} className="row" style={{ marginBottom: 16 }}>
          <input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn" type="submit">
            Add
          </button>
          {orderDirty && (
            <button className="btn" type="button" onClick={persistOrder} disabled={savingOrder}>
              {savingOrder ? "Saving…" : "Save order"}
            </button>
          )}
        </form>
      )}

      <ul className="list">
        {cats.map((c) => (
          <li
            key={c.id}
            className={`list__item ${draggingId === c.id ? "is-dragging" : ""}`}
            draggable={isAdmin}
            onDragStart={(e) => {
              if (!isAdmin) return;
              setDraggingId(c.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (!isAdmin) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              if (!isAdmin) return;
              e.preventDefault();
              if (draggingId == null || draggingId === c.id) return;
              const fromIndex = cats.findIndex((x) => x.id === draggingId);
              const toIndex = cats.findIndex((x) => x.id === c.id);
              if (fromIndex < 0 || toIndex < 0) return;
              const next = moveItem(cats, fromIndex, toIndex);
              setCats(next);
              setOrderDirty(true);
              setDraggingId(null);
            }}
            onDragEnd={() => setDraggingId(null)}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <a href={`/categories/${c.id}`} className="title">
                #{c.name}
              </a>
              <div className="row" style={{ gap: 10 }}>
                {isAdmin && (
                  <span
                    className="category-drag-handle"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                  >
                    ⠿
                  </span>
                )}
                <span className="category-count">{c.postCount} posts</span>
              </div>
            </div>
            <div className="meta">
              <span>{new Date(c.createdAt).toLocaleString()}</span>
            </div>

            {isAdmin && (
              <div className="row" style={{ marginTop: 10 }}>
                {editingId === c.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <button className="btn" onClick={() => saveEdit(c.id)}>
                      Save
                    </button>
                    <button className="btn outline" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn"
                      onClick={() => startEdit(c.id, c.name)}
                    >
                      Edit
                    </button>
                    <button className="btn danger" onClick={() => remove(c.id)}>
                      Delete
                    </button>
                    {savingOrder && <span className="badge">Saving…</span>}
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
