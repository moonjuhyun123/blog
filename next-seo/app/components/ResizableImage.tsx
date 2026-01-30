import { useEffect, useRef } from "react";
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

const MIN_SIZE = 80;

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const userSelectRef = useRef<string | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startWidth: number;
    startHeight: number;
    ratio: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (userSelectRef.current !== null) {
        document.body.style.userSelect = userSelectRef.current;
        userSelectRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startWidth = rect.width || MIN_SIZE;
    const startHeight = rect.height || MIN_SIZE;
    dragStateRef.current = {
      startX: event.clientX,
      startWidth,
      startHeight,
      ratio: startWidth / startHeight,
    };
    userSelectRef.current = document.body.style.userSelect || "";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragStateRef.current) return;
    event.preventDefault();
    const { startX, startWidth, ratio } = dragStateRef.current;
    const deltaX = event.clientX - startX;
    const nextWidth = Math.max(MIN_SIZE, startWidth + deltaX);
    const nextHeight = Math.max(MIN_SIZE, Math.round(nextWidth / ratio));
    updateAttributes({
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    });
  };

  const handlePointerUp = () => {
    dragStateRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    if (userSelectRef.current !== null) {
      document.body.style.userSelect = userSelectRef.current;
      userSelectRef.current = null;
    }
  };

  const width = node.attrs.width ? Number(node.attrs.width) : null;
  const height = node.attrs.height ? Number(node.attrs.height) : null;
  const style: React.CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  return (
    <NodeViewWrapper
      as="span"
      className="tiptap-image-node"
      contentEditable={false}
    >
      <span ref={wrapperRef} className="tiptap-image-node__inner" style={style}>
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || ""}
          draggable="false"
        />
        {selected && (
          <span
            className="tiptap-image-handle"
            onPointerDown={handlePointerDown}
          />
        )}
      </span>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("width") || element.getAttribute("data-width"),
        renderHTML: (attributes) =>
          attributes.width ? { width: attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("height") || element.getAttribute("data-height"),
        renderHTML: (attributes) =>
          attributes.height ? { height: attributes.height } : {},
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { width, height, ...rest } = HTMLAttributes;
    const attrs = mergeAttributes(rest, {
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    });
    return ["img", attrs];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
