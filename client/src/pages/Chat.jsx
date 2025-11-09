import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import './Chat.css';

const Chat = () => {
  const { currentRoom, messages, typingUsers, notifications, unreadCount, clearNotifications } = useChat();
  const { isConnected, disconnect } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (notifications.length > 0 && currentRoom) {
      clearNotifications();
    }
  }, [currentRoom, notifications.length]);

  if (!currentRoom) {
    return (
      <div className="chat-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="chat-main">
          <div className="chat-header">
            <button 
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h2>Select a room to start chatting</h2>
          </div>
          <div className="chat-messages">
            <div className="empty-messages">
              <p>Please select a chat room from the sidebar to start messaging.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="chat-main">
        <div className="chat-header">
          <button 
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          
          <div className="room-info">
            <h2>{currentRoom.name}</h2>
            <p>{currentRoom.description}</p>
          </div>

          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="chat-messages">
          <MessageList messages={messages} />
          <TypingIndicator typingUsers={typingUsers} />
          <div ref={messagesEndRef} />
        </div>

        <MessageInput />
      </div>
    </div>
  );
};

export default Chat;