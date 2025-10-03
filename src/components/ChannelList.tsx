import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Channel {
  _id: Id<"channels">;
  name: string;
  createdBy: Id<"users">;
  _creationTime: number;
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: Id<"channels"> | null;
  onSelectChannel: (channelId: Id<"channels">) => void;
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel }: ChannelListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const createChannel = useMutation(api.channels.create);
  const unreadCounts = useQuery(api.readReceipts.getAllUnreadCounts) || {};

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const channelId = await createChannel({ name: newChannelName.trim() });
      setNewChannelName("");
      setShowCreateForm(false);
      onSelectChannel(channelId);
      toast.success("Channel created!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create channel");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-purple-700">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">Channels</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-6 h-6 rounded bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-sm font-bold transition-colors"
            title="Create channel"
          >
            +
          </button>
        </div>
      </div>

      {/* Create Channel Form */}
      {showCreateForm && (
        <div className="p-3 sm:p-4 border-b border-purple-700 bg-purple-700">
          <form onSubmit={handleCreateChannel} className="space-y-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 rounded border-0 focus:ring-2 focus:ring-purple-400 outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1 text-xs sm:text-sm bg-green-600 hover:bg-green-500 rounded transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewChannelName("");
                }}
                className="px-3 py-1 text-xs sm:text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {channels.map((channel) => {
          const unreadCount = unreadCounts[channel._id] || 0;
          
          return (
            <button
              key={channel._id}
              onClick={() => onSelectChannel(channel._id)}
              className={`w-full text-left px-3 sm:px-4 py-2 hover:bg-purple-700 transition-colors flex items-center justify-between ${
                selectedChannelId === channel._id ? "bg-purple-600" : ""
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                <span className="text-gray-300 text-sm">#</span> 
                <span className={`text-sm sm:text-base truncate ${unreadCount > 0 ? "font-semibold" : ""}`}>
                  {channel.name}
                </span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-[18px] sm:min-w-[20px] text-center flex-shrink-0 ml-2">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
