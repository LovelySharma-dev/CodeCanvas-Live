import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PhoneOff, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VideoCall({ isOpen, onClose }) {
  const { user } = useAuth();
  const { workspaceId, realtimeChannel, presenceUsers } = useWorkspace();

  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // userId -> RTCPeerConnection

  // Helper to create RTCPeerConnection for a remote peer
  const createPeerConnection = (targetUserId) => {
    if (peerConnectionsRef.current.has(targetUserId)) {
      return peerConnectionsRef.current.get(targetUserId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetUserId, pc);

    // Add local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (e) => {
      if (e.candidate && realtimeChannel && !realtimeChannel.isClosed) {
        realtimeChannel.sendBroadcast('WEBRTC_SIGNAL', {
          type: 'ICE_CANDIDATE',
          targetId: targetUserId,
          senderId: user?.id,
          candidate: e.candidate
        });
      }
    };

    // Remote Track received handler
    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        const stream = e.streams[0];
        setRemotePeers(prev => {
          const filtered = prev.filter(p => p.id !== targetUserId);
          return [...filtered, { id: targetUserId, stream }];
        });
      }
    };

    return pc;
  };

  // WebRTC Signaling Event Listener
  useEffect(() => {
    if (!realtimeChannel || !inCall || !user) return;

    const unsubscribe = realtimeChannel.on('WEBRTC_SIGNAL', async ({ payload, senderId }) => {
      if (!payload || senderId === user.id) return;

      const { type, userId, targetId, offer, answer, candidate } = payload;

      // 1. JOIN_ROOM: Initiated by new joining peer
      if (type === 'JOIN_ROOM') {
        const pc = createPeerConnection(senderId);
        try {
          const offerOption = await pc.createOffer();
          await pc.setLocalDescription(offerOption);
          realtimeChannel.sendBroadcast('WEBRTC_SIGNAL', {
            type: 'WEBRTC_OFFER',
            targetId: senderId,
            senderId: user.id,
            offer: offerOption
          });
        } catch (err) {
          console.warn('Error creating WebRTC offer:', err);
        }
      }

      // 2. WEBRTC_OFFER: Received by targeted peer
      else if (type === 'WEBRTC_OFFER' && targetId === user.id) {
        const pc = createPeerConnection(senderId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answerOption = await pc.createAnswer();
          await pc.setLocalDescription(answerOption);
          realtimeChannel.sendBroadcast('WEBRTC_SIGNAL', {
            type: 'WEBRTC_ANSWER',
            targetId: senderId,
            senderId: user.id,
            answer: answerOption
          });
        } catch (err) {
          console.warn('Error handling WebRTC offer:', err);
        }
      }

      // 3. WEBRTC_ANSWER: Received by offer sender
      else if (type === 'WEBRTC_ANSWER' && targetId === user.id) {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.warn('Error setting WebRTC answer:', err);
          }
        }
      }

      // 4. ICE_CANDIDATE: Exchanged candidates
      else if (type === 'ICE_CANDIDATE' && targetId === user.id) {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [realtimeChannel, inCall, user]);

  // Start local media stream on joining call
  const startLocalStream = async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setInCall(true);

      // Broadcast JOIN_ROOM signal over workspace:${workspaceId}
      if (realtimeChannel && !realtimeChannel.isClosed) {
        realtimeChannel.sendBroadcast('WEBRTC_SIGNAL', {
          type: 'JOIN_ROOM',
          userId: user?.id
        });
      }
    } catch (err) {
      console.warn('Camera/Mic permission warning:', err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnlyStream;
        setIsVideoOff(true);
        setInCall(true);
        if (realtimeChannel && !realtimeChannel.isClosed) {
          realtimeChannel.sendBroadcast('WEBRTC_SIGNAL', {
            type: 'JOIN_ROOM',
            userId: user?.id
          });
        }
      } catch (audioErr) {
        setStreamError('Could not access camera/microphone. Check permissions.');
        setInCall(true);
      }
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    setRemotePeers([]);
    setInCall(false);
    setIsScreenSharing(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopLocalStream();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-64 h-14' : 'w-[420px] h-[460px]'
    } bg-canvas-panel/95 backdrop-blur-xl border border-cyan-500/40 rounded-3xl shadow-glass flex flex-col overflow-hidden select-none`}>
      
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-canvas-bg/80 border-b border-canvas-border flex items-center justify-between cursor-move">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-xs text-white">Live WebRTC Video Room</span>
          <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-500/20">
            {remotePeers.length + (inCall ? 1 : 0)} Active
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-brand-coral hover:bg-rose-500/10"
            title="Close Panel"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
          
          {/* Main Video Grid */}
          <div className="flex-1 bg-canvas-bg rounded-2xl border border-canvas-border relative overflow-hidden grid grid-cols-1 gap-2 p-2">
            {inCall ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff && !isScreenSharing ? 'hidden' : 'block'}`}
                />

                {/* Avatar Fallback if camera is OFF */}
                {isVideoOff && !isScreenSharing && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <img
                      src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
                      alt={user?.full_name}
                      className="w-16 h-16 rounded-2xl bg-slate-800 ring-4 ring-cyan-500/40 mb-2"
                    />
                    <span className="font-bold text-sm text-white">{user?.full_name || user?.email}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Camera Muted</span>
                  </div>
                )}

                {/* Name Badge */}
                <div className="absolute bottom-2 left-2 flex items-center space-x-1.5 bg-canvas-panel/90 px-2.5 py-1 rounded-full border border-canvas-border text-[11px] text-white backdrop-blur-md">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span className="font-semibold">{user?.full_name || 'You'} (Host)</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3 flex flex-col items-center justify-center h-full">
                <Users className="w-10 h-10 text-cyan-400 animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm text-white">Join WebRTC Video Call</h4>
                  <p className="text-xs text-slate-400 mt-1">Connect camera & mic with workspace members</p>
                </div>
                <button
                  onClick={startLocalStream}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-canvas-bg font-extrabold text-xs shadow-glow-cyan hover:scale-105 transition-all"
                >
                  Join Call Now
                </button>
              </div>
            )}

            {streamError && (
              <div className="absolute top-2 inset-x-2 p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] text-center">
                {streamError}
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          {inCall && (
            <div className="flex items-center justify-center space-x-3 py-1">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-2xl transition-all shadow-md ${
                  isMuted
                    ? 'bg-rose-500 text-white'
                    : 'bg-canvas-card border border-canvas-border text-slate-200 hover:text-white hover:border-cyan-500'
                }`}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-2xl transition-all shadow-md ${
                  isVideoOff
                    ? 'bg-rose-500 text-white'
                    : 'bg-canvas-card border border-canvas-border text-slate-200 hover:text-white hover:border-cyan-500'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-2xl transition-all shadow-md ${
                  isScreenSharing
                    ? 'bg-cyan-500 text-canvas-bg font-bold'
                    : 'bg-canvas-card border border-canvas-border text-slate-200 hover:text-white hover:border-cyan-500'
                }`}
                title="Share Screen"
              >
                <MonitorUp className="w-4 h-4" />
              </button>

              <button
                onClick={stopLocalStream}
                className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md"
                title="Leave Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
