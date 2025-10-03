import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MessageListProps {
  channelId: Id<"channels">;
  searchQuery: string;
}

export function MessageList({ channelId, searchQuery }: MessageListProps) {
  const messages = useQuery(api.messages.list, { channelId }) || [];
  const searchResults = useQuery(
    api.messages.search, 
    searchQuery.trim() ? { query: searchQuery, channelId } : "skip"
  ) || [];
  const currentUser = useQuery(api.auth.loggedInUser);
  const unreadCount = useQuery(api.readReceipts.getUnreadCount, { channelId }) || 0;

  const displayMessages = searchQuery.trim() ? searchResults : messages;

  if (displayMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>
          {searchQuery.trim() 
            ? "No messages found matching your search" 
            : "No messages yet. Start the conversation!"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {displayMessages.map((message, index) => {
        const isCurrentUser = currentUser?._id === message.authorId;
        const isUnread = !searchQuery.trim() && unreadCount > 0 && index >= displayMessages.length - unreadCount;
        const showNewMessagesDivider = !searchQuery.trim() && unreadCount > 0 && index === displayMessages.length - unreadCount;
        
        return (
          <div key={message._id}>
            {showNewMessagesDivider && (
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-red-400"></div>
                <span className="text-sm text-red-500 font-medium bg-white px-3">New Messages</span>
                <div className="flex-1 h-px bg-red-400"></div>
              </div>
            )}
            <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} ${isUnread ? 'opacity-90' : ''}`}>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {message.author.avatarUrl ? (
                <img 
                  src={message.author.avatarUrl} 
                  alt={message.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {message.author.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 min-w-0 max-w-xs sm:max-w-md ${isCurrentUser ? 'text-right' : ''}`}>
              <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium text-gray-900 text-sm">
                  {isCurrentUser ? 'You' : message.author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message._creationTime).toLocaleTimeString()}
                </span>
                {searchQuery.trim() && 'channelName' in message && (
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                    #{(message as any).channelName}
                  </span>
                )}
              </div>
              <div className={`inline-block p-3 rounded-lg break-words max-w-full ${
                isCurrentUser 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {message.content}
              </div>
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
