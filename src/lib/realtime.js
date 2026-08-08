import * as Y from 'yjs';
import { insforge } from './insforge';

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
 * Unified Realtime Yjs CRDT Broadcast & WebRTC Signaling Channel
 * Room standard: workspace:${workspaceId}
 * Yjs Doc standard: workspace-doc:${workspaceId}
 */
export class WorkspaceRealtimeChannel {
  constructor(workspaceId, user) {
    if (!workspaceId) {
      console.warn('WorkspaceRealtimeChannel initialized without valid workspaceId');
    }
    this.workspaceId = workspaceId;
    this.user = user;
    this.channelName = `workspace:${workspaceId}`;
    this.docName = `workspace-doc:${workspaceId}`;
    this.doc = new Y.Doc();
    this.subscribers = new Set();
    this.eventListeners = new Map();
    this.presenceList = new Map();
    this.userColor = getRandomColor(user?.id || Math.random().toString());
    this.isClosed = false;

    // Local presence record
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

    // Attach Yjs CRDT Document update listener
    this.doc.on('update', (update, origin) => {
      if (origin !== 'remote' && !this.isClosed) {
        this.sendBroadcast('YJS_UPDATE', {
          update: Array.from(update)
        });
      }
    });

    this.connect();
  }

  connect() {
    if (!this.workspaceId) return;

    // 1. Setup local cross-tab BroadcastChannel
    try {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (e) => this.handleMessage(e.data);
    } catch (err) {
      console.warn('BroadcastChannel fallback:', err);
    }

    // 2. Setup LocalStorage event listener for cross-window sync
    this.storageListener = (e) => {
      if (e.key === `codecanvas_rt_${this.workspaceId}` && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg && msg.senderId !== this.user?.id) {
            this.handleMessage(msg);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', this.storageListener);

    // 3. Setup InsForge Realtime WebSocket Channel
    try {
      if (insforge && typeof insforge.channel === 'function') {
        this.insforgeChannel = insforge.channel(this.channelName, {
          config: { broadcast: { self: false } }
        });

        if (this.insforgeChannel) {
          this.insforgeChannel
            .on('broadcast', { event: '*' }, ({ event, payload, senderId }) => {
              this.handleMessage({
                type: 'broadcast',
                event,
                payload,
                senderId
              });
            })
            .subscribe();
        }
      }
    } catch (err) {
      console.warn('InsForge WebSocket channel connection:', err);
    }

    // Announce presence and request full Yjs sync state on connect
    this.broadcastPresence();
    this.sendBroadcast('YJS_SYNC_REQUEST', { userId: this.user?.id });
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
    if (this.isClosed || !this.workspaceId) return;

    const msg = {
      type: 'broadcast',
      event,
      payload,
      senderId: this.user?.id,
      timestamp: Date.now()
    };

    // 1. Broadcast via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {}
    }

    // 2. Broadcast via LocalStorage event hub
    try {
      localStorage.setItem(`codecanvas_rt_${this.workspaceId}`, JSON.stringify(msg));
    } catch (e) {}

    // 3. Broadcast via InsForge WebSocket Channel
    if (this.insforgeChannel && typeof this.insforgeChannel.send === 'function') {
      try {
        this.insforgeChannel.send({
          type: 'broadcast',
          event,
          payload,
          senderId: this.user?.id
        });
      } catch (err) {}
    }

    // 4. Local Handlers
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn({ payload, senderId: this.user?.id });
        } catch (e) {}
      });
    }
  }

  broadcastPresence(activeFileId = null, cursor = null) {
    if (!this.user || this.isClosed || !this.workspaceId) return;
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
      // Apply Yjs CRDT state update from peer
      if (msg.event === 'YJS_UPDATE' && msg.payload?.update) {
        try {
          const updateArray = new Uint8Array(msg.payload.update);
          Y.applyUpdate(this.doc, updateArray, 'remote');
        } catch (err) {}
      } else if (msg.event === 'YJS_SYNC_REQUEST' && msg.senderId !== this.user?.id) {
        try {
          const fullState = Y.encodeStateAsUpdate(this.doc);
          this.sendBroadcast('YJS_UPDATE', { update: Array.from(fullState) });
        } catch (err) {}
      }

      const handlers = this.eventListeners.get(msg.event);
      if (handlers) {
        handlers.forEach(fn => {
          try {
            fn({ payload: msg.payload, senderId: msg.senderId });
          } catch (e) {}
        });
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
    this.subscribers.forEach(cb => {
      try {
        cb(data);
      } catch (e) {}
    });
  }

  destroy() {
    this.isClosed = true;
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
    }
    if (this.insforgeChannel && typeof insforge.removeChannel === 'function') {
      try {
        insforge.removeChannel(this.insforgeChannel);
      } catch (e) {}
    }
    this.subscribers.clear();
    this.eventListeners.clear();
  }
}
