/**
 * WebRTC Signaling Server for Video Conferencing
 * Handles peer-to-peer connection establishment
 */

const setupVideoConference = (io) => {
  // Store active rooms and participants
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('New WebRTC connection:', socket.id);

    /**
     * Join a video conference room
     */
    socket.on('join-room', ({ roomId, userId, userName }) => {
      console.log(`User ${userName} (${userId}) joining room ${roomId}`);

      socket.join(roomId);

      // Initialize room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId);
      
      // Add user to room
      room.set(userId, {
        socketId: socket.id,
        userName,
        audioEnabled: true,
        videoEnabled: true
      });

      // Notify existing users about new participant
      socket.to(roomId).emit('user-connected', {
        userId,
        userName,
        socketId: socket.id
      });

      // Send list of existing participants to new user
      const participants = Array.from(room.entries())
        .filter(([id]) => id !== userId)
        .map(([id, data]) => ({
          userId: id,
          userName: data.userName,
          socketId: data.socketId,
          audioEnabled: data.audioEnabled,
          videoEnabled: data.videoEnabled
        }));

      socket.emit('room-participants', participants);

      // Emit updated participant count
      io.to(roomId).emit('participant-count', room.size);
    });

    /**
     * Handle WebRTC signaling (offer, answer, ice-candidate)
     */
    socket.on('signal', ({ to, signal, type }) => {
      console.log(`Signaling ${type} from ${socket.id} to ${to}`);
      io.to(to).emit('signal', {
        from: socket.id,
        signal,
        type
      });
    });

    /**
     * Handle ICE candidate exchange
     */
    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    /**
     * Toggle audio/video status
     */
    socket.on('toggle-media', ({ roomId, userId, type, enabled }) => {
      const room = rooms.get(roomId);
      if (room && room.has(userId)) {
        const user = room.get(userId);
        if (type === 'audio') {
          user.audioEnabled = enabled;
        } else if (type === 'video') {
          user.videoEnabled = enabled;
        }

        // Notify other participants
        socket.to(roomId).emit('participant-media-toggle', {
          userId,
          type,
          enabled
        });
      }
    });

    /**
     * Share screen
     */
    socket.on('start-screen-share', ({ roomId, userId }) => {
      console.log(`User ${userId} started screen sharing in room ${roomId}`);
      socket.to(roomId).emit('screen-share-started', {
        userId,
        socketId: socket.id
      });
    });

    socket.on('stop-screen-share', ({ roomId, userId }) => {
      console.log(`User ${userId} stopped screen sharing in room ${roomId}`);
      socket.to(roomId).emit('screen-share-stopped', {
        userId
      });
    });

    /**
     * Chat messages in video room
     */
    socket.on('video-chat-message', ({ roomId, userId, userName, message }) => {
      io.to(roomId).emit('video-chat-message', {
        userId,
        userName,
        message,
        timestamp: new Date()
      });
    });

    /**
     * Leave room
     */
    socket.on('leave-room', ({ roomId, userId }) => {
      handleUserLeave(socket, roomId, userId);
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log('WebRTC disconnect:', socket.id);

      // Find and remove user from all rooms
      rooms.forEach((room, roomId) => {
        room.forEach((data, userId) => {
          if (data.socketId === socket.id) {
            handleUserLeave(socket, roomId, userId);
          }
        });
      });
    });
  });

  /**
   * Helper function to handle user leaving room
   */
  function handleUserLeave(socket, roomId, userId) {
    const room = rooms.get(roomId);
    
    if (room) {
      room.delete(userId);
      
      // Notify others in room
      socket.to(roomId).emit('user-disconnected', userId);
      
      // Update participant count
      io.to(roomId).emit('participant-count', room.size);
      
      // Delete room if empty
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }

    socket.leave(roomId);
  }

  return {
    getRooms: () => rooms,
    getRoomParticipants: (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return [];
      return Array.from(room.entries()).map(([userId, data]) => ({
        userId,
        userName: data.userName,
        audioEnabled: data.audioEnabled,
        videoEnabled: data.videoEnabled
      }));
    }
  };
};

module.exports = setupVideoConference;
