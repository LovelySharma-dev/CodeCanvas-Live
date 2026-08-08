import * as Y from 'yjs';

// Color palette for active collaborators in Monaco Editor
export const COLLABORATOR_COLORS = [
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#84cc16'  // Lime
];

export function getRandomColor(userId) {
  if (!userId) return COLLABORATOR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

/**
 * Unified Realtime Broadcast & WebRTC Signaling Channel
 * Room standard: workspace:${workspaceId}
 */
export class WorkspaceRealtimeChannel {
  constructor(workspaceId, user) {
    this.workspaceId = workspaceId;
    this.user = user;
    this.channelName = `workspace:${workspaceId}`;
    this.doc = new Y.Doc();
    this.subscribers = new Set();
    this.eventListeners = new Map();
    this.presenceList = new Map();
    this.userColor = getRandomColor(user?.id || Math.random().toString());
    this.isClosed = false;

    // Local presence
    if (this.user) {
      this.presenceList.set(this.user.id, {
        id: this.user.id,
        name: this.user.full_name || this.user.email || 'Anonymous',
        email: this.user.email,
        avatar_url: this.user.avatar_url,
        color: this.userColor,
        activeFileId: null,
        cursor: null,
        lastSeen: Date.now()
      });
    }

    this.connect();
  }

  connect() {
    try {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (e) => this.handleMessage(e.data);
      
      // Announce presence on connect
      this.broadcastPresence();
    } catch (err) {
      console.warn('BroadcastChannel not supported in environment, using local event hub', err);
    }
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(handler);
    return () => {
      const handlers = this.eventListeners.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  sendBroadcast(event, payload) {
    if (this.isClosed) return;
    const msg = {
      type: 'broadcast',
      event,
      payload,
      senderId: this.user?.id,
      timestamp: Date.now()
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.warn('Channel postMessage skipped: channel closed.');
      }
    }

    // Trigger local listeners if any
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn({ payload, senderId: this.user?.id }));
    }
  }

  broadcastPresence(activeFileId = null, cursor = null) {
    if (!this.user || this.isClosed) return;
    const myPresence = {
      id: this.user.id,
      name: this.user.full_name || this.user.email || 'Anonymous',
      email: this.user.email,
      avatar_url: this.user.avatar_url,
      color: this.userColor,
      activeFileId,
      cursor,
      lastSeen: Date.now()
    };
    
    this.presenceList.set(this.user.id, myPresence);
    this.notifySubscribers({ type: 'presence_update', presence: Array.from(this.presenceList.values()) });

    this.sendBroadcast('PRESENCE_SYNC', myPresence);
  }

  broadcastFileChange(fileId, content) {
    this.sendBroadcast('FILE_CONTENT_CHANGE', { fileId, content });
  }

  broadcastFileTreeUpdate(action, payload) {
    this.sendBroadcast('FILE_TREE_CHANGE', { action, payload });
  }

  handleMessage(msg) {
    if (!msg || this.isClosed) return;

    if (msg.type === 'broadcast' && msg.event) {
      const handlers = this.eventListeners.get(msg.event);
      if (handlers) {
        handlers.forEach(fn => fn({ payload: msg.payload, senderId: msg.senderId }));
      }

      if (msg.event === 'PRESENCE_SYNC' && msg.payload) {
        this.presenceList.set(msg.payload.id, msg.payload);
        this.notifySubscribers({ type: 'presence_update', presence: Array.from(this.presenceList.values()) });
      } else if (msg.event === 'FILE_CONTENT_CHANGE' && msg.senderId !== this.user?.id) {
        this.notifySubscribers({ type: 'file_change', fileId: msg.payload.fileId, content: msg.payload.content });
      } else if (msg.event === 'FILE_TREE_CHANGE' && msg.senderId !== this.user?.id) {
        this.notifySubscribers({ type: 'file_tree_change', action: msg.payload.action, payload: msg.payload.payload });
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    if (this.isClosed) return;
    this.subscribers.forEach(cb => cb(data));
  }

  destroy() {
    this.isClosed = true;
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
    }
    this.subscribers.clear();
    this.eventListeners.clear();
  }
}
