import { useState, useEffect } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { useWebRTC, CallParticipant } from '../hooks/useWebRTC';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  channelId: Id<"channels">;
  channelName: string;
  participants: CallParticipant[];
  isIncoming?: boolean;
  callerName?: string;
}

export function CallModal({
  isOpen,
  onClose,
  callId,
  channelId,
  channelName,
  participants,
  isIncoming = false,
  callerName
}: CallModalProps) {
  const {
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
  } = useWebRTC();

  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isCallActive]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleJoinCall = async () => {
    setIsConnecting(true);
    try {
      await joinCall(callId, channelId);
    } catch (error) {
      console.error('Failed to join call:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveCall = () => {
    leaveCall();
    onClose();
  };

  const handleAcceptCall = async () => {
    await handleJoinCall();
  };

  const handleDeclineCall = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isIncoming ? `Incoming call from ${callerName}` : `Call in #${channelName}`}
            </h2>
            {callState.isCallActive && (
              <p className="text-sm text-purple-200">
                Duration: {formatDuration(callDuration)}
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
          {!callState.isCallActive ? (
            // Call invitation or connecting state
            <div className="text-center py-8">
              {isIncoming ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {callerName} is calling
                    </h3>
                    <p className="text-gray-600">Join the call in #{channelName}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleDeclineCall}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptCall}
                      disabled={isConnecting}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {isConnecting ? 'Connecting...' : 'Accept'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Start Video Call
                    </h3>
                    <p className="text-gray-600">Call participants in #{channelName}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinCall}
                      disabled={isConnecting}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {isConnecting ? 'Starting...' : 'Start Call'}
                    </button>
                  </div>
                </div>
              )}
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
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    You {callState.isMuted && '🔇'} {callState.isVideoOff && '📹'}
                  </div>
                </div>

                {/* Remote Videos */}
                <div ref={remoteVideosRef} className="contents">
                  {participants.map((participant) => (
                    <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                      {participant.stream ? (
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(video) => {
                            if (video && participant.stream) {
                              video.srcObject = participant.stream;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {participant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {participant.name} {participant.isMuted && '🔇'} {participant.isVideoOff && '📹'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    callState.isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={callState.isMuted ? 'Unmute' : 'Mute'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {callState.isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    callState.isVideoOff 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={callState.isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {callState.isVideoOff ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={callState.isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    callState.isScreenSharing 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title={callState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
