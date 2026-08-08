import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Code, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { insforge } from '../../lib/insforge';
import { generateUUID } from '../../utils/uuid';

export default function TeamChat({ isOpen, onClose, onNewMessage }) {
  const { user } = useAuth();
  const { workspaceId, realtimeChannel, presenceUsers } = useWorkspace();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch initial chat messages from database
  useEffect(() => {
    if (!workspaceId) return;

    const fetchChatHistory = async () => {
      try {
        const { data } = await insforge.database
          .from('workspace_messages')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          setMessages(data);
        } else {
          setMessages([
            {
              id: 'welcome-msg',
              workspace_id: workspaceId,
              user_id: 'system',
              sender_name: 'CodeCanvas Bot',
              sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=codecanvas-bot',
              content: '👋 Welcome to the team chat! Share code snippets, discuss architecture, or pair program in real time.',
              is_code: false,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        setMessages([
          {
            id: 'welcome-msg',
            workspace_id: workspaceId,
            user_id: 'system',
            sender_name: 'CodeCanvas Bot',
            sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=codecanvas-bot',
            content: '👋 Welcome to the team chat! Share code snippets or pair program in real time.',
            is_code: false,
            created_at: new Date().toISOString()
          }
        ]);
      }
    };

    fetchChatHistory();
  }, [workspaceId]);

  // Subscribe to real-time CHAT_MESSAGE broadcast on room channel workspace:${workspaceId}
  useEffect(() => {
    if (!realtimeChannel) return;

    const unsubscribe = realtimeChannel.on('CHAT_MESSAGE', ({ payload }) => {
      if (payload) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        if (!isOpen && onNewMessage) {
          onNewMessage();
        }
      }
    });

    return () => unsubscribe();
  }, [realtimeChannel, isOpen, onNewMessage]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const newMsg = {
      id: generateUUID(),
      workspace_id: workspaceId,
      user_id: user.id,
      sender_name: user.full_name || user.email.split('@')[0],
      sender_avatar: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
      content: inputMessage.trim(),
      is_code: isCodeMode,
      created_at: new Date().toISOString()
    };

    // Update local state
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsCodeMode(false);

    // Broadcast message via unified realtime channel workspace:${workspaceId}
    if (realtimeChannel && !realtimeChannel.isClosed) {
      realtimeChannel.sendBroadcast('CHAT_MESSAGE', newMsg);
    }

    // Persist to PostgreSQL database
    try {
      await insforge.database.from('workspace_messages').insert([newMsg]);
    } catch (err) {
      console.warn('Chat save warning:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-canvas-panel border-l border-canvas-border flex flex-col z-30 select-none shadow-2xl animate-fade-in">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between bg-canvas-bg/60">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-brand-primary" />
          <span className="font-bold text-xs text-white uppercase tracking-wider">Team Chat</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
            {presenceUsers.length} Online
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;

          return (
            <div key={msg.id} className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <img
                src={msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.user_id}`}
                alt={msg.sender_name}
                className="w-7 h-7 rounded-lg object-cover bg-slate-800 shrink-0 mt-0.5 ring-1 ring-cyan-500/30"
              />

              <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-0.5">
                  <span className="font-bold text-[11px] text-slate-300">{msg.sender_name}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl break-words leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-tr-none'
                    : 'bg-canvas-card border border-canvas-border text-slate-200 rounded-tl-none'
                }`}>
                  {msg.is_code ? (
                    <div className="font-mono text-[11px] bg-canvas-bg/90 p-2 rounded-lg border border-slate-800 overflow-x-auto text-cyan-300">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 border-b border-slate-800 pb-1 mb-1">
                        <span>code snippet</span>
                        <Code className="w-3 h-3 text-cyan-400" />
                      </div>
                      <pre className="whitespace-pre-wrap font-mono">{msg.content}</pre>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-canvas-border bg-canvas-bg/80 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsCodeMode(!isCodeMode)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                isCodeMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Code Snippet Format"
            >
              <Code className="w-3 h-3" />
              <span>{isCodeMode ? 'Code Mode' : 'Text Mode'}</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-500">Press Enter to send</span>
        </div>

        <div className="relative flex items-center">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isCodeMode ? 'Paste or type code snippet...' : 'Type team message...'}
            rows={isCodeMode ? 3 : 2}
            className="w-full pl-3 pr-10 py-2 rounded-xl glass-input text-xs text-white resize-none outline-none focus:border-brand-primary"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg shadow-glow-cyan hover:scale-105 transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>
      </form>
    </div>
  );
}
