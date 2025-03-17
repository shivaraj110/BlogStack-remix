import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
  EditorState,
} from "lexical";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
} from "lucide-react";
import { useCallback, useEffect } from "react";

// Define theme
const theme = {
  root: "p-0 position-relative",
  paragraph: "mb-2 text-white",
  heading: {
    h1: "text-3xl font-bold mb-4 text-white",
    h2: "text-2xl font-bold mb-3 text-white",
    h3: "text-xl font-bold mb-2 text-white",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "bg-white/10 p-1 rounded font-mono text-sm",
  },
  list: {
    ol: "list-decimal pl-5 mb-2 text-white",
    ul: "list-disc pl-5 mb-2 text-white",
    listitem: "ml-2 text-white",
  },
  quote: "border-l-4 border-white/30 pl-4 italic my-4 text-white/80",
  code: "bg-white/10 p-1 rounded font-mono text-sm text-white",
};

// Custom error boundary component

// Custom error boundary component
function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// OnChange plugin to capture content
function OnChangePlugin({ onChange }: { onChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        onChange(content);
      });
    },
    [onChange]
  );

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      handleChange(editorState);
    });
  }, [editor, handleChange]);

  return null;
}

// Toolbar plugin
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (tag: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText({ tag } as unknown as TextFormatType);
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-t-xl">
      <button
        onClick={() => formatText("bold")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Bold"
        type="button"
      >
        <Bold className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatText("italic")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Italic"
        type="button"
      >
        <Italic className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatText("underline")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Underline"
        type="button"
      >
        <Underline className="w-4 h-4 text-white" />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        onClick={() => formatHeading("h1")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Heading 1"
        type="button"
      >
        <Heading1 className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatHeading("h2")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Heading 2"
        type="button"
      >
        <Heading2 className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatHeading("h3")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Heading 3"
        type="button"
      >
        <Heading3 className="w-4 h-4 text-white" />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        onClick={() => formatHeading("ul")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Bullet List"
        type="button"
      >
        <List className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatHeading("ol")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Numbered List"
        type="button"
      >
        <ListOrdered className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatHeading("blockquote")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Quote"
        type="button"
      >
        <Quote className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => formatHeading("code")}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Code"
        type="button"
      >
        <Code className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

interface RichTextEditorProps {
  onChange: (content: string) => void;
  initialContent?: string;
}

export default function RichTextEditor({
  onChange,
  initialContent,
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: "BlogEditor",
    theme,
    onError: (error: Error) => {
      console.error(error);
    },
    // Remove editorState property to avoid JSON parsing issues
    nodes: [
      HeadingNode,
      QuoteNode,
      ListItemNode,
      ListNode,
      CodeHighlightNode,
      CodeNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container relative">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] outline-none px-4 py-3 bg-white/5 border border-white/10 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-white placeholder:text-white/40 transition-all" />
            }
            ErrorBoundary={CustomErrorBoundary}
          />
          <OnChangePlugin onChange={onChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
}
