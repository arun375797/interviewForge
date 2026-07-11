export const IDE_MONACO_THEMES = {
  paper: 'thinkmern-ide-paper',
  night: 'thinkmern-ide-night',
  jellyfish: 'thinkmern-ide-jellyfish',
};

const IDE_THEME_DEFS = {
  paper: {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#12100c',
      'editor.foreground': '#f7f3eb',
      'editorLineNumber.foreground': '#6b6560',
      'editorLineNumber.activeForeground': '#f7f3eb',
      'editorCursor.foreground': '#f7f3eb',
      'editor.selectionBackground': '#0f766e44',
      'editor.inactiveSelectionBackground': '#0f766e22',
      'editorIndentGuide.background': '#2a2620',
      'editorIndentGuide.activeBackground': '#4a4438',
    },
  },
  night: {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#f0f6fc',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#f0f6fc',
      'editorCursor.foreground': '#58a6ff',
      'editor.selectionBackground': '#58a6ff33',
      'editor.inactiveSelectionBackground': '#58a6ff1a',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
    },
  },
  jellyfish: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'a78bfa', fontStyle: 'italic' },
      { token: 'string', foreground: '00e5ff' },
      { token: 'keyword', foreground: 'ff6bcb' },
      { token: 'number', foreground: 'f472b6' },
      { token: 'type', foreground: 'c4b5fd' },
      { token: 'function', foreground: '67e8f9' },
    ],
    colors: {
      'editor.background': '#120a28',
      'editor.foreground': '#ede9fe',
      'editorLineNumber.foreground': '#6d5cae',
      'editorLineNumber.activeForeground': '#ede9fe',
      'editorCursor.foreground': '#ff6bcb',
      'editor.selectionBackground': '#ff6bcb33',
      'editor.inactiveSelectionBackground': '#ff6bcb1a',
      'editorIndentGuide.background': '#2d1a5c',
      'editorIndentGuide.activeBackground': '#3d2a6b',
    },
  },
};

let themesRegistered = false;

export function registerIdeMonacoThemes(monaco) {
  if (themesRegistered) return;
  Object.entries(IDE_THEME_DEFS).forEach(([appTheme, definition]) => {
    monaco.editor.defineTheme(IDE_MONACO_THEMES[appTheme], definition);
  });
  themesRegistered = true;
}

export function getIdeMonacoTheme(appTheme) {
  return IDE_MONACO_THEMES[appTheme] || IDE_MONACO_THEMES.paper;
}
