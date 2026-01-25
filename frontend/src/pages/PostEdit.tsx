import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import Prism from "prismjs";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import "@toast-ui/editor/dist/toastui-editor.css";
import "prismjs/themes/prism-tomorrow.css";
import "../styles/editor-dark.css"; // ✅ 다크 테마 적용

import {
  getPost,
  updatePost,
  listCategories,
  uploadImage,
} from "../api/client";
import type { Category } from "../api/types";

export default function PostEdit() {
  const { id } = useParams();
  const postId = Number(id);
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ 초기 Markdown
  const [initialMd, setInitialMd] = useState("");
  const [ready, setReady] = useState(false);

  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    if (Number.isNaN(postId)) return;
    let mounted = true;

    (async () => {
      try {
        const [post, categories] = await Promise.all([
          getPost(postId),
          listCategories().catch(() => [] as Category[]),
        ]);
        if (!mounted) return;

        setTitle(post.title);
        setCategoryId(post.category?.id ?? "");
        setIsPrivate(post.isPrivate);
        setCats(categories);

        // ✅ 항상 서버 데이터 사용
        setInitialMd(post.contentMd ?? "");
        setReady(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      setReady(false);
      setInitialMd("");
    };
  }, [postId]);

  // ✅ 마운트 후 Editor에 Markdown 반영
  useEffect(() => {
    if (!ready) return;
    const inst = editorRef.current?.getInstance();
    if (!inst) return;
    requestAnimationFrame(() => {
      inst.setMarkdown(initialMd || "");
    });
  }, [ready, initialMd]);

  // ✅ 이미지 업로드
  const addImageBlobHook = async (
    blob: Blob,
    callback: (url: string, altText: string) => void
  ) => {
    try {
      const file = new File([blob], "image.jpg", {
        type: blob.type || "image/jpeg",
      });
      const { url } = await uploadImage(file);
      callback(url, "image");
    } catch {
      alert("이미지 업로드 실패");
    }
  };

  const manualInsertImage = async (file: File) => {
    const { url } = await uploadImage(file);
    const inst = editorRef.current?.getInstance();
    if (inst) inst.insertText(`\n\n![](${url})\n`);
  };

  // ✅ 저장 시 서버 업데이트만 수행
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(postId)) return;
    const contentMd = editorRef.current?.getInstance().getMarkdown() || "";
    if (!title.trim() || !contentMd.trim()) return;

    setSaving(true);
    try {
      await updatePost(postId, {
        title: title.trim(),
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        contentMd,
        isPrivate,
      });
      nav(`/posts/${postId}`);
    } finally {
      setSaving(false);
    }
  };

  if (Number.isNaN(postId)) return <div className="card">잘못된 게시글 ID</div>;
  if (loading) return <div className="card">Loading…</div>;

  return (
    <div className="card">
      <h2>Edit Post</h2>
      <form onSubmit={submit} className="form">
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="제목을 입력하세요"
          />
        </label>

        <label>
          Category
          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">-- select --</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="row">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <span>Private</span>
        </label>

        {ready && (
          <Editor
            key={`edit:${postId}`}
            ref={editorRef}
            initialValue={initialMd}
            previewStyle="vertical"
            height="520px"
            initialEditType="markdown"
            usageStatistics={false}
            toolbarItems={[
              ["heading", "bold", "italic", "strike"],
              ["hr", "quote"],
              ["ul", "ol", "task"],
              ["table", "link"],
              ["code", "codeblock"],
            ]}
            plugins={[[codeSyntaxHighlight, { highlighter: Prism }]]}
            hooks={{ addImageBlobHook }}
          />
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <input
            type="file"
            accept="image/jpeg"
            onChange={(e) =>
              e.target.files?.[0] && manualInsertImage(e.target.files[0])
            }
          />
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
