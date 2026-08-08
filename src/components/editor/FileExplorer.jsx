import React, { useState } from 'react';
import { 
  FileCode, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Code,
  FileBox
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function FileExplorer() {
  const { 
    files, 
    activeFileId, 
    userRole, 
    createFile, 
    renameFile, 
    deleteFile, 
    openFileTab 
  } = useWorkspace();

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isReadOnly = userRole === 'VIEWER';

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.html')) {
      return <Code className="w-4 h-4 text-brand-sky" />;
    } else if (fileName.endsWith('.css')) {
      return <FileCode className="w-4 h-4 text-brand-primary" />;
    } else if (fileName.endsWith('.js')) {
      return <FileText className="w-4 h-4 text-brand-emerald" />;
    }
    return <FileBox className="w-4 h-4 text-slate-400" />;
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let language = 'javascript';
    const trimmed = newFileName.trim();
    if (trimmed.endsWith('.html')) language = 'html';
    else if (trimmed.endsWith('.css')) language = 'css';
    else if (trimmed.endsWith('.js')) language = 'javascript';

    try {
      await createFile(trimmed, language, '');
      setNewFileName('');
      setIsCreating(false);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Failed to create file');
    }
  };

  const handleStartRename = (file, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const handleSaveRename = async (fileId) => {
    if (editingName.trim() && editingName !== files.find(f => f.id === fileId)?.name) {
      await renameFile(fileId, editingName.trim());
    }
    setEditingFileId(null);
  };

  const handleDelete = async (fileId, fileName, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      await deleteFile(fileId);
    }
  };

  // Deduplicate files by name for clean rendering
  const uniqueFiles = (files || []).filter((file, index, self) =>
    index === self.findIndex((f) => f.name === file.name)
  );

  return (
    <div className="w-64 bg-canvas-panel border-r border-canvas-border flex flex-col h-full select-none">
      {/* Explorer Header */}
      <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Files</span>
        
        {!isReadOnly && (
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="New File"
          >
            <Plus className="w-4 h-4 text-brand-primary" />
          </button>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {uniqueFiles.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = file.id === editingFileId;

          return (
            <div
              key={file.id}
              onClick={() => openFileTab(file.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                {getFileIcon(file.name)}
                
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveRename(file.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(file.id)}
                    autoFocus
                    className="w-full bg-canvas-bg border border-cyan-500 text-white text-xs px-2 py-1 rounded outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{file.name}</span>
                )}
              </div>

              {!isReadOnly && !isEditing && (
                <div className="hidden group-hover:flex items-center space-x-1 pl-2">
                  <button
                    onClick={(e) => handleStartRename(file, e)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded"
                    title="Rename"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(file.id, file.name, e)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Create File Input Form */}
        {isCreating && (
          <form onSubmit={handleCreateFile} className="mt-2 px-2">
            <div className="flex items-center space-x-1 bg-canvas-bg border border-cyan-500/50 rounded-lg p-1.5">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. app.js or style.css"
                autoFocus
                className="w-full bg-transparent text-xs text-white outline-none px-1"
              />
              <button type="submit" className="p-1 text-cyan-400 hover:text-cyan-300">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {errorMsg && <p className="text-[10px] text-rose-400 mt-1 pl-1">{errorMsg}</p>}
          </form>
        )}
      </div>

      {/* Role Badge Footer */}
      <div className="p-3 border-t border-canvas-border bg-canvas-bg/40 flex items-center justify-between text-xs text-slate-400">
        <span>Role:</span>
        <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
          userRole === 'OWNER'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
            : userRole === 'EDITOR'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {userRole}
        </span>
      </div>
    </div>
  );
}
