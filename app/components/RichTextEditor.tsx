import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
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
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  onChange: (content: string) => void;
  initialContent?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-t-xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("bold") ? "bg-white/10" : ""
        }`}
        title="Bold"
        type="button"
      >
        <Bold className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("italic") ? "bg-white/10" : ""
        }`}
        title="Italic"
        type="button"
      >
        <Italic className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("underline") ? "bg-white/10" : ""
        }`}
        title="Underline"
        type="button"
      >
        <Underline className="w-4 h-4 text-white" />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("heading", { level: 1 }) ? "bg-white/10" : ""
        }`}
        title="Heading 1"
        type="button"
      >
        <Heading1 className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("heading", { level: 2 }) ? "bg-white/10" : ""
        }`}
        title="Heading 2"
        type="button"
      >
        <Heading2 className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("heading", { level: 3 }) ? "bg-white/10" : ""
        }`}
        title="Heading 3"
        type="button"
      >
        <Heading3 className="w-4 h-4 text-white" />
      </button>
      <div className="w-px h-6 bg-white/10 mx-2" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("bulletList") ? "bg-white/10" : ""
        }`}
        title="Bullet List"
        type="button"
      >
        <List className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("orderedList") ? "bg-white/10" : ""
        }`}
        title="Numbered List"
        type="button"
      >
        <ListOrdered className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("blockquote") ? "bg-white/10" : ""
        }`}
        title="Quote"
        type="button"
      >
        <Quote className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("codeBlock") ? "bg-white/10" : ""
        }`}
        title="Code"
        type="button"
      >
        <Code className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => {
          const url = window.prompt("Enter the URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          editor.isActive("link") ? "bg-white/10" : ""
        }`}
        title="Add Link"
        type="button"
      >
        <LinkIcon className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => {
          const url = window.prompt("Enter the image URL");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Add Image"
        type="button"
      >
        <ImageIcon className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  onChange,
  initialContent,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          class: "text-blue-400 hover:text-blue-300 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your blog post...",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] outline-none px-4 py-3 bg-white/5 border border-white/10 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-white placeholder:text-white/40 transition-all prose prose-invert max-w-none",
      },
    },
  });

  const handleChange = useCallback(() => {
    if (editor) {
      onChange(editor.getHTML());
    }
  }, [editor, onChange]);

  useEffect(() => {
    if (editor) {
      editor.on("update", handleChange);
      return () => {
        editor.off("update", handleChange);
      };
    }
  }, [editor, handleChange]);

  return (
    <div className="editor-container relative">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
