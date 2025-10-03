import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ChannelList } from "./ChannelList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SearchBar } from "./SearchBar";
import { ProfileModal } from "./ProfileModal";
import { CallButton } from "./CallButton";
import { CallNotification } from "./CallNotification";
import { SignOutButton } from "../SignOutButton";

export function ChatApp() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    channelId: Id<"channels">;
    channelName: string;
    callerName: string;
  } | null>(null);
  const channels = useQuery(api.channels.list) || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markChannelAsRead = useMutation(api.readReceipts.markChannelAsRead);
  
  // Call-related queries
  const activeCall = useQuery(
    api.calls.getActiveCall,
    selectedChannelId ? { channelId: selectedChannelId } : "skip"
  );
  const currentUser = useQuery(api.auth.loggedInUser);

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
      <header className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">SlackChat</h1>
          {selectedChannel && (
            <span className="hidden sm:inline text-lg font-medium text-gray-700">
              #{selectedChannel.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
              channelId={selectedChannelId}
            />
          </div>
          {selectedChannelId && (
            <CallButton 
              channelId={selectedChannelId}
              channelName={selectedChannel?.name || ""}
              className="hidden sm:flex"
            />
          )}
          <button
            onClick={() => setShowProfile(true)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Profile</span>
          </button>
          <SignOutButton />
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-2 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery}
              channelId={selectedChannelId}
            />
          </div>
          {selectedChannelId && (
            <CallButton 
              channelId={selectedChannelId}
              channelName={selectedChannel?.name || ""}
              className="flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
          w-64 bg-purple-800 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <ChannelList
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={(channelId) => {
              setSelectedChannelId(channelId);
              setSidebarOpen(false); // Close sidebar on mobile when channel is selected
            }}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChannelId ? (
            <>
              {/* Mobile Channel Header */}
              <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
                <h2 className="text-lg font-medium text-gray-900">
                  #{selectedChannel?.name}
                </h2>
              </div>

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
            <div className="flex-1 flex items-center justify-center text-gray-500 px-4">
              <p className="text-center">Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <CallNotification
          callId={incomingCall.callId}
          channelId={incomingCall.channelId}
          channelName={incomingCall.channelName}
          callerName={incomingCall.callerName}
          onAccept={() => {
            // Handle call acceptance
            setIncomingCall(null);
          }}
          onDecline={() => {
            // Handle call decline
            setIncomingCall(null);
          }}
        />
      )}

      {/* Active Call Indicator */}
      {activeCall && (
        <div className="fixed bottom-4 right-4 z-30 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Call active in #{selectedChannel?.name} ({activeCall.participantCount} participants)
          </span>
          <button
            onClick={() => {
              // Handle joining active call
            }}
            className="ml-2 px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs transition-colors"
          >
            Join
          </button>
        </div>
      )}
    </div>
  );
}
