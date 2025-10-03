import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MessageInputProps {
  channelId: Id<"channels">;
  onMessageSent?: () => void;
}

export function MessageInput({ channelId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const sendMessage = useMutation(api.messages.send);
  const markChannelAsRead = useMutation(api.readReceipts.markChannelAsRead);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({
        channelId,
        content: message,
      });
      await markChannelAsRead({ channelId });
      setMessage("");
      onMessageSent?.();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
