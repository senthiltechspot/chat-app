import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface CallCreatedNotificationProps {
  channelId: Id<"channels">;
  onJoinCall: () => void;
}

export function CallCreatedNotification({ channelId, onJoinCall }: CallCreatedNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  
  const activeCall = useQuery(api.calls.getActiveCall, { channelId });
  const currentUser = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    if (activeCall && activeCall.callId !== lastCallId) {
      // Check if current user is not the creator of the call
      if (currentUser && activeCall.createdBy !== currentUser._id) {
        setShowNotification(true);
        setLastCallId(activeCall.callId);
        
        // Auto-hide notification after 10 seconds
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [activeCall, lastCallId, currentUser]);

  if (!showNotification || !activeCall) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-right-5 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {activeCall.callType === 'video' ? 'Video' : 'Audio'} Call Started
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeCall.creatorName} started a {activeCall.callType} call
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  onJoinCall();
                  setShowNotification(false);
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Join Call
              </button>
              <button
                onClick={() => setShowNotification(false)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
