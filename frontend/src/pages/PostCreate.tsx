// import { useEffect, useState } from "react";
// import { createPost, listCategories, uploadImage } from "../api/client";
// import { useNavigate } from "react-router-dom";
// import type { Category } from "../api/types";

// export default function PostCreate() {
//   const [title, setTitle] = useState("");
//   const [categoryId, setCategoryId] = useState<number | "">("");
//   const [isPrivate, setIsPrivate] = useState(false);
//   const [contentMd, setContentMd] = useState("");
//   const [cats, setCats] = useState<Category[]>([]);
//   const nav = useNavigate();

//   useEffect(() => {
//     listCategories().then(setCats);
//   }, []);

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title.trim() || !categoryId || !contentMd.trim()) return;
//     const res = await createPost({
//       title: title.trim(),
//       categoryId: Number(categoryId),
//       contentMd,
//       isPrivate,
//     });
//     nav(`/posts/${res.id}`);
//   };

//   const insertImage = async (file: File) => {
//     const { url } = await uploadImage(file);
//     setContentMd((prev) => `${prev}\n\n![](${url})\n`);
//   };

//   return (
//     <div className="card">
//       <h2>Write Post</h2>
//       <form onSubmit={submit} className="form">
//         <label>
//           Title
//           <input value={title} onChange={(e) => setTitle(e.target.value)} />
//         </label>

//         <label>
//           Category
//           <select
//             value={categoryId}
//             onChange={(e) => setCategoryId(Number(e.target.value))}
//           >
//             <option value="">-- select --</option>
//             {cats.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.name}
//               </option>
//             ))}
//           </select>
//         </label>

//         <label className="row">
//           <input
//             type="checkbox"
//             checked={isPrivate}
//             onChange={(e) => setIsPrivate(e.target.checked)}
//           />
//           <span>Private</span>
//         </label>

//         <label>
//           Content (Markdown)
//           <textarea
//             rows={16}
//             value={contentMd}
//             onChange={(e) => setContentMd(e.target.value)}
//           />
//         </label>

//         <div className="row">
//           <input
//             type="file"
//             accept="image/jpeg"
//             onChange={(e) =>
//               e.target.files?.[0] && insertImage(e.target.files[0])
//             }
//           />
//           <button className="btn" type="submit">
//             Publish
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// src/pages/PostCreate.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import Prism from "prismjs";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";

import { createPost, listCategories, uploadImage } from "../api/client";
import type { Category } from "../api/types";

export default function PostCreate() {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  const editorRef = useRef<Editor>(null);
  const DRAFT_KEY = "draft.post.create";

  useEffect(() => {
    listCategories()
      .then(setCats)
      .catch(() => setCats([]));
  }, []);

  // 초안 로드
  useEffect(() => {
    const inst = editorRef.current?.getInstance();
    const draft = localStorage.getItem(DRAFT_KEY);
    if (inst && draft) inst.setMarkdown(draft);
  }, []);

  // 변경 시 초안 저장 (디바운스)
  useEffect(() => {
    const inst = editorRef.current?.getInstance();
    if (!inst) return;
    let t: number | undefined;
    const handler = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, inst.getMarkdown() || "");
      }, 500);
    };
    inst.on("change", handler);
    return () => {
      inst.off("change", handler);
      if (t) window.clearTimeout(t);
    };
  }, []);

  // Toast UI 이미지 훅: blob -> File 래핑해서 기존 uploadImage 사용
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
    } catch (e) {
      alert("이미지 업로드 실패");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentMd = editorRef.current?.getInstance().getMarkdown() || "";
    if (!title.trim() || !categoryId || !contentMd.trim()) return;
    setSubmitting(true);
    try {
      const res = await createPost({
        title: title.trim(),
        categoryId: Number(categoryId),
        contentMd,
        isPrivate,
      });
      localStorage.removeItem(DRAFT_KEY);
      nav(`/posts/${res.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 필요 시 수동 파일 인서트 버튼도 유지하고 싶다면 사용
  const manualInsertImage = async (file: File) => {
    const { url } = await uploadImage(file);
    const inst = editorRef.current?.getInstance();
    if (inst) inst.insertText(`\n\n![](${url})\n`);
  };

  return (
    <div className="card">
      <h2>Write Post</h2>
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

        {/* ✅ Toast UI Editor (textarea 대체) */}
        <Editor
          ref={editorRef}
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

        <div className="row" style={{ marginTop: 12 }}>
          {/* 수동 업로드도 쓰고 싶다면 유지 */}
          <input
            type="file"
            accept="image/jpeg"
            onChange={(e) =>
              e.target.files?.[0] && manualInsertImage(e.target.files[0])
            }
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
