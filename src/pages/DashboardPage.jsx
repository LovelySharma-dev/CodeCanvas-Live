import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderPlus, 
  Search, 
  Users, 
  Code2, 
  Sparkles, 
  Clock, 
  Plus, 
  Trash2, 
  ArrowRight,
  UserCheck,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import Modal from '../components/common/Modal';
import Navbar from '../components/common/Navbar';
import { generateUUID } from '../utils/uuid';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [userInvites, setUserInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch workspaces & pending invitations for current user
  const fetchUserWorkspacesAndInvites = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Ensure user record exists in users table first
      try {
        await insforge.database.from('users').insert([{
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email.split('@')[0],
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
        }]);
      } catch (e) {}

      // 1. Fetch member records for current user
      const { data: memberRows } = await insforge.database
        .from('workspace_members')
        .select('*')
        .eq('user_id', user.id);

      const memberWorkspaceIds = (memberRows || []).map(m => m.workspace_id);

      // 2. Fetch workspaces owned by user OR member of
      let userWsList = [];
      const { data: ownedWs } = await insforge.database
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedWs) {
        userWsList = [...ownedWs.map(w => ({ ...w, role: 'OWNER' }))];
      }

      if (memberWorkspaceIds.length > 0) {
        const { data: memberWs } = await insforge.database
          .from('workspaces')
          .select('*')
          .in('id', memberWorkspaceIds);

        if (memberWs) {
          memberWs.forEach(ws => {
            if (!userWsList.some(w => w.id === ws.id)) {
              const memRecord = memberRows.find(m => m.workspace_id === ws.id);
              userWsList.push({ ...ws, role: memRecord ? memRecord.role : 'EDITOR' });
            }
          });
        }
      }

      setWorkspaces(userWsList);

      // 3. Fetch pending invitations for user's email
      const { data: pendingInvites } = await insforge.database
        .from('workspace_invites')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .eq('status', 'PENDING');

      if (pendingInvites && pendingInvites.length > 0) {
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
      } else {
        setUserInvites([]);
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
    if (!name.trim() || !user) return;

    try {
      setCreating(true);

      // Ensure user record exists in users table first
      try {
        await insforge.database.from('users').insert([{
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email.split('@')[0],
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
        }]);
      } catch (e) {}

      const workspaceId = generateUUID();
      let newWs;

      // 1. Insert new workspace into PostgreSQL workspaces table
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

      // 2. Insert owner into workspace_members if not present
      try {
        await insforge.database.from('workspace_members').insert([{
          id: generateUUID(),
          workspace_id: workspaceId,
          user_id: user.id,
          role: 'OWNER'
        }]);
      } catch(e) {}

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
    if (!user || !invite) return;

    try {
      // 1. Ensure user row exists in users table
      try {
        await insforge.database.from('users').insert([{
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email.split('@')[0],
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
        }]);
      } catch (e) {}

      // 2. Check if member row already exists
      const { data: existingMembers } = await insforge.database
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', user.id);

      if (!existingMembers || existingMembers.length === 0) {
        try {
          await insforge.database
            .from('workspace_members')
            .insert([{
              id: generateUUID(),
              workspace_id: invite.workspace_id,
              user_id: user.id,
              role: invite.role
            }]);
        } catch (e) {}
      }

      // 3. Mark invite accepted
      try {
        await insforge.database
          .from('workspace_invites')
          .update({ status: 'ACCEPTED' })
          .eq('id', invite.id);
      } catch (e) {}

      setUserInvites(prev => prev.filter(i => i.id !== invite.id));
      fetchUserWorkspacesAndInvites();
      navigate(`/workspace/${invite.workspace_id}`);
    } catch (err) {
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

  const handleDeleteWorkspace = async (workspaceId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;

    try {
      await insforge.database.from('workspaces').delete().eq('id', workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  const filteredWorkspaces = workspaces.filter(w => 
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas-bg font-sans text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Developer Workspaces</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
                {workspaces.length} Total
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage and jump into your pair programming sessions</p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-canvas-bg font-extrabold text-sm shadow-glow-cyan transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Pending Workspace Invitations Banner */}
        {userInvites.length > 0 && (
          <div className="p-4 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-300">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Pending Workspace Invitations ({userInvites.length})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userInvites.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-canvas-card border border-canvas-border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{inv.workspace?.name}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      Role: {inv.role}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input Filter */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces by name..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass-input text-xs text-white"
          />
        </div>

        {/* Workspace Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Sparkles className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Loading workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="py-16 text-center bg-canvas-panel/50 border border-canvas-border rounded-3xl p-8 space-y-4">
            <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Workspaces Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a new workspace to start pair-programming with your team.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan"
            >
              Create First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="group p-6 rounded-3xl bg-canvas-panel border border-canvas-border hover:border-cyan-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-glow-cyan flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ws.role === 'OWNER' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {ws.role}
                    </span>

                    {ws.role === 'OWNER' && (
                      <button
                        onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-coral hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {ws.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                    {ws.description || 'Live pair programming studio'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-canvas-border flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(ws.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-brand-primary font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Storefront"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of project goals..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
