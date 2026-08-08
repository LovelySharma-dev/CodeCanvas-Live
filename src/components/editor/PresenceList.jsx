import React from 'react';
import { UserPlus, Settings, Shield, Edit2, Eye } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Link } from 'react-router-dom';

export default function PresenceList({ onOpenInviteModal }) {
  const { workspaceId, presenceUsers, userRole } = useWorkspace();

  return (
    <div className="flex items-center space-x-3">
      {/* Online Users Avatars Stack */}
      <div className="flex items-center -space-x-2 overflow-hidden py-1">
        {presenceUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="relative group cursor-pointer"
            title={`${user.name} (${user.email || 'Online'})`}
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
              alt={user.name}
              className="w-8 h-8 rounded-full border-2 border-canvas-bg bg-slate-800 object-cover ring-2"
              style={{ borderColor: user.color || '#06B6D4' }}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-canvas-bg" />

            {/* Hover Tooltip */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-canvas-card text-white text-xs px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50">
              <span className="font-semibold">{user.name}</span>
              <span className="text-[10px] text-slate-400">Active now</span>
            </div>
          </div>
        ))}

        {presenceUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-canvas-bg flex items-center justify-center text-xs font-bold text-slate-300">
            +{presenceUsers.length - 5}
          </div>
        )}
      </div>

      {/* Invite Button */}
      {userRole !== 'VIEWER' && (
        <button
          onClick={onOpenInviteModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all text-xs font-semibold"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite</span>
        </button>
      )}

      {/* Settings Link */}
      <Link
        to={`/workspace/${workspaceId}/settings`}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Workspace Settings"
      >
        <Settings className="w-4 h-4" />
      </Link>
    </div>
  );
}
