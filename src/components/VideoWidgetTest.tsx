import { useState } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { VideoCallWidget } from './VideoCallWidget';

interface VideoWidgetTestProps {
  channelId: Id<"channels">;
  channelName: string;
}

export function VideoWidgetTest({ channelId, channelName }: VideoWidgetTestProps) {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <>
      <button
        onClick={() => {
          console.log('Opening video widget test');
          setShowWidget(true);
        }}
        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Test Video Widget
      </button>

      {showWidget && (
        <VideoCallWidget
          callId={`test_call_${channelId}_${Date.now()}`}
          channelId={channelId}
          channelName={channelName}
          isOpen={showWidget}
          onClose={() => {
            console.log('Closing test widget');
            setShowWidget(false);
          }}
          onJoin={() => {
            console.log('Joining test call');
          }}
          onLeave={() => {
            console.log('Leaving test call');
            setShowWidget(false);
          }}
        />
      )}
    </>
  );
}
