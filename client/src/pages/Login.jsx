import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { MessageCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { connect } = useSocket();
  const { setUser } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);

    // Simple user data - no complex token
    const userData = {
      userId: `user_${Date.now()}`,
      username: username.trim()
    };
    
    // Use plain JSON string as token (no base64)
    const token = JSON.stringify(userData);

    // Set user in context
    setUser(userData);

    // Connect socket with token
    connect(token);

    // Navigate to chat
    setTimeout(() => {
      navigate('/chat');
    }, 500);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  React.useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <MessageCircle size={48} className="logo" />
          <h1> Chat Here</h1>
          <p>Join the conversation in real-time</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Choose a username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              maxLength={20}
              required
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={!username.trim() || isLoading}
            className="login-button"
          >
            {isLoading ? 'Connecting...' : 'Join Chat'}
          </button>
        </form>

        <div className="login-features">
          <div className="feature">
            <strong>Real-time messaging</strong>
            <span>Instant message delivery</span>
          </div>
          <div className="feature">
            <strong>Multiple rooms</strong>
            <span>Join different chat rooms</span>
          </div>
          <div className="feature">
            <strong>Typing indicators</strong>
            <span>See when others are typing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;