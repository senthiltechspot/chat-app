interface CallAlertProps {
  callType: 'video' | 'audio';
  participantCount: number;
  isInCall: boolean;
  onJoin: () => void;
  onDismiss: () => void;
  callId?: string;
}

export function CallAlert({
  callType,
  participantCount,
  isInCall,
  onJoin,
  onDismiss
}: CallAlertProps) {
  if (isInCall) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {callType === 'video' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              {callType === 'video' ? 'Video' : 'Audio'} call in progress
            </h3>
            <p className="text-sm text-blue-700">
              {participantCount} participant{participantCount !== 1 ? 's' : ''} • Click to join
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onJoin}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Join
          </button>
          <button
            onClick={onDismiss}
            className="text-blue-400 hover:text-blue-600 transition-colors"
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
