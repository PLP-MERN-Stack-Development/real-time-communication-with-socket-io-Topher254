import express from 'express';

const router = express.Router();

export function setupRoutes(app) {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Socket.io Chat Server'
    });
  });

  // Get server statistics
  app.get('/api/stats', (req, res) => {
    // This would typically come from your socket handler
    res.json({
      connectedUsers: 0, // This should be dynamically calculated
      activeRooms: 0,
      totalMessages: 0,
      uptime: process.uptime()
    });
  });
}