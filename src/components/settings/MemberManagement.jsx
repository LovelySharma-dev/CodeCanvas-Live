import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Edit2, Eye, UserX } from 'lucide-react';
import { insforge } from '../../lib/insforge';

export default function MemberManagement({ workspaceId, userRole, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const isOwner = userRole === 'OWNER';

  const fetchMembersWithUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data: memberRows, error } = await insforge.database
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Join with users table
      const userIds = (memberRows || []).map(m => m.user_id);
      let userMap = {};
      if (userIds.length > 0) {
        const { data: userRows } = await insforge.database
          .from('users')
          .select('*')
          .in('id', userIds);
        
        if (userRows) {
          userRows.forEach(u => {
            userMap[u.id] = u;
          });
        }
      }

      const combined = (memberRows || []).map(m => ({
        ...m,
        user: userMap[m.user_id] || { email: 'User', full_name: 'Member' }
      }));

      setMembers(combined);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembersWithUserDetails();
  }, [fetchMembersWithUserDetails]);

  const handleRoleChange = async (memberId, newRole) => {
    if (!isOwner) return;
    try {
      setUpdatingId(memberId);
      const { error } = await insforge.database
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isOwner) return;
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const { error } = await insforge.database
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-slate-500 text-xs animate-pulse">Loading members list...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-canvas-border rounded-2xl glass-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvas-bg text-slate-400 border-b border-canvas-border uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined Date</th>
              {isOwner && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-border text-slate-300">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-canvas-card/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.user_id}`}
                      alt={member.user.full_name}
                      className="w-8 h-8 rounded-lg bg-slate-800 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-white">
                        {member.user.full_name || 'Member'}
                        {member.user_id === currentUserId && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">You</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">{member.user.email}</div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {isOwner && member.role !== 'OWNER' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={updatingId === member.id}
                      className="bg-canvas-bg border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-brand-primary"
                    >
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center space-x-1 font-semibold px-2.5 py-1 rounded-full text-[10px] ${
                      member.role === 'OWNER'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : member.role === 'EDITOR'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {member.role === 'OWNER' && <Shield className="w-3 h-3 text-cyan-400" />}
                      {member.role === 'EDITOR' && <Edit2 className="w-3 h-3 text-emerald-400" />}
                      {member.role === 'VIEWER' && <Eye className="w-3 h-3 text-slate-400" />}
                      <span>{member.role}</span>
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-500 text-[11px]">
                  {new Date(member.joined_at || Date.now()).toLocaleDateString()}
                </td>

                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-coral hover:bg-rose-500/10 transition-colors"
                        title="Remove Member"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
