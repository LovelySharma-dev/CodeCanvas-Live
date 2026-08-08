import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FolderCode, 
  Trash2, 
  Settings, 
  Clock,
  Mail,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { generateUUID } from '../utils/uuid';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [userInvites, setUserInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'OWNED' | 'SHARED'

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUserWorkspacesAndInvites = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 1. Fetch workspaces owned by user
      const { data: ownedWs } = await insforge.database
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id);

      // 2. Fetch workspaces user is a member of
      const { data: memberRows } = await insforge.database
        .from('workspace_members')
        .select('*')
        .eq('user_id', user.id);

      const memberWsIds = (memberRows || []).map(m => m.workspace_id);
      let sharedWs = [];
      if (memberWsIds.length > 0) {
        const { data: sWs } = await insforge.database
          .from('workspaces')
          .select('*')
          .in('id', memberWsIds);
        sharedWs = sWs || [];
      }

      // Merge and mark role
      const memberRoleMap = {};
      (memberRows || []).forEach(m => {
        memberRoleMap[m.workspace_id] = m.role;
      });

      const allWsMap = new Map();
      (ownedWs || []).forEach(w => {
        allWsMap.set(w.id, { ...w, role: 'OWNER' });
      });

      sharedWs.forEach(w => {
        if (!allWsMap.has(w.id)) {
          allWsMap.set(w.id, { ...w, role: memberRoleMap[w.id] || 'EDITOR' });
        }
      });

      setWorkspaces(Array.from(allWsMap.values()));

      // 3. Fetch pending invitations for logged-in user email
      if (user.email) {
        const { data: inviteRows } = await insforge.database
          .from('workspace_invites')
          .select('*')
          .eq('email', user.email.toLowerCase().trim())
          .eq('status', 'PENDING');

        const pendingInvites = inviteRows || [];
        const wsIdsToFetch = pendingInvites.map(i => i.workspace_id);

        let inviteWsMap = {};
        if (wsIdsToFetch.length > 0) {
          const { data: wsDetails } = await insforge.database
            .from('workspaces')
            .select('*')
            .in('id', wsIdsToFetch);
          
          if (wsDetails) {
            wsDetails.forEach(w => {
              inviteWsMap[w.id] = w;
            });
          }
        }

        const formattedInvites = pendingInvites.map(inv => ({
          ...inv,
          workspace: inviteWsMap[inv.workspace_id] || { name: 'Collaborative Workspace', description: 'Live Studio' }
        }));

        setUserInvites(formattedInvites);
      }

    } catch (err) {
      console.error('Error fetching workspaces and invites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserWorkspacesAndInvites();
  }, [fetchUserWorkspacesAndInvites]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      const workspaceId = generateUUID();
      let newWs;

      // 1. Insert new workspace into PostgreSQL workspaces table first
      const { data: wsData, error: wsError } = await insforge.database
        .from('workspaces')
        .insert([{
          id: workspaceId,
          name: name.trim(),
          description: description?.trim() || null,
          owner_id: user.id
        }]);

      if (wsError || !wsData || !wsData[0]) {
        newWs = {
          id: workspaceId,
          name: name.trim(),
          description: description?.trim() || null,
          owner_id: user.id,
          created_at: new Date().toISOString()
        };
      } else {
        newWs = wsData[0];
      }

      // 2. Immediately insert owner into workspace_members
      try {
        await insforge.database.from('workspace_members').insert([{
          id: generateUUID(),
          workspace_id: workspaceId,
          user_id: user.id,
          role: 'OWNER'
        }]);
      } catch(e){}

      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setWorkspaces(prev => [{ ...newWs, role: 'OWNER' }, ...prev]);
      navigate(`/workspace/${workspaceId}`);
    } catch (err) {
      console.error('Error creating workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptInvite = async (invite) => {
    try {
      await insforge.database
        .from('workspace_members')
        .insert([{
          id: generateUUID(),
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role
        }]);

      await insforge.database
        .from('workspace_invites')
        .update({ status: 'ACCEPTED' })
        .eq('id', invite.id);

      setUserInvites(prev => prev.filter(i => i.id !== invite.id));
      fetchUserWorkspacesAndInvites();
      navigate(`/workspace/${invite.workspace_id}`);
    } catch (err) {
      console.error('Failed to accept invite:', err);
      navigate(`/workspace/${invite.workspace_id}`);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await insforge.database
        .from('workspace_invites')
        .update({ status: 'DECLINED' })
        .eq('id', inviteId);

      setUserInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      setUserInvites(prev => prev.filter(i => i.id !== inviteId));
    }
  };

  const handleDeleteWorkspace = async (wsId, wsName, e) => {
    e.stopPropagation();
    if (!confirm(`Delete workspace "${wsName}"? All data will be permanently lost.`)) return;

    try {
      await insforge.database.from('workspaces').delete().eq('id', wsId);
      setWorkspaces(prev => prev.filter(w => w.id !== wsId));
    } catch (err) {
      setWorkspaces(prev => prev.filter(w => w.id !== wsId));
    }
  };

  // Filtered list
  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (roleFilter === 'OWNED') return matchesSearch && w.role === 'OWNER';
    if (roleFilter === 'SHARED') return matchesSearch && w.role !== 'OWNER';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-canvas-bg text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        
        {/* Pending Invitations Banner / Section */}
        {userInvites.length > 0 && (
          <div className="mb-8 p-6 rounded-3xl glass-panel bg-cyan-950/20 border border-cyan-500/40 shadow-glow-cyan">
            <div className="flex items-center space-x-2.5 mb-4">
              <Mail className="w-5 h-5 text-cyan-400 animate-bounce" />
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Pending Workspace Invitations ({userInvites.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userInvites.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-canvas-panel/80 border border-canvas-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">{inv.workspace.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Role: <span className="text-cyan-300 font-semibold uppercase">{inv.role}</span></p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan hover:scale-105 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Workspaces Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage your collaborative code projects and live studios</p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-canvas-bg font-extrabold text-sm shadow-glow-cyan transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-canvas-panel p-1 rounded-xl border border-canvas-border w-full sm:w-auto">
            {['ALL', 'OWNED', 'SHARED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  roleFilter === tab
                    ? 'bg-brand-primary text-canvas-bg font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'SHARED' ? 'Shared with me' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 glass-panel rounded-2xl animate-pulse bg-canvas-panel/50 border border-canvas-border" />
            ))}
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-canvas-border max-w-lg mx-auto">
            <FolderCode className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-1">No Workspaces Found</h3>
            <p className="text-xs text-slate-400 mb-6">Create your first workspace to start real-time pair programming.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-primary text-canvas-bg font-extrabold text-xs shadow-glow-cyan"
            >
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="group glass-panel bg-canvas-panel/60 hover:bg-canvas-panel border border-canvas-border hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-glow-cyan"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform">
                      <FolderCode className="w-5 h-5" />
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      ws.role === 'OWNER'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : ws.role === 'EDITOR'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {ws.role}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {ws.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-canvas-border flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ws.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/workspace/${ws.id}/settings`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Link>

                    {ws.role === 'OWNER' && (
                      <button
                        onClick={(e) => handleDeleteWorkspace(ws.id, ws.name, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-coral hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Frontend Studio"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what your team will build..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create & Launch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
