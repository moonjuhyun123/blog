// src/components/PostForm.tsx
import { useEffect, useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import Prism from "prismjs";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";
import type { Post } from "../api/types";

type Props = {
  initial?: Partial<Pick<Post, "title" | "content" | "isPrivate">>;
  onSubmit: (payload: {
    title: string;
    contentMd: string;
    isPrivate: boolean;
  }) => Promise<void> | void;
  draftKey?: string; // 페이지별 초안 분리하고 싶을 때 전달 (기본값: "draft.post")
};

export default function PostForm({
  initial,
  onSubmit,
  draftKey = "draft.post",
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor>(null);
  const [isPrivate, setIsPrivate] = useState<boolean>(
    initial?.isPrivate ?? false
  );

  // 초기값(초안 우선)
  useEffect(() => {
    const inst = editorRef.current?.getInstance();
    const draft = localStorage.getItem(draftKey);
    if (titleRef.current && initial?.title)
      titleRef.current.value = initial.title;
    if (inst) {
      if (draft) inst.setMarkdown(draft);
      else if (initial?.content) inst.setMarkdown(initial.content);
    }
  }, []);

  // 변경 시 초안 자동저장 (디바운스)
  useEffect(() => {
    const inst = editorRef.current?.getInstance();
    if (!inst) return;
    let t: number | undefined;
    const handler = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        localStorage.setItem(draftKey, inst.getMarkdown() || "");
      }, 500);
    };
    inst.on("change", handler);
    return () => {
      inst.off("change", handler);
      if (t) window.clearTimeout(t);
    };
  }, [draftKey]);

  // 이미지 업로드 훅
  const addImageBlobHook = async (
    blob: Blob,
    callback: (url: string, altText: string) => void
  ) => {
    const fd = new FormData();
    fd.append("file", blob);
    const res = await fetch("/api/media/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      alert("이미지 업로드 실패");
      return;
    }
    const data = await res.json(); // { url: string }
    callback(data.url, "image");
  };

  const submit = async () => {
    const title = titleRef.current?.value.trim() || "";
    const contentMd = editorRef.current?.getInstance().getMarkdown() || "";
    if (!title) return alert("제목을 입력하세요.");
    await onSubmit({ title, contentMd, isPrivate });
    localStorage.removeItem(draftKey);
  };

  return (
    <div className="post-form space-y-3">
      <input
        ref={titleRef}
        className="border p-2 w-full rounded"
        placeholder="제목을 입력하세요"
        maxLength={200}
      />

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        비공개
      </label>

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

      <div className="flex justify-end">
        <button
          onClick={submit}
          className="px-4 py-2 rounded bg-black text-white"
        >
          저장
        </button>
      </div>
    </div>
  );
}
