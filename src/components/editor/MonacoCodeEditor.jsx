import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, CheckCircle2, Lock, FileCode, Code, FileText, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { registerJellyfishTheme } from './jellyfishTheme';

/**
 * Custom Yjs Y.Text Monaco Binding Adapter
 * Character-by-character real-time CRDT synchronization
 */
class YjsMonacoBinding {
  constructor(yText, monacoModel) {
    this.yText = yText;
    this.monacoModel = monacoModel;
    this.isApplying = false;

    // 1. Listen for remote Y.Text CRDT delta operations from peers
    this.yTextObserver = (event) => {
      if (this.isApplying) return;
      this.isApplying = true;
      try {
        let index = 0;
        event.delta.forEach((op) => {
          if (op.retain) {
            index += op.retain;
          } else if (op.insert) {
            const textToInsert = typeof op.insert === 'string' ? op.insert : String(op.insert);
            const pos = this.monacoModel.getPositionAt(index);
            const range = {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column
            };
            this.monacoModel.applyEdits([{ range, text: textToInsert, forceMoveMarkers: true }]);
            index += textToInsert.length;
          } else if (op.delete) {
            const startPos = this.monacoModel.getPositionAt(index);
            const endPos = this.monacoModel.getPositionAt(index + op.delete);
            const range = {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column
            };
            this.monacoModel.applyEdits([{ range, text: '', forceMoveMarkers: true }]);
          }
        });
      } catch (err) {
        console.warn('YjsMonacoBinding delta apply warning:', err);
      } finally {
        this.isApplying = false;
      }
    };

    this.yText.observe(this.yTextObserver);

    // 2. Listen for local typing content changes in Monaco
    this.monacoListener = this.monacoModel.onDidChangeContent((event) => {
      if (this.isApplying) return;
      this.isApplying = true;
      try {
        this.yText.doc.transact(() => {
          const sortedChanges = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
          sortedChanges.forEach((change) => {
            if (change.rangeLength > 0) {
              this.yText.delete(change.rangeOffset, change.rangeLength);
            }
            if (change.text.length > 0) {
              this.yText.insert(change.rangeOffset, change.text);
            }
          });
        });
      } catch (err) {
        console.warn('YjsMonacoBinding Y.Text edit warning:', err);
      } finally {
        this.isApplying = false;
      }
    });
  }

  destroy() {
    if (this.yTextObserver) {
      try {
        this.yText.unobserve(this.yTextObserver);
      } catch (e) {}
    }
    if (this.monacoListener) {
      try {
        this.monacoListener.dispose();
      } catch (e) {}
    }
  }
}

export default function MonacoCodeEditor() {
  const {
    files,
    activeFileId,
    activeFile,
    openFileIds,
    userRole,
    updateFileContent,
    openFileTab,
    closeFileTab,
    realtimeChannel
  } = useWorkspace();

  const [editorTheme, setEditorTheme] = useState('jellyfish');
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving'
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const cursorListenerRef = useRef(null);
  const bindingRef = useRef(null);

  const isReadOnly = userRole === 'VIEWER';

  const getLanguage = (fileName) => {
    if (!fileName) return 'javascript';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.js')) return 'javascript';
    return 'plaintext';
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return null;
    if (fileName.endsWith('.html')) return <Code className="w-3.5 h-3.5 text-brand-sky" />;
    if (fileName.endsWith('.css')) return <FileCode className="w-3.5 h-3.5 text-brand-primary" />;
    if (fileName.endsWith('.js')) return <FileText className="w-3.5 h-3.5 text-brand-emerald" />;
    return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
  };

  const handleBeforeMount = (monaco) => {
    registerJellyfishTheme(monaco);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Attach cursor position listener
    cursorListenerRef.current?.dispose();
    cursorListenerRef.current = editor.onDidChangeCursorPosition((e) => {
      if (realtimeChannel && activeFileId) {
        realtimeChannel.broadcastPresence(activeFileId, {
          line: e.position.lineNumber,
          column: e.position.column
        });
      }
    });
  };

  // Bind Monaco Editor directly to Yjs Y.Text document for CRDT character-by-character real-time sync
  useEffect(() => {
    if (!editorRef.current || !activeFileId || !realtimeChannel?.doc) return;

    const ydoc = realtimeChannel.doc;
    const yText = ydoc.getText(`file-${activeFileId}`);

    // Populate initial content in Y.Text if empty
    if (yText.toString() === '' && activeFile?.content) {
      yText.insert(0, activeFile.content);
    }

    try {
      bindingRef.current?.destroy();

      const model = editorRef.current.getModel();
      if (model) {
        const binding = new YjsMonacoBinding(yText, model);
        bindingRef.current = binding;
      }

      // Sync activeFile state in WorkspaceContext to trigger LivePreview reactive hot-reload
      const handleYTextChange = () => {
        const updatedText = yText.toString();
        setSaveState('saving');
        updateFileContent(activeFileId, updatedText);
        setTimeout(() => setSaveState('saved'), 300);
      };

      yText.observe(handleYTextChange);

      return () => {
        yText.unobserve(handleYTextChange);
        bindingRef.current?.destroy();
        bindingRef.current = null;
      };
    } catch (err) {
      console.warn('Monaco Yjs binding warning:', err);
    }
  }, [activeFileId, realtimeChannel?.doc]);

  // Dispose Monaco listeners on unmount
  useEffect(() => {
    return () => {
      cursorListenerRef.current?.dispose();
      bindingRef.current?.destroy();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas-panel overflow-hidden">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between bg-canvas-bg border-b border-canvas-border px-2 overflow-x-auto">
        <div className="flex items-center space-x-1 py-1">
          {openFileIds.map((id) => {
            const file = files.find((f) => f.id === id);
            if (!file) return null;
            const isActive = id === activeFileId;

            return (
              <div
                key={id}
                onClick={() => openFileTab(id)}
                className={`group flex items-center space-x-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer border-t-2 transition-all ${
                  isActive
                    ? 'bg-canvas-panel text-white border-brand-primary shadow-glow-cyan'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-canvas-card/40'
                }`}
              >
                {getFileIcon(file.name)}
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(id);
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 opacity-60 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-3 pr-2">
          {/* Save status */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            {saveState === 'saving' ? (
              <>
                <Save className="w-3.5 h-3.5 text-brand-sky animate-spin" />
                <span className="hidden sm:inline text-brand-sky">CRDT Syncing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
                <span className="hidden sm:inline text-slate-400">Yjs Live Sync</span>
              </>
            )}
          </div>

          {/* Jellyfish Theme Badge */}
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-[10px] font-mono font-bold">
            <Sparkles className="w-3 h-3" />
            <span>JELLYFISH</span>
          </div>
        </div>
      </div>

      {/* Main Monaco Container */}
      <div className="flex-1 relative">
        {isReadOnly && (
          <div className="absolute top-3 right-4 z-20 flex items-center space-x-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold backdrop-blur-md">
            <Lock className="w-3.5 h-3.5" />
            <span>Read Only Mode</span>
          </div>
        )}

        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile.name)}
            defaultValue={activeFile.content || ''}
            theme={editorTheme}
            beforeMount={handleBeforeMount}
            onMount={handleEditorDidMount}
            options={{
              readOnly: isReadOnly,
              fontSize: 14,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <FileCode className="w-12 h-12 mb-2 text-slate-600 animate-pulse" />
            <p className="text-sm font-medium">Select a file from the explorer to begin editing</p>
          </div>
        )}
      </div>
    </div>
  );
}
