const INLINE_FORMAT_TAG_RE = /<\/?(?:mark|u)>/gi;
const FORMAT_TOKEN_RE = /(<\/?mark>|<\/?u>)/gi;
const LEGACY_BULLET_RE = /(^|\n)- /g;
const ROUND_BULLET = '$1• ';

export function stripAnswerFormatting(text = '') {
  return typeof text === 'string' ? text.replace(INLINE_FORMAT_TAG_RE, '') : '';
}

export function getFormattedAnswerParts(text = '') {
  const tokens = typeof text === 'string' ? text.split(FORMAT_TOKEN_RE) : [];
  const state = { mark: false, underline: false };
  const parts = [];

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (lower === '<mark>') {
      state.mark = true;
      return;
    }
    if (lower === '</mark>') {
      state.mark = false;
      return;
    }
    if (lower === '<u>') {
      state.underline = true;
      return;
    }
    if (lower === '</u>') {
      state.underline = false;
      return;
    }
    if (!token) return;

    parts.push({
      text: token.replace(LEGACY_BULLET_RE, ROUND_BULLET),
      mark: state.mark,
      underline: state.underline,
    });
  });

  return parts;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function answerToEditableHtml(text = '') {
  return getFormattedAnswerParts(text)
    .map((part) => {
      const escaped = escapeHtml(part.text);
      if (part.mark && part.underline) return `<mark><u>${escaped}</u></mark>`;
      if (part.mark) return `<mark>${escaped}</mark>`;
      if (part.underline) return `<u>${escaped}</u>`;
      return escaped;
    })
    .join('');
}
