// src/components/PostViewer.tsx
import { Viewer } from "@toast-ui/react-editor";
import Prism from "prismjs";
import codeSyntaxHighlight from "@toast-ui/editor-plugin-code-syntax-highlight";

export default function PostViewer({ content }: { content: string }) {
  return (
    <Viewer
      initialValue={content}
      plugins={[[codeSyntaxHighlight, { highlighter: Prism }]]}
      usageStatistics={false}
    />
  );
}
