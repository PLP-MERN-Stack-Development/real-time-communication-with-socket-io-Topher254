import { v4 as uuidv4 } from 'uuid';

// In-memory storage (replace with database in production)
const users = new Map();
const rooms = new Map();
const messages = new Map();

// Initialize default rooms
rooms.set('general', {
  id: 'general',
  name: 'General',
  description: 'General chat room',
  createdAt: new Date(),
  users: new Set()
});

rooms.set('random', {
  id: 'random',
  name: 'Random',
  description: 'Random discussions',
  createdAt: new Date(),
  users: new Set()
});

export function initializeSocket(io) {
  // SIMPLIFIED AUTHENTICATION - No token validation
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (token) {
        // Try to parse the token as JSON (from client)
        const userData = JSON.parse(token);
        socket.userId = userData.userId || `user_${Date.now()}`;
        socket.username = userData.username || `User${Math.floor(Math.random() * 1000)}`;
      } else {
        // Generate anonymous user
        socket.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        socket.username = `Anonymous${Math.floor(Math.random() * 1000)}`;
      }
      
      console.log(`🔐 User authenticated: ${socket.username} (${socket.userId})`);
      next();
    } catch (error) {
      // Fallback to anonymous user on any error
      console.log('Auth fallback to anonymous:', error.message);
      socket.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      socket.username = `Anonymous${Math.floor(Math.random() * 1000)}`;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.username} (${socket.id})`);

    // Add user to users map
    users.set(socket.userId, {
      id: socket.userId,
      username: socket.username,
      socketId: socket.id,
      connected: true,
      lastSeen: new Date(),
      currentRoom: null
    });

    // Send current users and rooms to the connected client
    socket.emit('users_list', Array.from(users.values()).filter(user => user.connected));
    socket.emit('rooms_list', Array.from(rooms.values()));

    // Notify other users about new connection
    socket.broadcast.emit('user_connected', {
      id: socket.userId,
      username: socket.username,
      connected: true
    });

    // Join default room
    socket.join('general');
    const generalRoom = rooms.get('general');
    generalRoom.users.add(socket.userId);
    socket.currentRoom = 'general';

    // Initialize messages array for room if not exists
    if (!messages.has('general')) {
      messages.set('general', []);
    }

    socket.emit('room_joined', {
      room: generalRoom,
      messages: messages.get('general') || []
    });

    // Handle joining a room
    socket.on('join_room', (roomId) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Leave current room
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        const currentRoom = rooms.get(socket.currentRoom);
        if (currentRoom) {
          currentRoom.users.delete(socket.userId);
        }
      }

      // Join new room
      socket.join(roomId);
      socket.currentRoom = roomId;
      room.users.add(socket.userId);

      // Initialize messages array for room if not exists
      if (!messages.has(roomId)) {
        messages.set(roomId, []);
      }

      socket.emit('room_joined', {
        room,
        messages: messages.get(roomId)
      });

      socket.to(roomId).emit('user_joined_room', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { roomId, content, type = 'text' } = data;
      
      if (!rooms.has(roomId)) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const message = {
        id: uuidv4(),
        roomId,
        userId: socket.userId,
        username: socket.username,
        content,
        type,
        timestamp: new Date(),
        reactions: new Map(),
        readBy: new Set([socket.userId])
      };

      // Store message
      if (!messages.has(roomId)) {
        messages.set(roomId, []);
      }
      messages.get(roomId).push(message);

      // Emit to room
      io.to(roomId).emit('new_message', message);

      // Send notification to users in room except sender
      socket.to(roomId).emit('notification', {
        type: 'new_message',
        roomId,
        message: `${socket.username} sent a message`,
        from: socket.username
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (roomId) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });
    });

    socket.on('typing_stop', (roomId) => {
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId,
        roomId
      });
    });

    // Handle message reactions
    socket.on('react_to_message', (data) => {
      const { messageId, roomId, reaction } = data;
      const roomMessages = messages.get(roomId);
      
      if (roomMessages) {
        const message = roomMessages.find(msg => msg.id === messageId);
        if (message) {
          if (!message.reactions) message.reactions = new Map();
          message.reactions.set(socket.userId, reaction);
          
          io.to(roomId).emit('message_reacted', {
            messageId,
            roomId,
            userId: socket.userId,
            username: socket.username,
            reaction
          });
        }
      }
    });

    // Handle read receipts
    socket.on('mark_message_read', (data) => {
      const { messageId, roomId } = data;
      const roomMessages = messages.get(roomId);
      
      if (roomMessages) {
        const message = roomMessages.find(msg => msg.id === messageId);
        if (message) {
          message.readBy.add(socket.userId);
          
          socket.to(roomId).emit('message_read', {
            messageId,
            roomId,
            userId: socket.userId,
            username: socket.username
          });
        }
      }
    });

    // Handle private messages
    socket.on('send_private_message', (data) => {
      const { toUserId, content } = data;
      const targetUser = users.get(toUserId);
      
      if (targetUser && targetUser.connected) {
        const privateMessage = {
          id: uuidv4(),
          fromUserId: socket.userId,
          fromUsername: socket.username,
          toUserId,
          content,
          timestamp: new Date(),
          type: 'private'
        };

        io.to(targetUser.socketId).emit('private_message', privateMessage);
        socket.emit('private_message_sent', privateMessage);
      } else {
        socket.emit('error', { message: 'User not available' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔴 User disconnected: ${socket.username} (${socket.id}) - ${reason}`);

      const user = users.get(socket.userId);
      if (user) {
        user.connected = false;
        user.lastSeen = new Date();
        user.socketId = null;

        // Remove from rooms
        rooms.forEach(room => {
          room.users.delete(socket.userId);
        });

        // Notify other users
        socket.broadcast.emit('user_disconnected', {
          id: socket.userId,
          username: socket.username,
          connected: false,
          lastSeen: user.lastSeen
        });
      }
    });

    // Handle reconnection events
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber} for ${socket.username}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected successfully on attempt ${attemptNumber}`);
      
      const user = users.get(socket.userId);
      if (user) {
        user.connected = true;
        user.socketId = socket.id;
        
        socket.broadcast.emit('user_reconnected', {
          id: socket.userId,
          username: socket.username,
          connected: true
        });
      }
    });
  });

  return io;
}