import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001', {
      autoConnect: false,
      auth: {
        token: localStorage.getItem('chat-token')
      }
    });

    setSocket(newSocket);

    function onConnect() {
      setIsConnected(true);
      setTransport(newSocket.io.engine.transport.name);
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    function onConnectError(error) {
      console.error('Connection error:', error);
    }

    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("connect_error", onConnectError);

    // Connect socket if we have a token
    if (localStorage.getItem('chat-token')) {
      newSocket.connect();
    }

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    transport,
    connect: (token) => {
      if (token) {
        localStorage.setItem('chat-token', token);
        socket.auth.token = token;
      }
      socket.connect();
    },
    disconnect: () => {
      localStorage.removeItem('chat-token');
      socket.disconnect();
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};