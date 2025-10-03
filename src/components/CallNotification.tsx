import { useState, useEffect } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { CallModal } from './CallModal';

interface CallNotificationProps {
  callId: string;
  channelId: Id<"channels">;
  channelName: string;
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
  autoDeclineAfter?: number; // seconds
}

export function CallNotification({
  callId,
  channelId,
  channelName,
  callerName,
  onAccept,
  onDecline,
  autoDeclineAfter = 30
}: CallNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(autoDeclineAfter);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  const handleAccept = () => {
    setShowModal(false);
    onAccept();
  };

  const handleDecline = () => {
    setShowModal(false);
    onDecline();
  };

  if (!showModal) return null;

  return (
    <>
      {/* Notification Banner */}
      <div className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {callerName} is calling
            </p>
            <p className="text-xs text-gray-500 truncate">
              In #{channelName}
            </p>
            <p className="text-xs text-red-500">
              Auto-decline in {timeLeft}s
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDecline}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Decline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleAccept}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Accept"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={showModal}
        onClose={handleDecline}
        callId={callId}
        channelId={channelId}
        channelName={channelName}
        participants={[]}
        isIncoming={true}
        callerName={callerName}
      />
    </>
  );
}
