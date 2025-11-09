import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Chat from './pages/Chat';
import './styles/global.css';

function App() {
  return (
    <Router>
      <SocketProvider>
        <ChatProvider>
          <div className="app">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/chat" element={<Chat />} />
            </Routes>
          </div>
        </ChatProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;