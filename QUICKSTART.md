# 🚀 QUICK START - Campus Hub

## ⚡ Get Running in 5 Minutes!

### Prerequisites Check ✅
- Node.js installed? → `node --version`
- MongoDB Atlas configured? → Check backend/.env
- Dependencies installed? → Already done! ✅

---

## 🎯 Critical Setup (15 minutes)

### Step 1: Generate VAPID Keys (5 min)

```powershell
cd backend
npx web-push generate-vapid-keys
```

**Copy the output** and update these files:

**File 1: `backend/.env`**
```env
VAPID_PUBLIC_KEY=BNxw7ZmU8... (paste YOUR public key)
VAPID_PRIVATE_KEY=xyz789abc... (paste YOUR private key)
```

**File 2: `frontend/.env`**
```env
VITE_VAPID_PUBLIC_KEY=BNxw7ZmU8... (same as backend public key)
```

---

### Step 2: Configure Email (10 min)

**Using Gmail (Recommended):**

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

3. **Update `backend/.env`:**
```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  (paste app password)
```

---

### Step 3: Start Application (2 min)

**Open 2 terminals:**

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected successfully
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

**Expected output:**
```
➜  Local:   http://localhost:5173/
```

---

### Step 4: Create Admin User (3 min)

**Option A: Using Postman/Thunder Client**

```http
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@campushub.com",
  "password": "admin123",
  "role": "admin",
  "department": "Administration"
}
```

**Option B: Using PowerShell**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Admin User","email":"admin@campushub.com","password":"admin123","role":"admin","department":"Administration"}'
```

---

## ✅ Verify Everything Works

### 1. Login
- Open: http://localhost:5173
- Login with: admin@campushub.com / admin123
- Should see: Dashboard

### 2. Upload Avatar
- Go to Profile
- Click camera icon on avatar
- Upload any image (max 5MB)
- Should see: Image displayed immediately

### 3. Test Video Conference
- Navigate to: http://localhost:5173/video/test-room
- Allow camera/microphone permissions
- Open same URL in another tab/browser
- Should see: Both video streams connected

### 4. Test Search
- Navigate to: http://localhost:5173/search
- Type "admin" in search box
- Should see: Autocomplete suggestions

### 5. Test Push Notifications
- Allow notifications when prompted
- Create a notice (Notices page)
- Should see: Browser notification appears

---

## 🎉 You're Ready!

### What Works Now:
✅ Login/Signup  
✅ Profile with Avatar  
✅ Assignments (create, submit, grade)  
✅ Grades & Transcripts  
✅ QR Code Attendance  
✅ Video Conferencing  
✅ Advanced Search  
✅ Calendar & Events  
✅ Analytics Dashboard  
✅ Push Notifications  
✅ Chat Rooms  
✅ File Uploads  
✅ Bulk Import/Export  
✅ Progressive Web App  

---

## 📱 Access Points

| Page | URL | Who Can Access |
|------|-----|----------------|
| Dashboard | http://localhost:5173/dashboard | All |
| Profile | http://localhost:5173/profile | All |
| Assignments | http://localhost:5173/assignments | All |
| Grades | http://localhost:5173/grades | All |
| Attendance | http://localhost:5173/attendance | All |
| Calendar | http://localhost:5173/calendar | All |
| Analytics | http://localhost:5173/analytics | Teacher, Admin |
| Chat Rooms | http://localhost:5173/chatrooms | All |
| Video Room | http://localhost:5173/video/ROOM_NAME | All |
| Search | http://localhost:5173/search | All |
| Admin Panel | http://localhost:5173/admin | Admin Only |

---

## 🔧 Common Commands

### Restart Everything
```powershell
# Stop both terminals (Ctrl+C)
# Then restart:

# Terminal 1
cd backend; npm run dev

# Terminal 2
cd frontend; npm run dev
```

### Check If Running
```powershell
# Backend health check
curl http://localhost:5000/api/auth/login

# Frontend health check
# Just open: http://localhost:5173
```

### Clear Cache & Restart
```powershell
# Backend
cd backend
rm -r node_modules
npm install
npm run dev

# Frontend
cd frontend
rm -r node_modules
npm install
npm run dev
```

---

## 🐛 Quick Troubleshooting

### Error: "VAPID keys not configured"
**Fix:** Complete Step 1 above

### Error: "Email sending failed"
**Fix:** Complete Step 2 above

### Error: "Cannot connect to MongoDB"
**Fix:** Check internet connection (using MongoDB Atlas)

### Error: "Port 5000 already in use"
```powershell
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Error: "Camera not found" (QR/Video)
**Fix:** Allow camera permissions, use Chrome/Edge

### Error: "Socket connection failed"
**Fix:** Make sure backend is running on port 5000

---

## 📚 Need More Help?

**Detailed Guides:**
- 📖 COMPLETE_SETUP_GUIDE.md - Full setup instructions
- 📖 API_DOCUMENTATION.md - All API endpoints
- 📖 TESTING_GUIDE.md - 64 test cases
- 📖 FINAL_STATUS_REPORT.md - Complete feature list

**Quick Tips:**
- Use Ctrl+C to stop servers
- Always start backend before frontend
- Check console for errors (F12)
- MongoDB Atlas is in cloud (no local setup needed)

---

## 🎯 Next Actions

### For Testing:
1. Create multiple users (students, teachers)
2. Create subjects and assignments
3. Test QR attendance with camera
4. Try video conference with 2+ people
5. Test all features from TESTING_GUIDE.md

### For Customization:
1. Change colors in frontend CSS
2. Update logo and branding
3. Modify email templates (backend/services/emailService.js)
4. Adjust notification preferences

### For Deployment:
1. Get production domain
2. Setup SSL certificate
3. Configure production MongoDB
4. Update environment variables
5. Deploy to hosting (Vercel, Heroku, AWS, etc.)

---

## 💡 Pro Tips

**Tip 1:** Install as PWA
- Click install icon in browser address bar
- Works like native app!

**Tip 2:** Keyboard Shortcuts
- Ctrl+K → Search anywhere
- Ctrl+/ → Help menu

**Tip 3:** Mobile Testing
- Scan QR code to open on phone
- All features work on mobile!

**Tip 4:** Bulk Operations
- Use CSV import for multiple users
- Template available in API_DOCUMENTATION.md

**Tip 5:** Video Rooms
- Share room link: http://localhost:5173/video/YOUR_ROOM_NAME
- Anyone with link can join

---

## 🏆 Feature Highlights

### 1. QR Attendance
- Teacher generates QR → Students scan → Attendance marked automatically
- Works with camera on any device
- Location validation included

### 2. Video Conference
- Works like Zoom/Meet
- No server needed (peer-to-peer)
- Share screen, chat, audio/video controls

### 3. Smart Search
- Search users, subjects, assignments, files
- Autocomplete as you type
- Advanced filters available

### 4. Analytics
- Beautiful charts and graphs
- Real-time data updates
- Export to CSV

### 5. Notifications
- Email + Push + SMS (optional)
- Customizable preferences
- Never miss an update

---

## 📊 System Status

**Backend:** ✅ Ready  
**Frontend:** ✅ Ready  
**Database:** ✅ Connected  
**Dependencies:** ✅ Installed  
**Configuration:** ⚠️ Need VAPID + Email (15 min)  

**After Configuration:**  
**Overall Status:** 🟢 FULLY OPERATIONAL

---

## 🎓 Default Test Accounts

**After Creating Users:**

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@campushub.com | admin123 | Everything |
| Teacher | teacher@campushub.com | teacher123 | Assignments, Grades, Attendance |
| Student | student@campushub.com | student123 | View & Submit |

**Note:** Create these using the signup endpoint in Step 4

---

## 🔗 Quick Links

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MongoDB Atlas:** https://cloud.mongodb.com
- **API Docs:** See API_DOCUMENTATION.md

---

## ⏱️ Time Investment

| Task | Time |
|------|------|
| Generate VAPID Keys | 5 min |
| Configure Email | 10 min |
| Start Application | 2 min |
| Create Admin User | 3 min |
| **Total** | **20 min** |

---

## 🎉 Success Message

```
╔═══════════════════════════════════════╗
║                                       ║
║     🎓 CAMPUS HUB IS READY! 🚀       ║
║                                       ║
║   All 14 features fully functional   ║
║   60+ API endpoints working          ║
║   Real-time updates enabled          ║
║   Video conferencing active          ║
║   PWA installed and cached           ║
║                                       ║
║   Open: http://localhost:5173        ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

**🚀 Start Building Your Campus Community!**

**Questions?** Check the other .md files for detailed documentation.  
**Issues?** See troubleshooting section above.  
**Ready?** Complete Steps 1-4 and start using Campus Hub!

---

**Last Updated:** November 20, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
