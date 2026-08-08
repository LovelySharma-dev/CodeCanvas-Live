export const registerJellyfishTheme = (monaco) => {
  monaco.editor.defineTheme('jellyfish', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'E2E8F0', background: '0B101D' },
      { token: 'comment', foreground: '475569', fontStyle: 'italic' },
      { token: 'keyword', foreground: '38BDF8', fontStyle: 'bold' }, // Electric Sky
      { token: 'keyword.json', foreground: '38BDF8' },
      { token: 'string', foreground: '10B981' }, // Glowing Emerald
      { token: 'number', foreground: 'F59E0B' }, // Warm Amber
      { token: 'type', foreground: '06B6D4' }, // Cyan
      { token: 'function', foreground: '00E5FF', fontStyle: 'bold' }, // Neon Cyan
      { token: 'variable', foreground: 'F43F5E' }, // Jellyfish Coral
      { token: 'variable.parameter', foreground: '2DD4BF' }, // Mint
      { token: 'tag', foreground: '38BDF8' }, // HTML Tag Sky
      { token: 'attribute.name', foreground: '06B6D4' }, // CSS / HTML Prop Cyan
      { token: 'attribute.value', foreground: '10B981' },
      { token: 'delimiter', foreground: '94A3B8' },
    ],
    colors: {
      'editor.background': '#0B101D',              // Deep Ocean Dark
      'editor.foreground': '#E2E8F0',
      'editorCursor.foreground': '#00E5FF',        // Neon Cyan Caret
      'editor.lineHighlightBackground': '#1E293B60',
      'editorLineNumber.foreground': '#334155',
      'editorLineNumber.activeForeground': '#00E5FF',
      'editor.selectionBackground': '#0284C740',
      'editor.inactiveSelectionBackground': '#0284C720',
      'editorGutter.background': '#0B101D',
      'editorWidget.background': '#0F172A',
      'editorWidget.border': '#1E293B',
    },
  });
};
