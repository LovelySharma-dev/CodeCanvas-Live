import React, { useState } from 'react';
import { Save, Trash2, AlertTriangle } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useNavigate } from 'react-router-dom';

export default function GeneralSettings({ workspace, userRole, onUpdateWorkspace }) {
  const [name, setName] = useState(workspace.name || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const isOwner = userRole === 'OWNER';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    try {
      setSaving(true);
      const { data, error } = await insforge.database
        .from('workspaces')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id);

      if (error) throw error;
      setMsg({ type: 'success', text: 'Workspace details updated successfully!' });
      onUpdateWorkspace();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update workspace' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!isOwner) return;
    try {
      const { error } = await insforge.database
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete workspace' });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="What is this workspace for?"
          />
        </div>

        {msg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${
            msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {msg.text}
          </div>
        )}

        {isOwner && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-primary text-canvas-bg font-extrabold text-sm shadow-glow-cyan disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="pt-6 border-t border-rose-500/20">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-semibold text-sm">Danger Zone</h4>
            </div>
            <p className="text-xs text-slate-400">
              Deleting a workspace is permanent. All files, settings, and member invitations will be immediately wiped.
            </p>

            {isDeleting ? (
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleDeleteWorkspace}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                >
                  Yes, Delete Workspace Permanently
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleting(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Workspace</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
