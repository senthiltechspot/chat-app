import { useState, useRef, useCallback, useEffect } from 'react';
import { Id } from '../../convex/_generated/dataModel';

export interface CallParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
}

export interface CallState {
  isInCall: boolean;
  isCallActive: boolean;
  callId: string | null;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export function useWebRTC() {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCallActive: false,
    callId: null,
    participants: [],
    localStream: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: audio,
      });
      
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
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
        const audioTrack = screenStream.getAudioTracks()[0];
        
        if (videoTrack) {
          const sender = peerConnectionsRef.current.values().next().value?.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
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
        const sender = peerConnectionsRef.current.values().next().value?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, []);

  // Join call
  const joinCall = useCallback(async (callId: string, channelId: Id<"channels">) => {
    try {
      const stream = await initializeLocalStream();
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCallActive: true,
        callId,
      }));
      
      // Here you would typically connect to a signaling server
      // For now, we'll just set up the local stream
      return stream;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }, [initializeLocalStream]);

  // Leave call
  const leaveCall = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    setCallState({
      isInCall: false,
      isCallActive: false,
      callId: null,
      participants: [],
      localStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
    };
  }, []);

  return {
    callState,
    localVideoRef,
    remoteVideosRef,
    initializeLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleVideo,
    joinCall,
    leaveCall,
  };
}
