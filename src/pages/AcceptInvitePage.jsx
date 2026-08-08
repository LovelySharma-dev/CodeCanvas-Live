import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MailCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';
import { generateUUID } from '../utils/uuid';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid' | 'accepted' | 'expired'
  const [errorMsg, setErrorMsg] = useState('');
  const [accepting, setAccepting] = useState(false);

  const verifyInviteToken = useCallback(async () => {
    try {
      setStatus('loading');
      const { data: invData, error: invError } = await insforge.database
        .from('workspace_invites')
        .select('*')
        .eq('token', token)
        .single();

      if (invError || !invData) {
        setStatus('invalid');
        setErrorMsg('Invalid or expired invitation link.');
        return;
      }

      if (invData.status === 'ACCEPTED') {
        setStatus('accepted');
        return;
      }

      if (invData.expires_at && new Date(invData.expires_at) < new Date()) {
        setStatus('expired');
        setErrorMsg('This invitation has expired. Please ask the workspace owner to send a new invitation.');
        return;
      }

      setInvite(invData);

      const { data: wsData } = await insforge.database
        .from('workspaces')
        .select('*')
        .eq('id', invData.workspace_id)
        .single();

      if (wsData) setWorkspace(wsData);
      setStatus('valid');

    } catch (err) {
      setStatus('invalid');
      setErrorMsg('Failed to verify invitation link.');
    }
  }, [token]);

  useEffect(() => {
    verifyInviteToken();
  }, [verifyInviteToken]);

  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    try {
      setAccepting(true);
      const { error: memberErr } = await insforge.database
        .from('workspace_members')
        .insert([{
          id: generateUUID(),
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role
        }]);

      if (memberErr && !memberErr.message?.includes('duplicate key')) {
        throw memberErr;
      }

      await insforge.database
        .from('workspace_invites')
        .update({ status: 'ACCEPTED' })
        .eq('id', invite.id);

      navigate(`/workspace/${invite.workspace_id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="w-full max-w-md glass-panel bg-canvas-panel/90 border border-canvas-border rounded-3xl p-8 shadow-glass text-center">
        
        {status === 'loading' && (
          <div className="py-8 text-slate-400">
            <Sparkles className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Verifying invitation token...</p>
          </div>
        )}

        {(status === 'invalid' || status === 'expired') && (
          <div className="py-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-brand-coral mx-auto" />
            <h3 className="text-xl font-bold text-white">{status === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}</h3>
            <p className="text-xs text-slate-400">{errorMsg}</p>
            <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-xs">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'accepted' && (
          <div className="py-6 space-y-4">
            <MailCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Invitation Already Accepted</h3>
            <p className="text-xs text-slate-400">You have already accepted this invitation.</p>
            <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-brand-primary text-canvas-bg font-bold text-xs">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'valid' && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-brand-primary">
              <MailCheck className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Workspace Invitation</h2>
              <p className="text-sm text-slate-300 mt-2">
                You have been invited to join <span className="font-bold text-cyan-300">{workspace?.name || 'Workspace'}</span> as an <span className="uppercase font-semibold text-emerald-400">{invite?.role}</span>.
              </p>
            </div>

            {user ? (
              <button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-canvas-bg font-extrabold text-sm shadow-glow-cyan transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{accepting ? 'Joining Workspace...' : 'Accept Invitation & Join'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400">Please sign in or create an account to accept this invitation.</p>
                <div className="flex gap-3">
                  <Link
                    to={`/login?redirect=/invite/${token}`}
                    className="flex-1 py-2.5 rounded-xl bg-brand-primary text-canvas-bg font-bold text-xs shadow-glow-cyan"
                  >
                    Log In
                  </Link>
                  <Link
                    to={`/signup?redirect=/invite/${token}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
