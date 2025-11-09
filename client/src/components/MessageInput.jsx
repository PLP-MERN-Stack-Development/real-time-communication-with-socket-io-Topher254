import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Send } from 'lucide-react';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, startTyping, stopTyping, currentRoom } = useChat();
  const typingTimeoutRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentRoom) return;

    sendMessage(message);
    setMessage('');
    handleStopTyping();
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${currentRoom?.name || 'room'}...`}
            className="message-input"
            disabled={!currentRoom}
          />
          <button 
            type="submit" 
            disabled={!message.trim() || !currentRoom}
            className="send-button"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;