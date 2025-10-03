import { useState, useRef, useCallback, useEffect } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface WebRTCManager {
  isConnected: boolean;
  participants: Map<string, RTCPeerConnection>;
  localStream: MediaStream | null;
  startCall: (callId: string, channelId: Id<"channels">) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTCManager(): WebRTCManager {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallIdRef = useRef<string | null>(null);

  const sendSignal = useMutation(api.signaling.sendSignal);

  // Create peer connection
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      // Add remote video element
      if (remoteVideosRef.current) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = remoteStream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.className = 'w-full h-full object-cover';
        videoElement.id = `remote-${userId}`;
        remoteVideosRef.current.appendChild(videoElement);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && currentCallIdRef.current) {
        sendSignal({
          callId: currentCallIdRef.current,
          signal: JSON.stringify(event.candidate),
          type: 'ice-candidate',
          targetUserId: userId as Id<"users">,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    return peerConnection;
  }, [sendSignal]);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: any, fromUserId: string) => {
    let peerConnection = peerConnectionsRef.current.get(fromUserId);
    
    if (!peerConnection) {
      peerConnection = createPeerConnection(fromUserId);
      peerConnectionsRef.current.set(fromUserId, peerConnection);
    }

    try {
      if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        if (currentCallIdRef.current) {
          sendSignal({
            callId: currentCallIdRef.current,
            signal: JSON.stringify(answer),
            type: 'answer',
            targetUserId: fromUserId as Id<"users">,
          });
        }
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'ice-candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }, [createPeerConnection, sendSignal]);

  // Start a new call
  const startCall = useCallback(async (callId: string, channelId: Id<"channels">) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      currentCallIdRef.current = callId;
      setIsConnected(true);

      // In a real app, you would notify other users about the new call
      // and they would join automatically or get notifications

    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }, []);

  // Join an existing call
  const joinCall = useCallback(async (callId: string) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      currentCallIdRef.current = callId;

      // In a real app, you would:
      // 1. Get the list of participants
      // 2. Create peer connections for each participant
      // 3. Send offers to join the call

    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }, []);

  // Leave the call
  const leaveCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    setParticipants(new Map());

    // Clear remote videos
    if (remoteVideosRef.current) {
      remoteVideosRef.current.innerHTML = '';
    }

    currentCallIdRef.current = null;
    setIsConnected(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in local stream
      if (localStreamRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          // Replace track in all peer connections
          peerConnectionsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          // Replace track in all peer connections
          peerConnectionsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, [leaveCall]);

  return {
    isConnected,
    participants,
    localStream,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}
