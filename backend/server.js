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

// Connect to MongoDB
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';
mongoose.connect(MONGO)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error', err));

// attach io to request so routes can emit
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notices', require('./routes/notice'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/subjects', require('./routes/subject'));
app.use('/api/schedules', require('./routes/schedule'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/admin', require('./routes/admin'));

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
