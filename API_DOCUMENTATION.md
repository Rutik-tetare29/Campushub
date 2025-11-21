# 📚 Complete API Documentation - Campus Hub

## 🔐 Authentication Required
All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔑 Authentication & Authorization

### POST /api/auth/signup
Register new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "department": "Computer Science"
}
```
**Response:** `{ token, user }`

### POST /api/auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:** `{ token, user }`

---

## 👤 User Profile & Avatar

### GET /api/users/profile/:id
Get user profile
**Auth:** Required
**Response:** User object

### PUT /api/users/profile/:id
Update user profile
**Auth:** Required (own profile or admin)
```json
{
  "name": "Updated Name",
  "phone": "1234567890",
  "address": "123 Main St",
  "bio": "My bio"
}
```

### PUT /api/users/password/:id
Change password
**Auth:** Required (own profile)
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### POST /api/avatar/upload
Upload avatar (multipart/form-data)
**Auth:** Required
**Field:** `avatar` (image file, max 5MB)
**Response:** `{ message, avatar: "/uploads/avatars/..." }`

### DELETE /api/avatar
Remove avatar
**Auth:** Required
**Response:** `{ message }`

### GET /api/avatar/:userId
Get user avatar (public)
**Response:** Image file

---

## 📝 Assignments

### GET /api/assignments
Get all assignments (filtered by role)
**Query:** `?subject=<id>&status=pending`

### POST /api/assignments
Create assignment (teacher/admin)
```json
{
  "title": "Assignment 1",
  "description": "Complete the task",
  "subject": "subject_id",
  "dueDate": "2025-12-31",
  "maxScore": 100
}
```

### GET /api/assignments/:id
Get assignment details

### PUT /api/assignments/:id
Update assignment (teacher/admin)

### DELETE /api/assignments/:id
Delete assignment (teacher/admin)

### POST /api/assignments/:id/submit
Submit assignment (student)
```json
{
  "submissionText": "My submission",
  "attachments": ["file_url"]
}
```

### GET /api/assignments/:id/submissions
Get all submissions (teacher/admin)

### PUT /api/assignments/submissions/:submissionId/grade
Grade submission (teacher/admin)
```json
{
  "score": 85,
  "feedback": "Great work!"
}
```

---

## 📊 Grades

### GET /api/grades
Get grades (filtered by role)

### GET /api/grades/student/:studentId
Get student grades

### GET /api/grades/subject/:subjectId
Get subject grades

### POST /api/grades
Create/update grade (teacher/admin)
```json
{
  "student": "student_id",
  "subject": "subject_id",
  "assignments": 85,
  "midterm": 90,
  "final": 88,
  "semester": 1,
  "academicYear": "2025"
}
```

### PUT /api/grades/:id
Update grade (teacher/admin)

### GET /api/grades/transcript/:studentId
Get student transcript

---

## ✅ Attendance

### POST /api/attendance/session/create
Create QR attendance session (teacher)
```json
{
  "subject": "subject_id",
  "date": "2025-11-20",
  "duration": 10,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```
**Response:** `{ session, qrCode: "base64_image" }`

### GET /api/attendance/session/:id
Get session details

### POST /api/attendance/mark
Mark attendance via QR scan (student)
```json
{
  "sessionId": "session_id",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

### POST /api/attendance/manual
Manual attendance marking (teacher)
```json
{
  "subject": "subject_id",
  "date": "2025-11-20",
  "students": [
    { "student": "id", "status": "present" }
  ]
}
```

### GET /api/attendance/student/:studentId
Get student attendance records

### GET /api/attendance/subject/:subjectId
Get subject attendance records

### GET /api/attendance/analytics/low-attendance
Get students with low attendance (teacher/admin)

---

## 💬 Chat Rooms

### GET /api/chatrooms
Get all accessible chat rooms

### POST /api/chatrooms
Create chat room (teacher/admin)
```json
{
  "name": "CS101 Discussion",
  "description": "Course discussions",
  "type": "subject",
  "subject": "subject_id",
  "maxMembers": 50,
  "allowStudentJoin": true
}
```

### GET /api/chatrooms/:id
Get chat room details

### PUT /api/chatrooms/:id
Update chat room (admin/creator)

### DELETE /api/chatrooms/:id
Delete chat room (admin/creator)

### POST /api/chatrooms/:id/join
Join chat room

### POST /api/chatrooms/:id/leave
Leave chat room

### GET /api/chatrooms/:id/messages
Get chat room messages

---

## 📅 Calendar

### GET /api/calendar/events
Get calendar events
**Query:** `?startDate=2025-11-01&endDate=2025-11-30`

### POST /api/calendar/events
Create event (teacher/admin)
```json
{
  "title": "Midterm Exam",
  "description": "CS101 Midterm",
  "type": "exam",
  "startDate": "2025-12-01T09:00:00Z",
  "endDate": "2025-12-01T11:00:00Z",
  "location": "Room 101"
}
```

### GET /api/calendar/events/:id
Get event details

### PUT /api/calendar/events/:id
Update event

### DELETE /api/calendar/events/:id
Delete event

### GET /api/calendar/google/auth-url
Get Google Calendar OAuth URL

### POST /api/calendar/google/callback
Handle OAuth callback
```json
{
  "code": "google_auth_code"
}
```

### POST /api/calendar/google/sync
Sync event to Google Calendar
```json
{
  "eventId": "event_id"
}
```

---

## 🔔 Notifications

### GET /api/notifications
Get user notifications
**Query:** `?unread=true&page=1&limit=20`

### GET /api/notifications/unread-count
Get unread notification count

### PUT /api/notifications/:id/read
Mark notification as read

### PUT /api/notifications/read-all
Mark all as read

### POST /api/notifications/subscribe
Subscribe to push notifications
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

### GET /api/notifications/preferences
Get notification preferences

### PUT /api/notifications/preferences
Update notification preferences
```json
{
  "email": true,
  "sms": false,
  "push": true
}
```

### GET /api/notifications/vapid-public-key
Get VAPID public key for push

---

## 📈 Analytics

### GET /api/analytics/dashboard
Get dashboard overview (role-based)

### GET /api/analytics/attendance
Get attendance analytics (teacher/admin)

### GET /api/analytics/grades
Get grade analytics (teacher/admin)

### GET /api/analytics/assignments
Get assignment analytics (teacher/admin)

### GET /api/analytics/subject/:subjectId
Get subject-specific analytics

### GET /api/analytics/export/:type
Export analytics data as CSV
**Params:** `type` = attendance | grades | assignments

---

## 🔍 Advanced Search

### GET /api/search
Global search across all entities
**Query:** `?q=john&type=users&limit=20`
**Types:** users, subjects, assignments, notices, uploads, all

### GET /api/search/advanced
Advanced search with filters
```
?q=john
&type=users
&role=student
&department=Computer Science
&semester=1
&startDate=2025-01-01
&endDate=2025-12-31
&page=1
&limit=20
```

### GET /api/search/suggestions
Get autocomplete suggestions
**Query:** `?q=jo&type=users&limit=5`
**Response:** `{ suggestions: [{ type, label, value, icon }] }`

---

## 📦 Bulk Operations (Admin Only)

### POST /api/bulk/users/import
Import users from CSV (multipart/form-data)
**Field:** `file` (CSV file)
**CSV Format:**
```csv
name,email,role,department,phone,studentId,semester
John Doe,john@example.com,student,CS,1234567890,S001,1
```
**Response:** `{ imported, failed, errors }`

### POST /api/bulk/students
Batch create students
```json
{
  "students": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "student123",
      "department": "CS",
      "semester": 1
    }
  ]
}
```

### POST /api/bulk/grades/import
Import grades from CSV (multipart/form-data)
**CSV Format:**
```csv
studentId,subjectId,assignments,midterm,final,semester,academicYear
S001,SUB001,85,90,88,1,2025
```

### GET /api/bulk/users/export
Export users to CSV
**Query:** `?role=student`
**Response:** CSV file download

### GET /api/bulk/grades/export
Export grades to CSV
**Query:** `?subjectId=xxx&semester=1&academicYear=2025`
**Response:** CSV file download

### DELETE /api/bulk/users
Bulk delete users
```json
{
  "userIds": ["id1", "id2", "id3"]
}
```

---

## 📢 Notices

### GET /api/notices
Get all notices

### POST /api/notices
Create notice (teacher/admin)
```json
{
  "title": "Important Announcement",
  "content": "Classes postponed",
  "priority": "high",
  "targetRoles": ["student", "teacher"]
}
```

### PUT /api/notices/:id
Update notice

### DELETE /api/notices/:id
Delete notice

---

## 📚 Subjects

### GET /api/subjects
Get all subjects

### POST /api/subjects
Create subject (admin)
```json
{
  "name": "Introduction to Programming",
  "code": "CS101",
  "description": "Learn programming basics",
  "teacher": "teacher_id",
  "semester": 1,
  "department": "Computer Science"
}
```

### PUT /api/subjects/:id
Update subject

### DELETE /api/subjects/:id
Delete subject

---

## 📁 File Uploads

### GET /api/upload
Get all uploads

### POST /api/upload
Upload file (multipart/form-data)
**Fields:** `file`, `subject`, `description`

### DELETE /api/upload/:id
Delete upload

---

## 📅 Schedule

### GET /api/schedules
Get schedules

### POST /api/schedules
Create schedule (admin)
```json
{
  "subject": "subject_id",
  "day": "Monday",
  "startTime": "09:00",
  "endTime": "11:00",
  "room": "Room 101"
}
```

---

## 💬 Messages (Direct Chat)

### GET /api/messages
Get messages
**Query:** `?to=user_id`

### POST /api/messages
Send message
```json
{
  "to": "user_id",
  "content": "Hello!"
}
```

---

## 🎥 Video Conference (WebRTC Signaling)

**Via Socket.IO only:**

### join-room
```javascript
socket.emit('join-room', {
  roomId: 'room123',
  userId: 'user_id',
  userName: 'John Doe'
});
```

### signal
```javascript
socket.emit('signal', {
  to: 'socket_id',
  signal: peerSignal,
  type: 'offer' // or 'answer'
});
```

### toggle-media
```javascript
socket.emit('toggle-media', {
  roomId: 'room123',
  userId: 'user_id',
  type: 'audio', // or 'video'
  enabled: false
});
```

### start-screen-share / stop-screen-share
```javascript
socket.emit('start-screen-share', {
  roomId: 'room123',
  userId: 'user_id'
});
```

### video-chat-message
```javascript
socket.emit('video-chat-message', {
  roomId: 'room123',
  userId: 'user_id',
  userName: 'John Doe',
  message: 'Hello everyone!'
});
```

### leave-room
```javascript
socket.emit('leave-room', {
  roomId: 'room123',
  userId: 'user_id'
});
```

---

## 📊 Response Formats

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": [ ... ]
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

---

## 🔐 Role-Based Access

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| View Assignments | ✅ Own | ✅ Created | ✅ All |
| Create Assignment | ❌ | ✅ | ✅ |
| Submit Assignment | ✅ | ❌ | ❌ |
| Grade Assignment | ❌ | ✅ | ✅ |
| View Grades | ✅ Own | ✅ Subject | ✅ All |
| QR Attendance Create | ❌ | ✅ | ✅ |
| QR Attendance Mark | ✅ | ✅ | ✅ |
| Chat Rooms Create | ❌ | ✅ | ✅ |
| Chat Rooms Join | ✅ | ✅ | ✅ |
| Analytics View | ❌ | ✅ | ✅ |
| Bulk Operations | ❌ | ❌ | ✅ |
| Search All | ✅ | ✅ | ✅ |

---

## 🚀 Rate Limiting

All API endpoints are rate-limited to **100 requests per 15 minutes** per IP address.

---

## 📝 Notes

1. **File Uploads:** Use `multipart/form-data` content type
2. **Date Format:** ISO 8601 (e.g., `2025-11-20T09:00:00Z`)
3. **Authentication:** JWT token expires in 7 days (configurable)
4. **WebSockets:** Socket.IO for real-time features (chat, video, notifications)
5. **CORS:** Configured for frontend URL in backend/.env

---

## 🧪 Testing with Postman

1. **Create Environment:**
   - `base_url`: http://localhost:5000
   - `token`: (set after login)

2. **Login to get token:**
   ```
   POST {{base_url}}/api/auth/login
   ```

3. **Set token in Headers:**
   ```
   Authorization: Bearer {{token}}
   ```

4. **Test endpoints!**

---

## 📚 Example Workflows

### Complete Assignment Flow
1. Teacher creates assignment → `POST /api/assignments`
2. Students receive email notification
3. Student submits → `POST /api/assignments/:id/submit`
4. Teacher grades → `PUT /api/assignments/submissions/:id/grade`
5. Student receives grade notification

### QR Attendance Flow
1. Teacher creates session → `POST /api/attendance/session/create`
2. QR code displayed on screen
3. Students scan QR → `POST /api/attendance/mark`
4. System validates time + location
5. Attendance marked

### Video Conference Flow
1. Navigate to `/video/meeting-id`
2. Socket connects → `join-room`
3. WebRTC peer connections established
4. Real-time audio/video streaming
5. Leave → `leave-room`

---

**Total API Endpoints: 60+**  
**All endpoints tested and production-ready! ✅**
