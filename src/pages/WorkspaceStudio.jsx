import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import FileExplorer from '../components/editor/FileExplorer';
import MonacoCodeEditor from '../components/editor/MonacoCodeEditor';
import LivePreview from '../components/editor/LivePreview';
import WhiteboardCanvas from '../components/editor/WhiteboardCanvas';
import PresenceList from '../components/editor/PresenceList';
import TeamChat from '../components/collaboration/TeamChat';
import VideoCall from '../components/collaboration/VideoCall';
import InviteModal from '../components/settings/InviteModal';
import { 
  Columns, 
  Sparkles, 
  FolderCode, 
  MessageSquare, 
  Video, 
  Palette, 
  Code2
} from 'lucide-react';

function StudioInner() {
  const { workspace, currentWorkspace, loading, userRole } = useWorkspace();
  
  const [showPreview, setShowPreview] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'whiteboard'
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const activeWs = currentWorkspace || workspace;

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-10 h-10 text-brand-primary animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide">Initializing CodeCanvas Jellyfish Studio...</p>
      </div>
    );
  }

  if (!activeWs) {
    return (
      <div className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center text-slate-400">
        <FolderCode className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Workspace Not Found</h3>
        <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-brand-primary text-canvas-bg font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-canvas-bg font-sans overflow-hidden">
      
      {/* Top Studio Navbar */}
      <header className="h-14 bg-canvas-panel border-b border-canvas-border px-4 flex items-center justify-between shrink-0 select-none">
        
        {/* Left Brand & Dynamic Workspace Info */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="flex items-center space-x-2 text-brand-primary font-bold text-sm hover:text-brand-sky">
            <FolderCode className="w-5 h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          
          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-100 tracking-tight">
                  {activeWs?.name || 'Loading Workspace...'}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  {userRole || 'MEMBER'}
                </span>
              </div>
              {activeWs?.description && (
                <p className="text-xs text-slate-400 truncate max-w-md" title={activeWs.description}>
                  {activeWs.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Switcher: Code Editor vs Collaborative Whiteboard */}
        <div className="flex items-center space-x-1 bg-canvas-bg p-1 rounded-xl border border-canvas-border">
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'code'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Studio</span>
          </button>

          <button
            onClick={() => setViewMode('whiteboard')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'whiteboard'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Right Tools: Video, Chat, Split View, Presence & Invite */}
        <div className="flex items-center space-x-3">
          {/* Video Call Button */}
          <button
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isVideoOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Start / Join WebRTC Video Call"
          >
            <Video className="w-3.5 h-3.5 text-brand-sky" />
            <span className="hidden lg:inline">Video Call</span>
          </button>

          {/* Team Chat Drawer Button */}
          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setUnreadChatCount(0);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border relative transition-all ${
              isChatOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Team Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />
            <span className="hidden lg:inline">Team Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Live Preview Split Toggle (Code Mode Only) */}
          {viewMode === 'code' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showPreview
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Live Preview Split Panel"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          )}

          {/* Active Presence avatars & Invite */}
          <PresenceList onOpenInviteModal={() => setIsInviteOpen(true)} />
        </div>
      </header>

      {/* Main Studio Body (Code vs Whiteboard Views) */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'code' ? (
          <>
            {/* File Explorer Sidebar */}
            <FileExplorer />

            {/* Monaco Code Editor */}
            <MonacoCodeEditor />

            {/* Live Sandboxed Preview Panel */}
            {showPreview && <LivePreview />}
          </>
        ) : (
          /* Collaborative Interactive Whiteboard Canvas */
          <WhiteboardCanvas />
        )}

        {/* Slide-out Team Chat Panel */}
        <TeamChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onNewMessage={() => setUnreadChatCount(prev => prev + 1)}
        />
      </div>

      {/* WebRTC Video Call Overlay Window */}
      <VideoCall
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={activeWs.id}
        userRole={userRole}
      />
    </div>
  );
}

export default function WorkspaceStudio() {
  const { workspaceId } = useParams();

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <StudioInner />
    </WorkspaceProvider>
  );
}
