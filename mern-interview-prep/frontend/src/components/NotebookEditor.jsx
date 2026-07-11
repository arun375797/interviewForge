import { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Heading2,
  Code2,
  Strikethrough,
  Quote,
  Minus,
} from 'lucide-react';
import { CODE_LANGUAGES } from '../utils/notebookConstants';

const lowlight = createLowlight(common);

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? 'bg-ink text-paper'
          : 'text-muted hover:bg-paper-2 hover:text-ink disabled:opacity-40'
      }`}
    >
      {children}
    </button>
  );
}

function CodeLanguagePicker({ editor }) {
  const language = editor.isActive('codeBlock')
    ? editor.getAttributes('codeBlock').language || 'plaintext'
    : 'javascript';

  if (!editor.isActive('codeBlock')) return null;

  return (
    <select
      value={language}
      onChange={(event) =>
        editor.chain().focus().updateAttributes('codeBlock', { language: event.target.value }).run()
      }
      className="rounded-lg border border-line bg-[#1e1e1e] px-2 py-1 text-xs font-mono text-[#d4d4d4] outline-none focus:border-accent"
      title="Code language"
    >
      {CODE_LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}

export default function NotebookEditor({ value, onChange, placeholder = 'Start writing…' }) {
  const skipEmit = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'notebook-code-block',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'notebook-prose min-h-[420px] px-1 py-2 outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipEmit.current) return;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (current === next) return;
    skipEmit.current = true;
    editor.commands.setContent(next, { emitUpdate: false });
    skipEmit.current = false;
  }, [editor, value]);

  const turnSelectionIntoCode = useCallback(() => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run();
      return;
    }
    const text = editor.state.doc.textBetween(from, to, '\n');
    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent({
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: text ? [{ type: 'text', text }] : undefined,
      })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="notebook-editor rounded-2xl border border-line bg-paper focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          onClick={turnSelectionIntoCode}
          active={editor.isActive('codeBlock')}
          title="Turn selection into code block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <CodeLanguagePicker editor={editor} />

        <span className="ml-auto hidden text-xs text-muted sm:inline">
          Select text → code icon for syntax blocks
        </span>
      </div>

      <div className="px-4 pb-4 pt-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
