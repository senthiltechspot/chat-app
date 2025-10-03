import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface CallTestButtonProps {
  channelId: Id<"channels">;
  channelName: string;
}

export function CallTestButton({ channelId, channelName }: CallTestButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createCall = useMutation(api.calls.createCall);

  const handleCreateTestCall = async () => {
    setIsCreating(true);
    try {
      const callId = `test_call_${channelId}_${Date.now()}`;
      await createCall({
        channelId,
        callId,
        callType: 'video',
      });
      toast.success('Test call created! You should now see a join button.');
    } catch (error) {
      console.error('Failed to create test call:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create test call');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateTestCall}
      disabled={isCreating}
      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
    >
      {isCreating ? 'Creating...' : 'Create Test Call'}
    </button>
  );
}
