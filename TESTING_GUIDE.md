# 🧪 Complete Testing & Verification Guide

## ✅ Pre-Flight Checklist

### 1. Dependencies Verification

**Backend Dependencies (All Installed ✓):**
- ✅ nodemailer - Email notifications
- ✅ twilio - SMS notifications
- ✅ qrcode - QR code generation
- ✅ sharp - Image optimization
- ✅ web-push - Push notifications
- ✅ googleapis - Google Calendar
- ✅ express-validator - Input validation
- ✅ express-rate-limit - Rate limiting
- ✅ node-cron - Scheduled tasks
- ✅ archiver - File compression
- ✅ csv-parser - CSV import
- ✅ csv-writer - CSV export
- ✅ simple-peer - WebRTC
- ✅ multer - File uploads

**Frontend Dependencies (All Installed ✓):**
- ✅ simple-peer - WebRTC
- ✅ react-toastify - Notifications
- ✅ html5-qrcode - QR scanner
- ✅ react-qr-code - QR display
- ✅ react-big-calendar - Calendar
- ✅ moment - Date handling
- ✅ recharts - Charts
- ✅ date-fns - Date formatting
- ✅ vite-plugin-pwa - PWA support

### 2. Environment Configuration Status

| Configuration | Status | Required |
|--------------|--------|----------|
| MongoDB Connection | ✅ Configured | Yes |
| JWT Secret | ✅ Configured | Yes |
| Frontend .env | ✅ Created | Yes |
| VAPID Keys | ⚠️ Placeholder | Yes* |
| Email SMTP | ⚠️ Placeholder | Yes* |
| Twilio SMS | ⚠️ Placeholder | No |
| Google Calendar | ⚠️ Placeholder | No |

**Legend:**
- ✅ = Ready to use
- ⚠️ = Needs configuration
- * = Required for full functionality

---

## 🚀 Quick Start (3 Steps)

### Step 1: Generate VAPID Keys
```bash
cd backend
npx web-push generate-vapid-keys
```

**Output will look like:**
```
=======================================
Public Key:
BNxw7ZmU8nk9abc123def456...

Private Key:
xyz789abc123def456...
=======================================
```

**Update Files:**
1. `backend/.env` → Add both keys
2. `frontend/.env` → Add public key to VITE_VAPID_PUBLIC_KEY

### Step 2: Configure Email
Open `backend/.env` and update:
```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

### Step 3: Start Application
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

---

## 🧪 Feature Testing Checklist

### 1️⃣ Authentication & Profile (5 min)

**Test Login:**
```http
POST http://localhost:5000/api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected:** 
- ✅ Token received
- ✅ Redirected to dashboard

**Test Avatar Upload:**
1. Go to Profile page
2. Click camera icon on avatar
3. Select image (max 5MB)
4. Click Upload

**Expected:**
- ✅ Image preview shows
- ✅ Upload success message
- ✅ Avatar displays immediately
- ✅ Image optimized to 300x300px

**Files Created:**
- `backend/uploads/avatars/[userId]-[timestamp].jpg`

---

### 2️⃣ Assignments System (10 min)

**Create Assignment (Teacher/Admin):**
```http
POST http://localhost:5000/api/assignments
Authorization: Bearer YOUR_TOKEN
{
  "title": "Test Assignment",
  "description": "Complete the test",
  "subject": "SUBJECT_ID",
  "dueDate": "2025-12-31T23:59:59Z",
  "maxScore": 100
}
```

**Expected:**
- ✅ Assignment created
- ✅ Email sent to students (if email configured)
- ✅ Appears in assignment list

**Submit Assignment (Student):**
```http
POST http://localhost:5000/api/assignments/:assignmentId/submit
Authorization: Bearer STUDENT_TOKEN
{
  "submissionText": "My solution",
  "attachments": ["file_url"]
}
```

**Expected:**
- ✅ Submission recorded
- ✅ Timestamp captured
- ✅ Teacher notified

**Grade Submission (Teacher):**
```http
PUT http://localhost:5000/api/assignments/submissions/:submissionId/grade
Authorization: Bearer TEACHER_TOKEN
{
  "score": 85,
  "feedback": "Good work!"
}
```

**Expected:**
- ✅ Grade saved
- ✅ Student notified
- ✅ Appears in grades page

---

### 3️⃣ QR Code Attendance (8 min)

**Generate QR Session (Teacher):**
```http
POST http://localhost:5000/api/attendance/session/create
Authorization: Bearer TEACHER_TOKEN
{
  "subject": "SUBJECT_ID",
  "date": "2025-11-20",
  "duration": 10,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Expected:**
- ✅ QR code generated (base64 image)
- ✅ Session expires in 10 minutes
- ✅ QR displays on screen

**Scan QR (Student):**
1. Open attendance page
2. Click "Scan QR"
3. Allow camera access
4. Scan displayed QR code

**Expected:**
- ✅ Camera opens
- ✅ QR detected
- ✅ Location validated (within 100m)
- ✅ Attendance marked
- ✅ "Present" status shown

**Test Location Validation:**
- Try scanning from >100m away → ❌ "Location mismatch" error
- Try scanning after expiry → ❌ "Session expired" error
- Try scanning twice → ❌ "Already marked" error

---

### 4️⃣ Video Conferencing (12 min)

**Start Conference:**
1. Navigate to `http://localhost:5173/video/test-room`
2. Allow camera + microphone permissions

**Expected:**
- ✅ Local video shows
- ✅ Audio/video controls visible
- ✅ Screen share button visible

**Test Peer Connection:**
1. Open another browser tab/window
2. Navigate to same URL: `/video/test-room`
3. Allow permissions

**Expected:**
- ✅ Both users see each other
- ✅ Audio works both ways
- ✅ Video streams correctly
- ✅ Participant list shows 2 users

**Test Controls:**
- Click microphone icon → ✅ Audio mutes/unmutes
- Click video icon → ✅ Video stops/starts
- Click screen share → ✅ Screen sharing starts
- Send chat message → ✅ Appears in chat sidebar
- Leave room → ✅ Other user notified

**Test Mobile:**
- Open on mobile browser
- ✅ Camera switches to front/back
- ✅ Touch controls work
- ✅ Portrait/landscape modes

---

### 5️⃣ Advanced Search (5 min)

**Navigate to:** `http://localhost:5173/search`

**Test Global Search:**
1. Type "john" in search box
2. Wait for autocomplete

**Expected:**
- ✅ Suggestions appear (min 2 chars)
- ✅ Icons show entity type
- ✅ Press Enter to search

**Test Filters:**
```http
GET http://localhost:5000/api/search/advanced?q=test&type=users&role=student&department=CS
```

**Expected:**
- ✅ Filtered results
- ✅ Pagination works
- ✅ Result count accurate

**Test Search Types:**
- Users → ✅ Shows name, email, role
- Subjects → ✅ Shows code, name, teacher
- Assignments → ✅ Shows title, due date
- Notices → ✅ Shows title, date
- Files → ✅ Shows filename, uploader

---

### 6️⃣ Calendar & Events (7 min)

**Create Event:**
```http
POST http://localhost:5000/api/calendar/events
Authorization: Bearer TOKEN
{
  "title": "Midterm Exam",
  "description": "CS101 Midterm",
  "type": "exam",
  "startDate": "2025-12-01T09:00:00Z",
  "endDate": "2025-12-01T11:00:00Z",
  "location": "Room 101"
}
```

**Expected:**
- ✅ Event created
- ✅ Appears in calendar view
- ✅ Email notification sent

**Test Calendar Views:**
- Month view → ✅ Events displayed on dates
- Week view → ✅ Time slots shown
- Day view → ✅ Hour-by-hour schedule
- Agenda view → ✅ List of upcoming events

**Test Google Sync (if configured):**
1. Click "Connect Google Calendar"
2. Authorize app
3. Click "Sync Event"

**Expected:**
- ✅ Event appears in Google Calendar
- ✅ Updates sync both ways

---

### 7️⃣ Analytics Dashboard (6 min)

**Navigate to:** `http://localhost:5173/analytics`

**For Teachers/Admin:**

**Overview Cards:**
- ✅ Total Students count
- ✅ Total Assignments count
- ✅ Average Attendance %
- ✅ Average Grade

**Charts:**
- ✅ Grade Distribution (bar chart)
- ✅ Attendance Trends (line chart)
- ✅ Subject Performance (pie chart)
- ✅ Assignment Submission (area chart)

**Test Filters:**
- Date range → ✅ Charts update
- Subject filter → ✅ Data filtered
- Semester filter → ✅ Results change

**Export Data:**
```http
GET http://localhost:5000/api/analytics/export/grades?format=csv
```

**Expected:**
- ✅ CSV file downloads
- ✅ All fields included
- ✅ Proper formatting

---

### 8️⃣ Push Notifications (10 min)

**Setup:**
1. Start backend with VAPID keys configured
2. Open frontend
3. Allow notifications when prompted

**Test Push:**
```http
POST http://localhost:5000/api/notifications/test
Authorization: Bearer TOKEN
```

**Expected:**
- ✅ Browser notification appears
- ✅ Click opens relevant page
- ✅ Notification badge updates

**Test Channels:**
- Create assignment → ✅ Students notified
- Grade submission → ✅ Student notified
- New notice → ✅ All users notified
- Calendar event → ✅ Participants notified

**Test Preferences:**
1. Go to notification settings
2. Disable email notifications
3. Create assignment

**Expected:**
- ✅ Only push notification sent
- ✅ No email sent
- ✅ Settings saved

---

### 9️⃣ Bulk Operations (8 min)

**Create Test CSV (`users.csv`):**
```csv
name,email,role,department,phone,studentId,semester
Test Student 1,test1@example.com,student,Computer Science,1234567890,S001,1
Test Student 2,test2@example.com,student,Computer Science,0987654321,S002,1
Test Student 3,test3@example.com,student,Electrical Engineering,5555555555,S003,2
```

**Import Users:**
```bash
curl -X POST http://localhost:5000/api/bulk/users/import \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "file=@users.csv"
```

**Expected Response:**
```json
{
  "imported": 3,
  "failed": 0,
  "errors": []
}
```

**Test Error Handling:**

Create `invalid.csv`:
```csv
name,email,role,department
Invalid User,invalid-email,student,CS
```

**Expected:**
```json
{
  "imported": 0,
  "failed": 1,
  "errors": [
    {
      "row": 2,
      "error": "Invalid email format"
    }
  ]
}
```

**Export Users:**
```http
GET http://localhost:5000/api/bulk/users/export?role=student
Authorization: Bearer ADMIN_TOKEN
```

**Expected:**
- ✅ CSV file downloads
- ✅ All students included
- ✅ Correct headers
- ✅ Data properly formatted

**Test Bulk Delete:**
```http
DELETE http://localhost:5000/api/bulk/users
Authorization: Bearer ADMIN_TOKEN
{
  "userIds": ["ID1", "ID2", "ID3"]
}
```

**Expected:**
- ✅ Users deleted
- ✅ Related data cleaned up
- ✅ Success count returned

---

### 🔟 Chat Rooms (6 min)

**Create Room:**
```http
POST http://localhost:5000/api/chatrooms
Authorization: Bearer TEACHER_TOKEN
{
  "name": "CS101 Discussion",
  "description": "Course discussions",
  "type": "subject",
  "subject": "SUBJECT_ID",
  "maxMembers": 50,
  "allowStudentJoin": true
}
```

**Expected:**
- ✅ Room created
- ✅ Creator is admin
- ✅ Appears in room list

**Join Room (Student):**
```http
POST http://localhost:5000/api/chatrooms/:roomId/join
Authorization: Bearer STUDENT_TOKEN
```

**Expected:**
- ✅ Student added to members
- ✅ Room appears in their list
- ✅ Can send messages

**Test Real-time Chat:**
1. Open room in 2 different browsers
2. Send message from one

**Expected:**
- ✅ Message appears instantly in both
- ✅ Sender name shown
- ✅ Timestamp displayed
- ✅ Read receipts (optional)

---

## 🎯 Performance Testing

### Load Testing

**Test Concurrent Users:**
```bash
# Install artillery (if not installed)
npm install -g artillery

# Create test file: load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - flow:
    - post:
        url: "/api/auth/login"
        json:
          email: "test@example.com"
          password: "password123"
```

**Run Test:**
```bash
artillery run load-test.yml
```

**Expected:**
- ✅ Response time < 500ms
- ✅ Error rate < 1%
- ✅ No memory leaks

### Database Performance

**Test Query Speed:**
```javascript
// In MongoDB shell
db.users.find().explain("executionStats")
```

**Expected:**
- ✅ Indexes used
- ✅ Query time < 100ms
- ✅ No full collection scans

---

## 🔒 Security Testing

### Authentication

**Test Invalid Token:**
```http
GET http://localhost:5000/api/assignments
Authorization: Bearer INVALID_TOKEN
```

**Expected:** ❌ 401 Unauthorized

**Test Expired Token:**
- Wait 7 days (or change JWT_EXPIRE)
- Try API request

**Expected:** ❌ 401 Token Expired

### Authorization

**Test Role Restrictions:**
```http
# Student tries to create assignment
POST http://localhost:5000/api/assignments
Authorization: Bearer STUDENT_TOKEN
```

**Expected:** ❌ 403 Forbidden

### Input Validation

**Test SQL Injection:**
```http
POST http://localhost:5000/api/auth/login
{
  "email": "admin@example.com' OR '1'='1",
  "password": "anything"
}
```

**Expected:** ❌ 400 Invalid Input

**Test XSS:**
```http
POST http://localhost:5000/api/assignments
{
  "title": "<script>alert('xss')</script>"
}
```

**Expected:** ✅ Script tags escaped

### Rate Limiting

**Test API Limits:**
```bash
# Send 101 requests in 15 minutes
for i in {1..101}; do
  curl http://localhost:5000/api/notices
done
```

**Expected:**
- First 100: ✅ 200 OK
- 101st: ❌ 429 Too Many Requests

---

## 📱 Mobile Testing

### Responsive Design

**Test Breakpoints:**
- Desktop (>1200px) → ✅ 3-column layout
- Tablet (768-1199px) → ✅ 2-column layout
- Mobile (<768px) → ✅ Single column

**Test Touch Interactions:**
- Swipe navigation → ✅ Works
- Pinch zoom → ✅ Disabled on inputs
- Tap targets → ✅ Min 44x44px

### PWA Features

**Test Offline Mode:**
1. Load app fully
2. Turn off internet
3. Navigate between pages

**Expected:**
- ✅ Cached pages load
- ✅ Offline indicator shows
- ✅ Queued actions saved

**Test Install:**
1. Open in Chrome/Edge
2. Look for install prompt

**Expected:**
- ✅ Install banner appears
- ✅ App installs to home screen
- ✅ Standalone mode works

**Test Notifications:**
1. Install PWA
2. Close browser
3. Create assignment

**Expected:**
- ✅ Notification appears
- ✅ Clicking opens app
- ✅ Badge count updates

---

## 🐛 Common Issues & Solutions

### Issue: "Camera not found"
**Solution:** Use HTTPS or localhost, grant camera permissions

### Issue: "WebRTC connection failed"
**Solution:** Check firewall, use STUN/TURN servers for production

### Issue: "Socket disconnects"
**Solution:** Check VITE_WS_URL matches backend port

### Issue: "VAPID keys error"
**Solution:** Generate keys with `npx web-push generate-vapid-keys`

### Issue: "Email not sending"
**Solution:** Verify EMAIL_USER and EMAIL_PASSWORD in .env

### Issue: "MongoDB connection timeout"
**Solution:** Add IP to Atlas Network Access: 0.0.0.0/0

### Issue: "Module not found: simple-peer"
**Solution:** `cd frontend && npm install simple-peer`

### Issue: "Avatar upload fails"
**Solution:** Check backend/uploads/avatars/ exists and writable

### Issue: "CSV import fails"
**Solution:** Check CSV format matches expected headers

### Issue: "QR scan fails"
**Solution:** Ensure good lighting, QR code fully visible

---

## ✅ Final Verification

### Backend Health Check
```http
GET http://localhost:5000/api/auth/login
```
**Expected:** 400 (endpoint works, validation error for missing data)

### Frontend Health Check
```
http://localhost:5173
```
**Expected:** Login page loads

### Database Health Check
```javascript
// In MongoDB Compass
db.runCommand({ ping: 1 })
```
**Expected:** { ok: 1 }

### WebSocket Health Check
```javascript
// In browser console
const socket = io('http://localhost:5000')
socket.on('connect', () => console.log('Connected:', socket.id))
```
**Expected:** "Connected: [socket_id]"

---

## 📊 Success Criteria

| Category | Tests | Passed | Status |
|----------|-------|--------|--------|
| Authentication | 5 | __/5 | ⏳ |
| Avatar Upload | 3 | __/3 | ⏳ |
| Assignments | 8 | __/8 | ⏳ |
| QR Attendance | 6 | __/6 | ⏳ |
| Video Conference | 8 | __/8 | ⏳ |
| Search | 5 | __/5 | ⏳ |
| Calendar | 6 | __/6 | ⏳ |
| Analytics | 5 | __/5 | ⏳ |
| Notifications | 6 | __/6 | ⏳ |
| Bulk Ops | 7 | __/7 | ⏳ |
| Chat Rooms | 5 | __/5 | ⏳ |
| **TOTAL** | **64** | **__/64** | ⏳ |

**Passing Grade:** 60/64 (93%+)

---

## 🎓 Graduation Checklist

Before deploying to production:

- [ ] All dependencies installed
- [ ] VAPID keys generated and configured
- [ ] Email SMTP configured and tested
- [ ] MongoDB Atlas connection verified
- [ ] JWT_SECRET changed from default
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS configured for production domain
- [ ] SSL/TLS certificate installed
- [ ] Error logging configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools setup
- [ ] All 64 tests passed
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] User training completed

---

**🎉 You're ready to launch Campus Hub!**

Need help? Check:
1. COMPLETE_SETUP_GUIDE.md
2. API_DOCUMENTATION.md
3. README.md
