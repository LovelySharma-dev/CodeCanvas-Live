import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  ArrowLeft, 
  Sliders
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import GeneralSettings from '../components/settings/GeneralSettings';
import MemberManagement from '../components/settings/MemberManagement';
import InviteModal from '../components/settings/InviteModal';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [userRole, setUserRole] = useState('VIEWER');
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'members' | 'invites'
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const fetchWorkspaceInfo = useCallback(async () => {
    if (!workspaceId || !user) return;
    try {
      setLoading(true);
      const { data: wsData, error } = await insforge.database
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error || !wsData) throw new Error('Workspace not found');
      setWorkspace(wsData);

      if (wsData.owner_id === user.id) {
        setUserRole('OWNER');
      } else {
        const { data: mData } = await insforge.database
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        setUserRole(mData ? mData.role : 'VIEWER');
      }
    } catch (err) {
      console.error('Error fetching settings info:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    fetchWorkspaceInfo();
  }, [fetchWorkspaceInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg flex items-center justify-center text-slate-400">
        <div className="animate-pulse text-sm font-semibold">Loading settings...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center text-slate-400">
        <p className="mb-4">Workspace not found.</p>
        <Link to="/dashboard" className="px-4 py-2 bg-brand-primary text-canvas-bg font-bold rounded-xl text-xs">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-bg text-slate-100 flex flex-col font-sans">
      <Navbar workspaceName={workspace.name} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        
        {/* Top Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Link
            to={`/workspace/${workspaceId}`}
            className="p-2 rounded-xl bg-canvas-card border border-canvas-border text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{workspace.name} Settings</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage permissions, member access roles, and invites</p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-canvas-border mb-8 space-x-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-brand-primary text-brand-primary bg-cyan-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'members'
                ? 'border-brand-primary text-brand-primary bg-cyan-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'invites'
                ? 'border-brand-primary text-brand-primary bg-cyan-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Invitations</span>
          </button>
        </div>

        {/* Active Tab Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-canvas-border">
          {activeTab === 'general' && (
            <GeneralSettings
              workspace={workspace}
              userRole={userRole}
              onUpdateWorkspace={fetchWorkspaceInfo}
            />
          )}

          {activeTab === 'members' && (
            <MemberManagement
              workspaceId={workspaceId}
              userRole={userRole}
              currentUserId={user.id}
            />
          )}

          {activeTab === 'invites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Invite new colleagues and manage active invitation links.</p>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-primary text-canvas-bg font-extrabold text-xs shadow-glow-cyan"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Invite</span>
                </button>
              </div>

              <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                workspaceId={workspaceId}
                userRole={userRole}
              />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
