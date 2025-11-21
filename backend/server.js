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

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
