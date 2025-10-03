import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useWebRTCManager } from '../hooks/useWebRTCManager';

interface VideoCallWidgetProps {
  callId: string;
  channelId: Id<"channels">;
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

export function VideoCallWidget({
  callId,
  channelId,
  channelName,
  isOpen,
  onClose,
  onJoin,
  onLeave
}: VideoCallWidgetProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);

  // Use WebRTC manager
  const webrtcManager = useWebRTCManager();

  // Get call participants
  const participants = useQuery(api.calls.getCallParticipants, { callId }) || [];
  const currentUser = useQuery(api.auth.loggedInUser);

  // Auto-join if user is already a participant (creator)
  useEffect(() => {
    if (isOpen && currentUser && participants.length > 0) {
      const isAlreadyParticipant = participants.some(p => p.userId === currentUser._id);
      if (isAlreadyParticipant && !isJoined) {
        handleJoinCall();
      }
    }
  }, [isOpen, currentUser, participants, isJoined]);

  // Update local video element when WebRTC local stream changes
  useEffect(() => {
    if (webrtcManager.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = webrtcManager.localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [webrtcManager.localStream]);


  // Call mutations
  const joinCallMutation = useMutation(api.calls.joinCall);
  const leaveCallMutation = useMutation(api.calls.leaveCall);
  const updateStatusMutation = useMutation(api.calls.updateParticipantStatus);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isJoined) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isJoined]);


  // Handle joining the call
  const handleJoinCall = async () => {
    setIsConnecting(true);
    try {
      // Check if user is already a participant
      const isAlreadyParticipant = participants.some(p => p.userId === currentUser?._id);
      
      if (!isAlreadyParticipant) {
        // Join the call in the database
        await joinCallMutation({ callId });
      }
      
      // Start WebRTC call
      await webrtcManager.startCall(callId, channelId);
      
      setIsJoined(true);
      onJoin();
    } catch (error) {
      console.error('Failed to join call:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle leaving the call
  const handleLeaveCall = async () => {
    try {
      // Leave WebRTC call
      webrtcManager.leaveCall();

      // Leave call in database
      await leaveCallMutation({ callId });
      
      setIsJoined(false);
      setCallDuration(0);
      onLeave();
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    webrtcManager.toggleMute();
  };

  // Toggle video
  const toggleVideo = () => {
    webrtcManager.toggleVideo();
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      await webrtcManager.startScreenShare();
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  // Stop screen sharing
  const stopScreenShare = async () => {
    try {
      await webrtcManager.stopScreenShare();
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    console.log('VideoCallWidget: isOpen is false, not rendering');
    return null;
  }

  console.log('VideoCallWidget: Rendering widget with isOpen:', isOpen);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isJoined ? `In Call - ${channelName}` : `Join Call - ${channelName}`}
            </h2>
            {isJoined && (
              <p className="text-sm text-purple-200">
                Duration: {formatDuration(callDuration)} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Call Content */}
        <div className="p-4">
          {!isJoined ? (
            // Join call interface
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Video Call Ready
              </h3>
              <p className="text-gray-600 mb-6">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} in this call
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleJoinCall}
                  disabled={isConnecting}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Join Call
                    </>
                  )}
                </button>
                
              </div>
            </div>
          ) : (
            // Active call interface
            <div className="space-y-4">
              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-96 bg-gray-900 rounded-lg overflow-hidden">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                  {!webrtcManager.localStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-semibold text-lg">
                            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <p className="text-sm">Loading video...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    You
                  </div>
                </div>

                {/* Remote Videos */}
                <div ref={remoteVideosRef} className="contents">
                  {Array.from(webrtcManager.remoteStreams.entries()).map(([userId, stream]) => {
                    const participant = participants.find(p => p.userId === userId);
                    return (
                      <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(videoElement) => {
                            if (videoElement && stream) {
                              videoElement.srcObject = stream;
                            }
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {participant?.userName || 'Unknown User'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoOff 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenSharing 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                  title="Leave call"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Participants List */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Participants ({participants.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-2 p-2 bg-white rounded">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.userName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {participant.isMuted && <span>🔇</span>}
                          {participant.isVideoOff && <span>📹</span>}
                          <span>Joined {new Date(participant.joinedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
