# Campus Connect Portal

A comprehensive MERN stack College Management System designed for students, faculty, and administration to streamline communication, academic management, and resource sharing.

## Features

✅ **Secure Authentication**
- JWT-based student/teacher/admin login and signup
- Role-based access control

✅ **Class Schedule & Subject Management**
- Teachers/admins can create and manage subjects
- Create class schedules with day, time, room information
- Students can view complete weekly schedule
- Real-time schedule update notifications

✅ **Notice Board**
- Role-based notice creation (teacher/admin only)
- All users can view important announcements
- Real-time notifications for new notices

✅ **File Upload/Download**
- Upload assignments, notes, and resources
- Static file serving for downloads
- Real-time upload notifications

✅ **Chat/Forum**
- Real-time messaging using Socket.IO
- Room-based communication
- Message history persistence
- Role badges (student/teacher/admin)

✅ **Real-time Notifications**
- Live updates via Socket.IO for:
  - New notices
  - File uploads
  - Schedule changes
  - Chat messages
- Centralized notification feed on dashboard

✅ **Beautiful UI**
- Material-UI components
- Responsive design
- Role-aware interface

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO for real-time features
- JWT authentication
- Multer for file uploads

**Frontend:**
- React 18
- Material-UI (MUI)
- React Router
- Axios
- Socket.IO client

## Setup

### Backend

```powershell
cd backend
npm install
```

**MongoDB Atlas Configuration:**
- ✅ Already configured in `.env` file
- ⚠️ **Action Required:** Whitelist your IP in MongoDB Atlas
  - Go to https://cloud.mongodb.com/ → Network Access
  - Add your current IP or `0.0.0.0/0` for all IPs
  - See **MONGODB_ATLAS_SETUP.md** for detailed instructions

Start backend:
```powershell
npm run dev
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL (usually http://localhost:5173)

## Quick Test

1. **Signup**: Create an account (default role = student)

2. **Explore as Student**:
   - View dashboard with live notifications
   - Check class schedule
   - Browse subjects
   - Read notices
   - Join chat/forum
   - Upload/download resources

3. **Test as Teacher/Admin**:
   - To create subjects, schedules, and notices you need teacher/admin role
   - Update role in MongoDB:
     ```javascript
     // In MongoDB Compass or mongo shell:
     db.users.updateOne(
       { email: "your@email.com" },
       { $set: { role: "teacher" } }
     )
     ```
   - Re-login to see teacher/admin features

4. **Test Real-time Features**:
   - Open multiple browser windows/tabs
   - Create a notice as teacher → see notification on all dashboards
   - Send a chat message → appears instantly for all users
   - Upload a file → all users notified
   - Update schedule → notification broadcast

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

### Subjects
- `GET /api/subjects` - List all subjects (authenticated)
- `POST /api/subjects` - Create subject (teacher/admin)
- `PUT /api/subjects/:id` - Update subject (teacher/admin)
- `DELETE /api/subjects/:id` - Delete subject (admin)

### Schedules
- `GET /api/schedules` - List all schedules (authenticated)
- `POST /api/schedules` - Create schedule (teacher/admin)
- `PUT /api/schedules/:id` - Update schedule (teacher/admin)
- `DELETE /api/schedules/:id` - Delete schedule (admin)

### Notices
- `GET /api/notices` - List all notices (authenticated)
- `POST /api/notices` - Create notice (teacher/admin)

### Messages (Chat)
- `GET /api/messages?room=general` - Get messages for room (authenticated)
- `POST /api/messages` - Send message (authenticated)

### File Upload
- `POST /api/upload` - Upload file (authenticated)
- `GET /uploads/:filename` - Download file (static)

## Socket.IO Events

**Client → Server:**
- `join` - Join a room
- `leave` - Leave a room

**Server → Client:**
- `new_notice` - New notice created
- `file_uploaded` - File uploaded
- `schedule_updated` - Schedule changed
- `new_message` - New chat message

## Project Structure

```
Campus hub/
├── backend/
│   ├── models/
│   │   ├── User.js (authentication & roles)
│   │   ├── Notice.js
│   │   ├── Subject.js
│   │   ├── Schedule.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── notice.js
│   │   ├── subject.js
│   │   ├── schedule.js
│   │   ├── message.js
│   │   └── upload.js
│   ├── middleware/
│   │   └── auth.js (JWT + role-based guards)
│   ├── uploads/ (file storage)
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx (notification feed)
│   │   │   ├── Schedule.jsx (weekly timetable)
│   │   │   ├── Subjects.jsx (manage subjects)
│   │   │   ├── Notices.jsx
│   │   │   ├── Chat.jsx (real-time messaging)
│   │   │   └── Uploads.jsx
│   │   ├── components/
│   │   │   └── Header.jsx
│   │   ├── App.jsx (routing + Socket.IO)
│   │   ├── api.js (axios + JWT)
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── README.md
└── .gitignore
```

## Notes

- **MongoDB Atlas**: Cloud database already configured. Just whitelist your IP address (see MONGODB_ATLAS_SETUP.md).
- **Seed Database**: Run `npm run seed` in backend folder to create admin and teacher accounts for testing.
- **Complete Feature List**: See [FEATURES.md](FEATURES.md) for comprehensive documentation of all implemented features.
- **Security**: This is a development version. For production, add input validation, rate limiting, HTTPS, and additional security measures.

## Default Test Accounts (after running seed)

```
Admin:   admin@campus.edu / admin123
Teacher: teacher@campus.edu / teacher123
Student: Create via signup form
```
