import { useLayoutEffect, useRef, useState } from 'react';
import { answerToEditableHtml, stripAnswerFormatting } from '../utils/answerFormatting';

const BLOCK_TAGS = new Set(['div', 'p', 'li']);

function wrapText(text, state) {
  if (!text) return '';
  let result = text.replace(/\u00a0/g, ' ');
  if (state.underline) result = `<u>${result}</u>`;
  if (state.mark) result = `<mark>${result}</mark>`;
  return result;
}

function wrapPart(part) {
  return wrapText(part.text, part);
}

function hasVisibleHighlight(element) {
  const background = element.style.backgroundColor;
  return Boolean(background && background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)');
}

function hasUnderline(element) {
  const decoration = element.style.textDecoration || element.style.textDecorationLine;
  return decoration.includes('underline');
}

function partsFromNode(node, state = { mark: false, underline: false }) {
  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: (node.nodeValue || '').replace(/\u00a0/g, ' '), ...state }];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node;
  const tag = element.tagName.toLowerCase();
  if (tag === 'br') return [{ text: '\n', ...state }];

  const nextState = {
    mark: state.mark || tag === 'mark' || hasVisibleHighlight(element),
    underline: state.underline || tag === 'u' || hasUnderline(element),
  };
  const parts = Array.from(element.childNodes).flatMap((child) => partsFromNode(child, nextState));
  if (BLOCK_TAGS.has(tag) && parts.at(-1)?.text !== '\n') {
    parts.push({ text: '\n', ...state });
  }
  return parts;
}

function mergeParts(parts) {
  const merged = [];
  for (const part of parts) {
    if (!part.text) continue;
    const previous = merged.at(-1);
    if (previous && previous.mark === part.mark && previous.underline === part.underline) {
      previous.text += part.text;
    } else {
      merged.push({ ...part });
    }
  }
  return merged;
}

function partsFromEditor(root) {
  return mergeParts(Array.from(root.childNodes).flatMap((child) => partsFromNode(child)));
}

function answerFromParts(parts) {
  return mergeParts(parts)
    .map(wrapPart)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n$/, '');
}

function serializeEditor(root) {
  return answerFromParts(partsFromEditor(root));
}

function textLengthForNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue || '').length;
  if (node.nodeType !== Node.ELEMENT_NODE) return 0;
  if (node.tagName.toLowerCase() === 'br') return 1;
  return Array.from(node.childNodes).reduce((total, child) => total + textLengthForNode(child), 0);
}

function offsetWithin(root, targetNode, targetOffset) {
  let offset = 0;
  let found = false;

  function walk(node) {
    if (found) return;

    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        offset += targetOffset;
      } else {
        const children = Array.from(node.childNodes).slice(0, targetOffset);
        offset += children.reduce((total, child) => total + textLengthForNode(child), 0);
      }
      found = true;
      return;
    }

    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes || [])) {
        walk(child);
        if (found) return;
      }
      if (!found && node !== root && node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
        offset += 1;
      } else if (!found && node.nodeType === Node.TEXT_NODE) {
        offset += textLengthForNode(node);
      }
    }
  }

  walk(root);
  return offset;
}

function splitPartsByRange(parts, start, end, formatKey) {
  let cursor = 0;
  const selectedParts = [];
  const split = [];

  for (const part of parts) {
    const partStart = cursor;
    const partEnd = cursor + part.text.length;
    cursor = partEnd;

    if (partEnd <= start || partStart >= end) {
      split.push(part);
      continue;
    }

    const beforeLength = Math.max(0, start - partStart);
    const selectedStart = Math.max(0, start - partStart);
    const selectedEnd = Math.min(part.text.length, end - partStart);
    const afterLength = Math.max(0, partEnd - end);

    if (beforeLength) split.push({ ...part, text: part.text.slice(0, beforeLength) });
    const selected = { ...part, text: part.text.slice(selectedStart, selectedEnd) };
    selectedParts.push(selected);
    split.push(selected);
    if (afterLength) split.push({ ...part, text: part.text.slice(selectedEnd) });
  }

  const shouldApply = selectedParts.some((part) => part.text && !part[formatKey]);
  return split.map((part) => {
    if (!selectedParts.includes(part)) return part;
    return { ...part, [formatKey]: shouldApply };
  });
}

export default function RichAnswerEditor({ value, onChange, rows = 10, placeholder = '' }) {
  const editorRef = useRef(null);
  const lastValueRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!stripAnswerFormatting(value).trim());

  useLayoutEffect(() => {
    const nextValue = value || '';
    if (!editorRef.current || nextValue === lastValueRef.current) return;

    editorRef.current.innerHTML = answerToEditableHtml(nextValue);
    lastValueRef.current = nextValue;
    setIsEmpty(!stripAnswerFormatting(nextValue).trim());
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const next = serializeEditor(editorRef.current);
    lastValueRef.current = next;
    setIsEmpty(!stripAnswerFormatting(next).trim());
    onChange(next);
  };

  const applyFormatting = (tag) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const formatKey = tag === 'mark' ? 'mark' : 'underline';
    const start = offsetWithin(editor, range.startContainer, range.startOffset);
    const end = offsetWithin(editor, range.endContainer, range.endOffset);
    const [from, to] = start < end ? [start, end] : [end, start];
    const nextParts = splitPartsByRange(partsFromEditor(editor), from, to, formatKey);
    const next = answerFromParts(nextParts);

    lastValueRef.current = next;
    setIsEmpty(!stripAnswerFormatting(next).trim());
    onChange(next);
    editor.innerHTML = answerToEditableHtml(next);
    editor.focus();
  };

  const pastePlainText = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    document.execCommand('insertText', false, text);
    emitChange();
  };

  return (
    <div className="rounded-xl border border-line bg-paper focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormatting('mark')}
          className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
        >
          Highlight
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormatting('u')}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold underline decoration-accent decoration-2 underline-offset-4 hover:bg-paper-2"
        >
          Underline
        </button>
        <span className="w-full text-xs text-muted sm:w-auto">Select text, then apply formatting.</span>
      </div>
      <div className="relative">
        {isEmpty && placeholder ? (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted/70">
            {placeholder}
          </span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={pastePlainText}
          className="overflow-anywhere w-full rounded-b-xl px-3 py-2 font-sans leading-7 outline-none [&_mark]:rounded [&_mark]:bg-amber-200/70 [&_mark]:px-0.5 [&_u]:decoration-accent [&_u]:decoration-2 [&_u]:underline-offset-4"
          style={{ minHeight: `${rows * 1.75}rem`, whiteSpace: 'pre-wrap' }}
        />
      </div>
    </div>
  );
}
