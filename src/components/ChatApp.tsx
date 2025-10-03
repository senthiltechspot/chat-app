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
import { CallBanner } from "./CallBanner";
import { VideoCallWidget } from "./VideoCallWidget";
import { CallCreatedNotification } from "./CallCreatedNotification";
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
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [showVideoWidget, setShowVideoWidget] = useState(false);
  const channels = useQuery(api.channels.list) || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markChannelAsRead = useMutation(api.readReceipts.markChannelAsRead);
  
  // Call-related queries
  const activeCall = useQuery(
    api.calls.getActiveCall,
    selectedChannelId ? { channelId: selectedChannelId } : "skip"
  );
  const currentUser = useQuery(api.auth.loggedInUser);

  // Debug logging (removed for production)
  // useEffect(() => {
  //   console.log('Active call data:', activeCall);
  //   console.log('Selected channel ID:', selectedChannelId);
  // }, [activeCall, selectedChannelId]);
  
  // Call mutations
  const joinCallMutation = useMutation(api.calls.joinCall);
  const leaveCallMutation = useMutation(api.calls.leaveCall);

  // Handle joining an active call
  const handleJoinCall = async () => {
    if (!activeCall) return;
    
    try {
      await joinCallMutation({ callId: activeCall.callId });
      setIsInCall(true);
      setCurrentCallId(activeCall.callId);
      setShowVideoWidget(true);
    } catch (error) {
      console.error('Failed to join call:', error);
    }
  };

  // Handle leaving a call
  const handleLeaveCall = async () => {
    if (!currentCallId) return;
    
    try {
      await leaveCallMutation({ callId: currentCallId });
      setIsInCall(false);
      setCurrentCallId(null);
      setShowVideoWidget(false);
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

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
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo and App Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold">SlackChat</h1>
            </div>
            
            {/* Channel Info */}
            {selectedChannel && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-px h-6 bg-white bg-opacity-30"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-100">#</span>
                  <span className="text-lg font-medium">{selectedChannel.name}</span>
                  {activeCall && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">
                        {isInCall ? 'In Call' : 'Call Active'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar - Desktop */}
            <div className="hidden sm:block">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery}
                channelId={selectedChannelId}
              />
            </div>
            
            {/* Call Actions */}
            {selectedChannelId && (
              <div className="hidden sm:flex gap-2">
                <CallButton 
                  channelId={selectedChannelId}
                  channelName={selectedChannel?.name || ""}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                />
              </div>
            )}
            
            {/* Profile Button */}
            <button
              onClick={() => setShowProfile(true)}
              className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors font-medium"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Profile</span>
            </button>
            
            {/* Sign Out */}
            <SignOutButton />
          </div>
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
            <div className="flex gap-2 flex-shrink-0">
              <CallButton 
                channelId={selectedChannelId}
                channelName={selectedChannel?.name || ""}
                className=""
              />
            </div>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    #{selectedChannel?.name}
                  </h2>
                  {activeCall && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">
                        {isInCall ? 'In Call' : 'Call Active'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Banner */}
              {activeCall && (
                <CallBanner
                  callId={activeCall.callId}
                  channelName={selectedChannel?.name || ""}
                  participantCount={activeCall.participantCount}
                  isInCall={isInCall}
                  onJoin={handleJoinCall}
                  onLeave={handleLeaveCall}
                  callType={activeCall.callType}
                />
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <MessageList 
                  channelId={selectedChannelId}
                  searchQuery={searchQuery}
                  activeCall={activeCall}
                  isInCall={isInCall}
                  onJoinCall={handleJoinCall}
                  onLeaveCall={handleLeaveCall}
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
          {isInCall ? (
            <button
              onClick={handleLeaveCall}
              className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
            >
              Leave
            </button>
          ) : (
            <button
              onClick={handleJoinCall}
              className="ml-2 px-2 py-1 bg-green-700 hover:bg-green-800 rounded text-xs transition-colors"
            >
              Join
            </button>
          )}
        </div>
      )}

      {/* Call Created Notification */}
      {selectedChannelId && (
        <CallCreatedNotification
          channelId={selectedChannelId}
          onJoinCall={handleJoinCall}
        />
      )}

      {/* Video Call Widget */}
      {showVideoWidget && activeCall && (
        <VideoCallWidget
          callId={activeCall.callId}
          channelId={selectedChannelId!}
          channelName={selectedChannel?.name || ""}
          isOpen={showVideoWidget}
          onClose={() => setShowVideoWidget(false)}
          onJoin={() => {
            setIsInCall(true);
            setCurrentCallId(activeCall.callId);
          }}
          onLeave={() => {
            setIsInCall(false);
            setCurrentCallId(null);
            setShowVideoWidget(false);
          }}
        />
      )}
    </div>
  );
}
