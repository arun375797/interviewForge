export function escapeNotebookHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCodeBlockHtml(code, language = 'javascript') {
  const safeLang = escapeNotebookHtml(language || 'javascript');
  return `<pre class="notebook-code-block"><code class="language-${safeLang}">${escapeNotebookHtml(code)}</code></pre>`;
}

export function buildIdeSnippetHtml({ code, modeLabel, language = 'javascript' }) {
  const heading = escapeNotebookHtml(`${modeLabel} IDE snippet`);
  const timestamp = escapeNotebookHtml(new Date().toLocaleString());
  return `<h3>${heading}</h3><p><em>Saved from IDE · ${timestamp}</em></p>${buildCodeBlockHtml(code, language)}`;
}

export function appendIdeSnippet(existingContent, snippet) {
  const base = (existingContent || '').trim();
  return base ? `${base}${snippet}` : snippet;
}
