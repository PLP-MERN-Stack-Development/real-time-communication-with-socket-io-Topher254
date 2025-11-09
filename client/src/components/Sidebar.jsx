import React from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { Users, MessageCircle, LogOut } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { users, rooms, currentRoom, joinRoom, unreadCount } = useChat();
  const { disconnect } = useSocket();

  const handleLogout = () => {
    disconnect();
    window.location.href = '/';
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Chat Rooms</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <MessageCircle size={18} />
            <span>Rooms</span>
          </div>
          <div className="rooms-list">
            {rooms.map(room => (
              <button
                key={room.id}
                className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => {
                  joinRoom(room.id);
                  onClose();
                }}
              >
                <div className="room-info">
                  <strong>{room.name}</strong>
                  <span>{room.description}</span>
                </div>
                <div className="room-users">
                  {room.users?.size || 0}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <Users size={18} />
            <span>Online Users ({users.filter(u => u.connected).length})</span>
          </div>
          <div className="users-list">
            {users.filter(user => user.connected).map(user => (
              <div key={user.id} className="user-item">
                <div className="user-status">
                  <div className="status-dot connected"></div>
                  <span>{user.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;