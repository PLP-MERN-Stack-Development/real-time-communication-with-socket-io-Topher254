import React from 'react';
import { useChat } from '../context/ChatContext';

const MessageList = ({ messages }) => {
  const { user } = useChat();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (messages.length === 0) {
    return (
      <div className="empty-messages">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.userId === user?.id ? 'own-message' : 'other-message'}`}
        >
          <div className="message-header">
            <span className="message-sender">{message.username}</span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
          <div className="message-content">
            {message.content}
          </div>
          {message.reactions && message.reactions.size > 0 && (
            <div className="message-reactions">
              {Array.from(message.reactions.entries()).map(([userId, reaction]) => (
                <span key={userId} className="reaction">{reaction}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;