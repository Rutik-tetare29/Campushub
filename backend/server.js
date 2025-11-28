const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// attach io to request so routes can emit
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Routes - Register BEFORE connecting to MongoDB
console.log('📍 Registering routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notices', require('./routes/notice'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/subjects', require('./routes/subject'));
app.use('/api/schedules', require('./routes/schedule'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

// New Advanced Features Routes
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/chatrooms', require('./routes/chatrooms'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/bulk', require('./routes/bulk'));
app.use('/api/search', require('./routes/search'));
app.use('/api/avatar', require('./routes/avatar'));
console.log('✅ All routes registered');

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';
console.log('🔌 Connecting to MongoDB...');
mongoose.connect(MONGO)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Setup WebRTC signaling for video conferencing
const setupVideoConference = require('./webrtc/signaling');
const videoConference = setupVideoConference(io);

// Make io instance available globally for notifications
global.io = io;

// Store chat room users and active streams
const chatRoomUsers = {}; // { roomId: [{ userId, userName, socketId }] }
const activeStreams = {}; // { roomId: { hostId, hostName, hostSocketId, viewers: [] } }

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  
  socket.on('join', room => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('leave', room => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  // ============ CHAT ROOM EVENTS ============
  socket.on('join-chat-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    
    if (!chatRoomUsers[roomId]) {
      chatRoomUsers[roomId] = [];
    }
    
    const existingUser = chatRoomUsers[roomId].find(u => u.userId === userId);
    if (!existingUser) {
      chatRoomUsers[roomId].push({ userId, userName, socketId: socket.id });
    } else {
      existingUser.socketId = socket.id;
    }
    
    // Send online users list to everyone in room
    io.to(roomId).emit('room-users', chatRoomUsers[roomId]);
    
    // Notify others
    socket.to(roomId).emit('user-joined-room', { userId, userName });
    
    // If there's an active stream, notify the new user
    if (activeStreams[roomId]) {
      socket.emit('stream-started', activeStreams[roomId]);
    }
    
    console.log(`User ${userName} joined chat room ${roomId}`);
  });

  socket.on('leave-chat-room', ({ roomId, userId }) => {
    socket.leave(roomId);
    
    if (chatRoomUsers[roomId]) {
      const user = chatRoomUsers[roomId].find(u => u.userId === userId);
      chatRoomUsers[roomId] = chatRoomUsers[roomId].filter(u => u.userId !== userId);
      
      // Update online users
      io.to(roomId).emit('room-users', chatRoomUsers[roomId]);
      
      // Notify others
      socket.to(roomId).emit('user-left-room', { userId, userName: user?.userName });
    }
  });

  // ============ LIVE STREAMING EVENTS ============
  socket.on('start-stream', ({ roomId, userId, userName, streamTitle }) => {
    activeStreams[roomId] = {
      hostId: userId,
      hostName: userName,
      hostSocketId: socket.id,
      streamTitle: streamTitle || `${userName}'s Stream`,
      viewers: [],
      startedAt: new Date()
    };
    
    // Notify all users in the room
    io.to(roomId).emit('stream-started', {
      userId,
      userName,
      hostSocketId: socket.id,
      streamTitle: streamTitle || `${userName}'s Stream`
    });
    
    console.log(`Stream started in room ${roomId} by ${userName} (socket: ${socket.id})`);
  });

  socket.on('end-stream', ({ roomId, userId }) => {
    if (activeStreams[roomId] && activeStreams[roomId].hostId === userId) {
      // Notify all viewers
      io.to(roomId).emit('stream-ended', { userId });
      
      delete activeStreams[roomId];
      console.log(`Stream ended in room ${roomId}`);
    }
  });

  socket.on('join-stream', ({ roomId, userId, userName }) => {
    if (activeStreams[roomId]) {
      const viewer = { userId, userName, socketId: socket.id };
      activeStreams[roomId].viewers.push(viewer);
      
      // Notify host about new viewer
      io.to(activeStreams[roomId].hostSocketId).emit('viewer-joined', viewer);
      
      // Notify all users about viewer count
      io.to(roomId).emit('viewer-count', activeStreams[roomId].viewers.length);
      
      console.log(`${userName} joined stream in room ${roomId}`);
    }
  });

  socket.on('leave-stream', ({ roomId, userId }) => {
    if (activeStreams[roomId]) {
      const viewer = activeStreams[roomId].viewers.find(v => v.userId === userId);
      activeStreams[roomId].viewers = activeStreams[roomId].viewers.filter(v => v.userId !== userId);
      
      // Notify host
      if (viewer) {
        io.to(activeStreams[roomId].hostSocketId).emit('viewer-left', viewer);
      }
      
      // Update viewer count
      io.to(roomId).emit('viewer-count', activeStreams[roomId].viewers.length);
    }
  });

  socket.on('stream-signal', ({ to, signal, type, roomId, fromUserId, userName }) => {
    console.log(`Stream signal: ${type} from ${fromUserId || socket.id} to ${to}`);
    
    // Determine the sender's identifier for the recipient
    let senderIdentifier;
    if (type === 'viewer-offer') {
      // Viewer sending to host - use viewer's socket ID so host can reply
      senderIdentifier = socket.id;
    } else if (type === 'host-answer') {
      // Host sending to viewer - use the 'to' which is already the viewer's socket
      senderIdentifier = fromUserId || socket.id;
    }
    
    io.to(to).emit('stream-signal', {
      from: senderIdentifier,
      signal,
      type,
      userName
    });
  });

  socket.on('stream-reaction', ({ roomId, userId, userName, emoji }) => {
    io.to(roomId).emit('stream-reaction', {
      userId,
      userName,
      emoji,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
    
    // Clean up chat rooms
    Object.keys(chatRoomUsers).forEach(roomId => {
      if (chatRoomUsers[roomId]) {
        const user = chatRoomUsers[roomId].find(u => u.socketId === socket.id);
        if (user) {
          chatRoomUsers[roomId] = chatRoomUsers[roomId].filter(u => u.socketId !== socket.id);
          io.to(roomId).emit('room-users', chatRoomUsers[roomId]);
          socket.to(roomId).emit('user-left-room', { userId: user.userId, userName: user.userName });
        }
      }
    });
    
    // Clean up active streams
    Object.keys(activeStreams).forEach(roomId => {
      const stream = activeStreams[roomId];
      
      // If host disconnected
      if (stream.hostSocketId === socket.id) {
        io.to(roomId).emit('stream-ended', { userId: stream.hostId });
        delete activeStreams[roomId];
      }
      
      // If viewer disconnected
      const viewer = stream.viewers?.find(v => v.socketId === socket.id);
      if (viewer) {
        stream.viewers = stream.viewers.filter(v => v.socketId !== socket.id);
        io.to(stream.hostSocketId).emit('viewer-left', viewer);
        io.to(roomId).emit('viewer-count', stream.viewers.length);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
