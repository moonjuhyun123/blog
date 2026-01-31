"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import { ResizableImage } from "../../../components/ResizableImage";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";

import {
  getPost,
  listCategories,
  updatePost,
  uploadImage,
  me,
} from "../../../../lib/api";
import type { Category } from "../../../../lib/types";

export default function PostEditPage() {
  const params = useParams<{ slug: string }>();
  const postId = Number(params?.slug);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialHtml, setInitialHtml] = useState("");
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorTimerRef = useRef<number | null>(null);
  const [colorValue, setColorValue] = useState("#e8ecf2");
  const [colorApplied, setColorApplied] = useState(false);
  const [toolbarTick, setToolbarTick] = useState(0);
  const runWithPreservedColor = (fn: () => void) => {
    if (!editor) return;
    const currentColor = editor.getAttributes("textStyle").color;
    fn();
    if (currentColor) {
      editor.chain().focus().setColor(currentColor).run();
    }
  };
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        listItem: false,
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Heading.configure({ levels: [2] }),
      ListItem.configure({
        content: "(paragraph | heading) block*",
        keepMarks: true,
        keepAttributes: true,
      }),
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ inline: true }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  useEffect(() => {
    me().catch(() => router.replace("/login"));
  }, [router]);

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
        setInitialHtml(post.contentHtml ?? post.contentMd ?? "");
        setReady(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      setReady(false);
      setInitialHtml("");
    };
  }, [postId]);

  useEffect(() => {
    if (!ready) return;
    if (!editor) return;
    requestAnimationFrame(() => {
      editor.commands.setContent(initialHtml || "");
    });
  }, [ready, initialHtml, editor]);

  useEffect(() => {
    if (!editor) return;
    const syncColor = () => {
      const current = editor.getAttributes("textStyle").color;
      setColorValue(current ?? "#e8ecf2");
    };
    const syncToolbar = () => {
      setToolbarTick((v) => v + 1);
    };
    syncColor();
    editor.on("selectionUpdate", syncColor);
    editor.on("transaction", syncColor);
    editor.on("selectionUpdate", syncToolbar);
    editor.on("transaction", syncToolbar);
    return () => {
      editor.off("selectionUpdate", syncColor);
      editor.off("transaction", syncColor);
      editor.off("selectionUpdate", syncToolbar);
      editor.off("transaction", syncToolbar);
      if (colorTimerRef.current) window.clearTimeout(colorTimerRef.current);
    };
  }, [editor]);

  const manualInsertImage = async (file: File) => {
    const { url } = await uploadImage(file);
    editor?.chain().focus().setImage({ src: url }).run();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(postId)) return;
    const contentHtml = editor?.getHTML() || "";
    const plain = contentHtml.replace(/<[^>]+>/g, "").trim();
    if (!title.trim() || !plain) return;

    setSaving(true);
    try {
      await updatePost(postId, {
        title: title.trim(),
        categoryId: categoryId === "" ? undefined : Number(categoryId),
        contentMd: contentHtml,
        isPrivate,
      });
      router.push(`/posts/${postId}`);
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
          <>
            <div className="tiptap-toolbar">
              <button
                type="button"
                className={editor?.isActive("bold") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleBold().run()
                  )
                }
              >
                Bold
              </button>
              <button
                type="button"
                className={editor?.isActive("italic") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleItalic().run()
                  )
                }
              >
                Italic
              </button>
              <button
                type="button"
                className={editor?.isActive("strike") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleStrike().run()
                  )
                }
              >
                Strike
              </button>
              <button
                type="button"
                className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  )
                }
              >
                H2
              </button>
              <button
                type="button"
                className={editor?.isActive("bulletList") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleBulletList().run()
                  )
                }
              >
                Bullet
              </button>
              <button
                type="button"
                className={editor?.isActive("orderedList") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleOrderedList().run()
                  )
                }
              >
                Ordered
              </button>
              <button
                type="button"
                className={editor?.isActive("blockquote") ? "is-active" : ""}
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().toggleBlockquote().run()
                  )
                }
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt("Link URL");
                  if (!url) return;
                  runWithPreservedColor(() =>
                    editor.chain().focus().setLink({ href: url }).run()
                  );
                }}
              >
                Link
              </button>
              <button
                type="button"
                onClick={() =>
                  runWithPreservedColor(() =>
                    editor.chain().focus().unsetLink().run()
                  )
                }
              >
                Unlink
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                Image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  manualInsertImage(file);
                  e.currentTarget.value = "";
                }}
              />
              <label className="tiptap-color">
                <span
                  style={{
                    color: colorValue,
                  }}
                >
                  Text color
                </span>
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => {
                    const next = e.target.value;
                    setColorValue(next);
                    editor?.chain().focus().setColor(next).run();
                    setColorApplied(true);
                    if (colorTimerRef.current) window.clearTimeout(colorTimerRef.current);
                    colorTimerRef.current = window.setTimeout(() => {
                      setColorApplied(false);
                    }, 1200);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().setColor(colorValue).run();
                  setColorApplied(true);
                  if (colorTimerRef.current) window.clearTimeout(colorTimerRef.current);
                  colorTimerRef.current = window.setTimeout(() => {
                    setColorApplied(false);
                  }, 1200);
                }}
              >
                Apply color
              </button>
              {colorApplied && (
                <span className="tiptap-color__status">Applied</span>
              )}
              <button
                type="button"
                onClick={() => editor?.chain().focus().unsetColor().run()}
              >
                Clear color
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.insertTable?.({
                    rows: 3,
                    cols: 3,
                    withHeaderRow: true,
                  });
                }}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.addRowBefore?.();
                }}
              >
                Row ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.addRowAfter?.();
                }}
              >
                Row +
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.addColumnBefore?.();
                }}
              >
                Col ←
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.addColumnAfter?.();
                }}
              >
                Col +
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.deleteRow?.();
                }}
              >
                Row -
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.deleteColumn?.();
                }}
              >
                Col -
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.mergeCells?.();
                }}
              >
                Merge
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.splitCell?.();
                }}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => {
                  editor?.chain().focus().run();
                  editor?.commands.deleteTable?.();
                }}
              >
                Del table
              </button>
            </div>
            <EditorContent editor={editor} />
          </>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
