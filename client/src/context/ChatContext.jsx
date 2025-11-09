import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

// Initial state
const initialState = {
  user: null,
  users: [],
  rooms: [],
  currentRoom: null,
  messages: [],
  typingUsers: [],
  notifications: [],
  unreadCount: 0
};

// Reducer function
function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload, messages: [] };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload],
        unreadCount: state.unreadCount + 1
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    
    case 'USER_TYPING':
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter(u => u.userId !== action.payload.userId), action.payload]
      };
    
    case 'USER_STOP_TYPING':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u.userId !== action.payload.userId)
      };
    
    case 'USER_CONNECTED':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id ? { ...user, connected: true } : user
        ).filter(user => user.id !== action.payload.id || !state.users.find(u => u.id === action.payload.id))
        .concat(action.payload)
      };
    
    case 'USER_DISCONNECTED':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.payload.id ? { ...user, connected: false, lastSeen: action.payload.lastSeen } : user
        )
      };
    
    default:
      return state;
  }
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('users_list', (users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });

    socket.on('rooms_list', (rooms) => {
      dispatch({ type: 'SET_ROOMS', payload: rooms });
    });

    socket.on('room_joined', (data) => {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: data.room });
      dispatch({ type: 'SET_MESSAGES', payload: data.messages });
    });

    socket.on('new_message', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('user_connected', (user) => {
      dispatch({ type: 'USER_CONNECTED', payload: user });
    });

    socket.on('user_disconnected', (user) => {
      dispatch({ type: 'USER_DISCONNECTED', payload: user });
    });

    socket.on('user_typing', (data) => {
      dispatch({ type: 'USER_TYPING', payload: data });
    });

    socket.on('user_stop_typing', (data) => {
      dispatch({ type: 'USER_STOP_TYPING', payload: data });
    });

    socket.on('notification', (notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.message, {
          icon: '/vite.svg',
          badge: '/vite.svg'
        });
      }
    });

    return () => {
      socket.off('users_list');
      socket.off('rooms_list');
      socket.off('room_joined');
      socket.off('new_message');
      socket.off('user_connected');
      socket.off('user_disconnected');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('notification');
    };
  }, [socket]);

  const actions = {
    joinRoom: (roomId) => {
      socket.emit('join_room', roomId);
    },
setUser: (user) => {
  dispatch({ type: 'SET_USER', payload: user });
},
    sendMessage: (content, roomId = state.currentRoom?.id) => {
      if (!roomId || !content.trim()) return;
      
      socket.emit('send_message', {
        roomId,
        content: content.trim(),
        type: 'text'
      });
    },
    
    startTyping: (roomId = state.currentRoom?.id) => {
      if (roomId) {
        socket.emit('typing_start', roomId);
      }
    },
    
    stopTyping: (roomId = state.currentRoom?.id) => {
      if (roomId) {
        socket.emit('typing_stop', roomId);
      }
    },
    
    reactToMessage: (messageId, reaction) => {
      socket.emit('react_to_message', {
        messageId,
        roomId: state.currentRoom?.id,
        reaction
      });
    },
    
    markMessageRead: (messageId) => {
      socket.emit('mark_message_read', {
        messageId,
        roomId: state.currentRoom?.id
      });
    },
    
    sendPrivateMessage: (toUserId, content) => {
      socket.emit('send_private_message', {
        toUserId,
        content
      });
    },
    
    clearNotifications: () => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};