import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { CallModal } from './CallModal';
import { VideoCallWidget } from './VideoCallWidget';
import { toast } from 'sonner';

interface CallButtonProps {
  channelId: Id<"channels">;
  channelName: string;
  className?: string;
}

export function CallButton({ channelId, channelName, className = "" }: CallButtonProps) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoWidget, setShowVideoWidget] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [isCreating, setIsCreating] = useState(false);
  const [createdCallId, setCreatedCallId] = useState<string | null>(null);
  
  const createCall = useMutation(api.calls.createCall);

  const handleStartCall = async (type: 'video' | 'audio') => {
    setIsCreating(true);
    try {
      const callId = `call_${channelId}_${Date.now()}`;
      console.log('Creating call with ID:', callId, 'Type:', type);
      
      await createCall({
        channelId,
        callId,
        callType: type,
      });
      
      setCallType(type);
      setCreatedCallId(callId);
      
      console.log('Call created successfully, showing widget for type:', type);
      
      if (type === 'video') {
        console.log('Setting showVideoWidget to true');
        setShowVideoWidget(true);
      } else {
        console.log('Setting showCallModal to true');
        setShowCallModal(true);
      }
      
      toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started!`);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start call');
    } finally {
      setIsCreating(false);
    }
  };

  const generateCallId = () => {
    return `call_${channelId}_${Date.now()}`;
  };

  // Debug logging
  console.log('CallButton state:', { 
    showCallModal, 
    showVideoWidget, 
    callType, 
    isCreating, 
    createdCallId 
  });

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => handleStartCall('video')}
          disabled={isCreating}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start video call"
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {isCreating ? 'Starting...' : 'Video Call'}
          </span>
        </button>

        <button
          onClick={() => handleStartCall('audio')}
          disabled={isCreating}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start audio call"
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {isCreating ? 'Starting...' : 'Audio Call'}
          </span>
        </button>
      </div>

      {showCallModal && (
        <CallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          callId={generateCallId()}
          channelId={channelId}
          channelName={channelName}
          participants={[]}
        />
      )}

      {showVideoWidget && (
        <VideoCallWidget
          callId={createdCallId || `call_${channelId}_${Date.now()}`}
          channelId={channelId}
          channelName={channelName}
          isOpen={showVideoWidget}
          onClose={() => {
            console.log('Closing video widget');
            setShowVideoWidget(false);
            setCreatedCallId(null);
          }}
          onJoin={() => {
            console.log('Joining call from widget');
            // Handle join logic if needed
          }}
          onLeave={() => {
            console.log('Leaving call from widget');
            setShowVideoWidget(false);
            setCreatedCallId(null);
          }}
        />
      )}
    </>
  );
}
