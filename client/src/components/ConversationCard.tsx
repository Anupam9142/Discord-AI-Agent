import React from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ConversationCardProps {
  username: string;
  userAvatar?: string;
  messages: Message[];
  timeAgo: string;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  username,
  userAvatar,
  messages,
  timeAgo
}) => {
  if (messages.length === 0) return null;

  const userMessages = messages.filter(msg => msg.role === 'user');
  const botMessages = messages.filter(msg => msg.role === 'assistant');
  
  // Only show the most recent exchange (user message followed by bot response)
  const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  const latestBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1] : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {latestUserMessage && (
        <div className="flex items-start">
          <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={`${username}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{username.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{username}</p>
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{latestUserMessage.content}</p>
          </div>
        </div>
      )}
      
      {latestBotMessage && (
        <div className="mt-3 flex items-start">
          <div className="w-8 h-8 bg-discord-blurple rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AI</span>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-discord-success font-medium">AI Bot</p>
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
            <div className="text-sm text-gray-300 mt-1">
              <p>{latestBotMessage.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationCard;
