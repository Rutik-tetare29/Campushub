# Campus Connect Portal - System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│                        Port: 5173 (Development)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │   Login     │  │   Signup    │  │  Dashboard  │  │  Header  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  Schedule   │  │  Subjects   │  │   Notices   │  │   Chat   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Uploads   │  │   API.js    │  │   App.jsx   │                 │
│  │             │  │  (Axios)    │  │ (Socket.IO) │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                          │                  │                         │
└──────────────────────────┼──────────────────┼─────────────────────────┘
                           │                  │
                    HTTP + JWT          WebSocket
                           │                  │
┌──────────────────────────┼──────────────────┼─────────────────────────┐
│                          ▼                  ▼                         │
│                BACKEND (Node.js + Express + Socket.IO)               │
│                        Port: 5000                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Middleware:                                                          │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   CORS    │→ │ JSON Parse │→ │ Static Files │→ │  Socket.IO   ││
│  └───────────┘  └────────────┘  └──────────────┘  └──────────────┘│
│                                                                       │
│  Auth Middleware:                                                     │
│  ┌────────────────────┐  ┌───────────────────────────────┐         │
│  │  auth()            │  │  permit('teacher', 'admin')    │         │
│  │  - Verify JWT      │  │  - Role-based access control   │         │
│  │  - Attach user     │  │  - 403 if unauthorized         │         │
│  └────────────────────┘  └───────────────────────────────┘         │
│                                                                       │
│  Routes:                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  /api/auth       │  │  /api/subjects   │  │  /api/schedules  │ │
│  │  - register      │  │  - CRUD subjects │  │  - CRUD schedule │ │
│  │  - login         │  │  (teacher/admin) │  │  (teacher/admin) │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  /api/notices    │  │  /api/messages   │  │  /api/upload     │ │
│  │  - Post notice   │  │  - Send message  │  │  - Upload file   │ │
│  │  - List notices  │  │  - Get messages  │  │  (multer)        │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
│  Socket.IO Events:                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Server → Client:                  Client → Server:          │  │
│  │  • new_notice                      • join (room)             │  │
│  │  • file_uploaded                   • leave (room)            │  │
│  │  • schedule_updated                                          │  │
│  │  • new_message                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                            │
└──────────────────────────┼────────────────────────────────────────────┘
                           │
                     Mongoose ODM
                           │
┌──────────────────────────▼────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                                 │
│                    Port: 27017 (Default)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Collections:                                                         │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │     users       │  │    subjects     │  │   schedules     │    │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤    │
│  │ _id             │  │ _id             │  │ _id             │    │
│  │ name            │  │ name            │  │ subject (ref)   │    │
│  │ email (unique)  │  │ code (unique)   │  │ dayOfWeek       │    │
│  │ password (hash) │  │ description     │  │ startTime       │    │
│  │ role            │  │ teacher (ref)   │  │ endTime         │    │
│  │ - student       │  │ credits         │  │ room            │    │
│  │ - teacher       │  │ timestamps      │  │ semester        │    │
│  │ - admin         │  └─────────────────┘  │ timestamps      │    │
│  │ timestamps      │                        └─────────────────┘    │
│  └─────────────────┘                                                 │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │    notices      │  │    messages     │                          │
│  ├─────────────────┤  ├─────────────────┤                          │
│  │ _id             │  │ _id             │                          │
│  │ title           │  │ sender (ref)    │                          │
│  │ content         │  │ content         │                          │
│  │ attachments []  │  │ room            │                          │
│  │ createdBy (ref) │  │ attachments []  │                          │
│  │ timestamps      │  │ timestamps      │                          │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                        FILE STORAGE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  backend/uploads/                                                     │
│  ├── 1731513600000-123456789.pdf                                    │
│  ├── 1731513700000-987654321.jpg                                    │
│  └── [timestamp-random].[ext]                                        │
│                                                                       │
│  Served via: GET /uploads/:filename (static)                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. User Registration/Login                                           │
│     Frontend → POST /api/auth/register or /login                     │
│     {email, password, name, role}                                     │
│                                                                       │
│  2. Backend Validates & Creates JWT                                   │
│     - Hash password with bcrypt                                       │
│     - Save to MongoDB                                                 │
│     - Generate JWT token (7-day expiry)                               │
│     - Return: {token, user}                                           │
│                                                                       │
│  3. Frontend Stores Token                                             │
│     - localStorage.setItem('token', token)                            │
│     - localStorage.setItem('user', JSON.stringify(user))              │
│                                                                       │
│  4. Subsequent Requests                                               │
│     - Axios interceptor adds header: Authorization: Bearer <token>    │
│     - Backend auth() middleware verifies JWT                          │
│     - Attaches user object to req.user                                │
│                                                                       │
│  5. Role-Based Access                                                 │
│     - permit('teacher','admin') checks req.user.role                  │
│     - 403 if role not in allowed list                                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   REAL-TIME NOTIFICATION FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Client Connects to Socket.IO                                      │
│     - On page load: io('http://localhost:5000')                      │
│     - Auto-connection with reconnection                               │
│                                                                       │
│  2. User Joins Rooms                                                  │
│     - socket.emit('join', userId) - personal room                     │
│     - socket.emit('join', 'general') - chat room                      │
│                                                                       │
│  3. Server-side Event (e.g., new notice created)                      │
│     - req.io.emit('new_notice', {id, title, content})                │
│     - Broadcast to ALL connected clients                              │
│                                                                       │
│  4. Client Receives Event                                             │
│     - socket.on('new_notice', data => {...})                         │
│     - Update UI (add to notification feed)                            │
│                                                                       │
│  5. Room-specific Events (e.g., chat message)                         │
│     - req.io.to('general').emit('new_message', msg)                  │
│     - Only clients in 'general' room receive it                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Development (Current):                                               │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐              │
│  │  Frontend  │────▶│  Backend   │────▶│  MongoDB   │              │
│  │ localhost  │     │ localhost  │     │ localhost  │              │
│  │   :5173    │     │   :5000    │     │   :27017   │              │
│  └────────────┘     └────────────┘     └────────────┘              │
│                                                                       │
│  Production (Recommended):                                            │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐              │
│  │  Frontend  │────▶│  Backend   │────▶│  MongoDB   │              │
│  │  (Vercel/  │     │  (Heroku/  │     │  (Atlas    │              │
│  │   Netlify) │     │   Railway) │     │   Cloud)   │              │
│  └────────────┘     └────────────┘     └────────────┘              │
│       HTTPS              HTTPS              SSL                      │
│                                                                       │
│  + CDN for static files                                               │
│  + Load balancer (if scaling)                                         │
│  + Redis for session store (optional)                                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| | Vite | Build tool & dev server |
| | Material-UI | Component library |
| | React Router | Client-side routing |
| | Axios | HTTP client |
| | Socket.IO Client | Real-time connection |
| **Backend** | Node.js | Runtime |
| | Express | Web framework |
| | Socket.IO | Real-time engine |
| | Mongoose | MongoDB ODM |
| | JWT | Authentication |
| | Bcrypt | Password hashing |
| | Multer | File uploads |
| **Database** | MongoDB | NoSQL database |
| **Dev Tools** | Nodemon | Auto-restart |
| | ESLint | Code linting (optional) |

## Security Layers

```
┌─────────────────────────────────────────┐
│         Application Security            │
├─────────────────────────────────────────┤
│  1. JWT Authentication                  │
│     - Token-based auth                  │
│     - 7-day expiry                      │
│                                         │
│  2. Role-Based Access Control           │
│     - Student / Teacher / Admin         │
│     - Route-level guards                │
│                                         │
│  3. Password Security                   │
│     - Bcrypt hashing (10 rounds)        │
│     - Never returned in responses       │
│                                         │
│  4. CORS Configuration                  │
│     - Controlled cross-origin access    │
│                                         │
│  5. Input Sanitization (Mongoose)       │
│     - Schema validation                 │
│     - Type checking                     │
│                                         │
│  Future Enhancements:                   │
│  - Rate limiting                        │
│  - HTTPS/SSL                            │
│  - CSRF protection                      │
│  - Input validation (express-validator)│
└─────────────────────────────────────────┘
```
