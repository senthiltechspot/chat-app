import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ChannelList } from "./ChannelList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SearchBar } from "./SearchBar";
import { ProfileModal } from "./ProfileModal";
import { SignOutButton } from "../SignOutButton";

export function ChatApp() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const channels = useQuery(api.channels.list) || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markChannelAsRead = useMutation(api.readReceipts.markChannelAsRead);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0]._id);
    }
  }, [channels, selectedChannelId]);

  // Mark channel as read when selected
  useEffect(() => {
    if (selectedChannelId) {
      markChannelAsRead({ channelId: selectedChannelId });
    }
  }, [selectedChannelId, markChannelAsRead]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  });

  const selectedChannel = channels.find(c => c._id === selectedChannelId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">SlackChat</h1>
          {selectedChannel && (
            <span className="text-lg font-medium text-gray-700">
              #{selectedChannel.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            channelId={selectedChannelId}
          />
          <button
            onClick={() => setShowProfile(true)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Edit Profile
          </button>
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-purple-800 text-white flex flex-col">
          <ChannelList
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannelId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <MessageList 
                  channelId={selectedChannelId}
                  searchQuery={searchQuery}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 bg-white">
                <MessageInput 
                  channelId={selectedChannelId}
                  onMessageSent={scrollToBottom}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
