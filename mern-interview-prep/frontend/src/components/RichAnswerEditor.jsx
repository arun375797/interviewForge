import { useRef } from 'react';

export default function RichAnswerEditor({ value, onChange, rows = 10, placeholder = '' }) {
  const textareaRef = useRef(null);

  const wrapSelection = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    const next = `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`;

    onChange(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start, start + open.length + selected.length + close.length);
      } else {
        textarea.setSelectionRange(start + open.length, start + open.length);
      }
    });
  };

  return (
    <div className="rounded-xl border border-line bg-paper focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <button
          type="button"
          onClick={() => wrapSelection('mark')}
          className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
        >
          Highlight
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('u')}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold underline decoration-accent decoration-2 underline-offset-4 hover:bg-paper-2"
        >
          Underline
        </button>
        <span className="text-xs text-muted">Select text, then apply formatting.</span>
      </div>
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-b-xl border-0 bg-transparent px-3 py-2 font-sans leading-7 outline-none"
      />
    </div>
  );
}
