import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { useAuth } from './AuthContext';
import { WorkspaceRealtimeChannel } from '../lib/realtime';
import { DEFAULT_STARTER_FILES } from '../constants/starterFiles';
import { generateUUID, isValidUUID } from '../utils/uuid';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ workspaceId, children }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState('VIEWER'); // 'OWNER' | 'EDITOR' | 'VIEWER'
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [openFileIds, setOpenFileIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);
  
  const isSeedingRef = useRef(false);

  // Fetch Workspace details, members, and files with deduplication guard
  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId || !user) return;
    try {
      setLoading(true);

      // Check if IDs are valid UUIDs for PostgreSQL query safety
      if (!isValidUUID(workspaceId) || !isValidUUID(user?.id)) {
        setWorkspace({
          id: workspaceId,
          name: 'Collaborative Workspace',
          description: 'Live pair programming studio',
          owner_id: user?.id || 'guest'
        });
        setUserRole('OWNER');

        const initialStarterFiles = DEFAULT_STARTER_FILES.map(f => ({
          id: generateUUID(),
          workspace_id: workspaceId,
          name: f.name,
          language: f.language,
          content: f.content
        }));
        setFiles(initialStarterFiles);
        if (initialStarterFiles.length > 0) {
          setActiveFileId(initialStarterFiles[0].id);
          setOpenFileIds([initialStarterFiles[0].id]);
        }
        return;
      }

      // 1. Fetch workspace details from PostgreSQL
      const { data: wsData, error: wsError } = await insforge.database
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
      
      if (wsError || !wsData) {
        setWorkspace({
          id: workspaceId,
          name: 'Collaborative Workspace',
          description: 'Live pair programming studio',
          owner_id: user.id
        });
        setUserRole('OWNER');
      } else {
        setWorkspace(wsData);
        if (wsData.owner_id === user.id) {
          setUserRole('OWNER');
        } else {
          const { data: memberRows } = await insforge.database
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', workspaceId);

          const formattedMembers = memberRows || [];
          setMembers(formattedMembers);
          const myMemberRecord = formattedMembers.find(m => m.user_id === user.id);
          setUserRole(myMemberRecord ? myMemberRecord.role : 'EDITOR');
        }
      }

      // 2. Fetch workspace files with strict deduplication guard
      let { data: dbFiles } = await insforge.database
        .from('files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (!dbFiles || dbFiles.length === 0) {
        if (!isSeedingRef.current) {
          isSeedingRef.current = true;
          const initialFiles = [];
          for (const tmpl of DEFAULT_STARTER_FILES) {
            const newFile = {
              id: generateUUID(),
              workspace_id: workspaceId,
              name: tmpl.name,
              language: tmpl.language,
              content: tmpl.content
            };
            try {
              await insforge.database.from('files').insert([newFile]);
            } catch (e) {}
            initialFiles.push(newFile);
          }
          dbFiles = initialFiles;
          isSeedingRef.current = false;
        }
      } else {
        // De-duplicate files by name in frontend state & clean up PostgreSQL duplicate records
        const seenNames = new Set();
        const uniqueFiles = [];
        const duplicateIdsToDelete = [];

        for (const file of dbFiles) {
          if (!seenNames.has(file.name)) {
            seenNames.add(file.name);
            uniqueFiles.push(file);
          } else {
            duplicateIdsToDelete.push(file.id);
          }
        }

        // Clean up duplicate records in database permanently
        if (duplicateIdsToDelete.length > 0) {
          for (const dupId of duplicateIdsToDelete) {
            try {
              await insforge.database.from('files').delete().eq('id', dupId);
            } catch (e) {}
          }
        }

        dbFiles = uniqueFiles;
      }

      setFiles(dbFiles || []);
      if (dbFiles && dbFiles.length > 0) {
        setActiveFileId(dbFiles[0].id);
        setOpenFileIds([dbFiles[0].id]);
      }

    } catch (err) {
      console.error('Error loading workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Setup Realtime WebSocket Channel
  useEffect(() => {
    if (!workspaceId || !user) return;

    const channel = new WorkspaceRealtimeChannel(workspaceId, user);
    setRealtimeChannel(channel);

    const unsubscribe = channel.subscribe((data) => {
      if (data.type === 'presence_update') {
        setPresenceUsers(data.presence);
      } else if (data.type === 'file_change') {
        setFiles(prev => prev.map(f => f.id === data.fileId ? { ...f, content: data.content } : f));
      } else if (data.type === 'file_tree_change') {
        loadWorkspaceData();
      }
    });

    return () => {
      unsubscribe();
      channel.destroy();
    };
  }, [workspaceId, user, loadWorkspaceData]);

  // File Operations
  const createFile = async (name, language = 'javascript', content = '') => {
    if (userRole === 'VIEWER') return;

    // Check if file with same name already exists to prevent duplicate UI entries
    const existing = files.find(f => f.name === name);
    if (existing) {
      setActiveFileId(existing.id);
      setOpenFileIds(prev => Array.from(new Set([...prev, existing.id])));
      return existing;
    }

    const generatedFileId = generateUUID();
    const newFile = {
      id: generatedFileId,
      workspace_id: workspaceId,
      name,
      language,
      content
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenFileIds(prev => Array.from(new Set([...prev, newFile.id])));

    if (realtimeChannel) {
      realtimeChannel.broadcastFileTreeUpdate('create', newFile);
    }

    if (isValidUUID(workspaceId)) {
      try {
        await insforge.database
          .from('files')
          .insert([{
            id: generatedFileId,
            workspace_id: workspaceId,
            name,
            language,
            content
          }]);
      } catch (err) {
        console.warn('File insert warning:', err);
      }
    }
    return newFile;
  };

  const updateFileContent = async (fileId, content) => {
    if (userRole === 'VIEWER') return;
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));

    if (realtimeChannel) {
      realtimeChannel.broadcastFileChange(fileId, content);
    }

    if (isValidUUID(fileId) && isValidUUID(workspaceId)) {
      try {
        await insforge.database
          .from('files')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', fileId);
      } catch (err) {
        console.warn('File save warning:', err);
      }
    }
  };

  const renameFile = async (fileId, newName) => {
    if (userRole === 'VIEWER') return;
    let language = 'javascript';
    if (newName.endsWith('.html')) language = 'html';
    else if (newName.endsWith('.css')) language = 'css';
    else if (newName.endsWith('.js')) language = 'javascript';

    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName, language } : f));

    if (realtimeChannel) {
      realtimeChannel.broadcastFileTreeUpdate('rename', { fileId, newName });
    }

    if (isValidUUID(fileId)) {
      try {
        await insforge.database
          .from('files')
          .update({ name: newName, language })
          .eq('id', fileId);
      } catch (err) {
        console.warn('File rename warning:', err);
      }
    }
  };

  const deleteFile = async (fileId) => {
    if (userRole === 'VIEWER') return;
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setOpenFileIds(prev => prev.filter(id => id !== fileId));

    if (activeFileId === fileId) {
      const remaining = files.filter(f => f.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }

    if (realtimeChannel) {
      realtimeChannel.broadcastFileTreeUpdate('delete', fileId);
    }

    if (isValidUUID(fileId)) {
      try {
        await insforge.database
          .from('files')
          .delete()
          .eq('id', fileId);
      } catch (err) {
        console.warn('File delete warning:', err);
      }
    }
  };

  const openFileTab = (fileId) => {
    setActiveFileId(fileId);
    setOpenFileIds(prev => Array.from(new Set([...prev, fileId])));
    if (realtimeChannel) {
      realtimeChannel.broadcastPresence(fileId);
    }
  };

  const closeFileTab = (fileId) => {
    const nextOpen = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId) || null;

  return (
    <WorkspaceContext.Provider value={{
      workspaceId,
      workspace,
      currentWorkspace: workspace,
      members,
      userRole,
      files,
      activeFileId,
      activeFile,
      openFileIds,
      presenceUsers,
      loading,
      createFile,
      updateFileContent,
      renameFile,
      deleteFile,
      openFileTab,
      closeFileTab,
      setActiveFileId,
      realtimeChannel,
      loadWorkspaceData
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
