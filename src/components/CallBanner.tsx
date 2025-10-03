import { Id } from '../../convex/_generated/dataModel';

interface CallBannerProps {
  callId: string;
  channelName: string;
  participantCount: number;
  isInCall: boolean;
  onJoin: () => void;
  onLeave: () => void;
  callType: 'video' | 'audio';
}

export function CallBanner({
  callId,
  channelName,
  participantCount,
  isInCall,
  onJoin,
  onLeave,
  callType
}: CallBannerProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 mx-4 my-2 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
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
            <h3 className="font-semibold text-lg">
              {isInCall ? 'You are in the call' : 'Call in progress'}
            </h3>
            <p className="text-green-100 text-sm">
              {callType === 'video' ? 'Video' : 'Audio'} call in #{channelName} • {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isInCall ? (
            <button
              onClick={onLeave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Leave Call
            </button>
          ) : (
            <button
              onClick={onJoin}
              className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Join Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
