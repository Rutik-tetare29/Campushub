# 🚀 QUICK START GUIDE

## Prerequisites Check
- [ ] Node.js installed? (`node --version`)
- [ ] MongoDB Atlas IP whitelisted? (See step 1 below)
- [ ] Git Bash or PowerShell ready?

---

## Step 1: Whitelist Your IP in MongoDB Atlas ⚠️

**This is REQUIRED before the backend will work!**

1. Go to: https://cloud.mongodb.com/
2. Click **"Network Access"** (left sidebar under SECURITY)
3. Click **"Add IP Address"** button
4. Click **"Add Current IP Address"** (auto-detects your IP)
   - OR enter `0.0.0.0/0` to allow all IPs (easier for development)
5. Click **"Confirm"**
6. Wait 1-2 minutes for changes to apply

✅ See **MONGODB_ATLAS_SETUP.md** for detailed instructions with screenshots.

---

## Step 2: Backend Setup (Terminal 1)

```powershell
# Navigate to backend
cd "C:\Users\rutik\Desktop\Campus hub\backend"

# Install dependencies (first time only)
npm install

# Seed database with test users (first time only)
# NOTE: Make sure you whitelisted your IP in Step 1!
npm run seed

# Start backend server
npm run dev
```

✅ Backend running on **http://localhost:5000**
✅ Connected to **MongoDB Atlas** (cloud database)

---

## Step 3: Frontend Setup (Terminal 2)

```powershell
# Navigate to frontend (NEW terminal)
cd "C:\Users\rutik\Desktop\Campus hub\frontend"

# Install dependencies (first time only)
npm install

# Start frontend server
npm run dev
```

✅ Frontend running on **http://localhost:5173**

---

## Step 4: Open & Test

1. **Open browser:** http://localhost:5173

2. **Login as Teacher:**
   ```
   Email: teacher@campus.edu
   Password: teacher123
   ```

3. **Test Features:**
   - ✅ Create a subject
   - ✅ Create a class schedule
   - ✅ Post a notice
   - ✅ Send a chat message
   - ✅ Upload a file
   - ✅ View Dashboard notifications

4. **Open Second Tab:**
   - Signup as student
   - Watch real-time notifications appear!

---

## 🔧 Troubleshooting

### MongoDB Connection Failed
```
Error: Could not connect to MongoDB Atlas
```

**Solution:** Whitelist your IP address in MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Network Access → Add IP Address
3. Add current IP or `0.0.0.0/0`
4. Wait 1-2 minutes

See **MONGODB_ATLAS_SETUP.md** for detailed help.

### Check Database User
- User: `rutiktetare_db_user`
- Should have "Read and write to any database" permissions
- Check in MongoDB Atlas → Database Access

### Port Already in Use
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID>)
taskkill /PID <PID> /F
```

### Backend Won't Start
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

### Frontend Build Errors
```powershell
# Clear cache and reinstall
rm -r node_modules
npm install
```

---

## 📚 Documentation

- **README.md** - Project overview
- **SETUP.md** - Detailed setup with MongoDB install
- **FEATURES.md** - Complete feature list
- **ARCHITECTURE.md** - System design diagrams
- **CHECKLIST.md** - Requirements verification
- **PROJECT_SUMMARY.md** - Project summary

---

## 🎯 Test Accounts

After running `npm run seed`:

```
👔 Admin:
   Email: admin@campus.edu
   Password: admin123
   Can: Everything

👨‍🏫 Teacher:
   Email: teacher@campus.edu
   Password: teacher123
   Can: Create subjects, schedules, notices

📚 Student:
   Create via signup
   Can: View everything, chat, upload files
```

---

## 📁 Key Files

```
Campus hub/
├── backend/
│   ├── server.js        ← Main server
│   ├── seed.js          ← Create test users
│   ├── models/          ← Database schemas
│   ├── routes/          ← API endpoints
│   └── middleware/      ← Auth guards
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx      ← Main app
│   │   ├── pages/       ← All pages
│   │   └── api.js       ← HTTP client
│   └── vite.config.js
│
└── Documentation files
```

---

## ⚡ Quick Commands

### Backend (in backend folder)
```powershell
npm install      # Install dependencies
npm run seed     # Create test users
npm run dev      # Start dev server
npm start        # Start production server
```

### Frontend (in frontend folder)
```powershell
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm run serve    # Preview production build
```

---

## 🔥 Features to Test

### As Teacher (teacher@campus.edu)
1. **Dashboard** - See welcome message and notification feed
2. **Schedule** - Create class schedule
3. **Subjects** - Add a new subject
4. **Notices** - Post an announcement
5. **Chat** - Send a message
6. **Uploads** - Upload a file
7. **Open second browser** - See real-time notifications!

### As Student (signup first)
1. **Dashboard** - View notifications
2. **Schedule** - View weekly timetable
3. **Subjects** - Browse subjects (cannot create)
4. **Notices** - Read announcements (cannot post)
5. **Chat** - Participate in chat
6. **Uploads** - Upload/download resources

---

## 🎊 Success Indicators

✅ Backend terminal shows: `Server running on port 5000`
✅ Backend terminal shows: `MongoDB connected successfully`
✅ Backend terminal shows seed success: `✅ Admin user created`, `✅ Teacher user created`
✅ Frontend terminal shows: `Local: http://localhost:5173/`
✅ Browser loads without errors
✅ Can login with test accounts
✅ Dashboard shows "Welcome" message
✅ Navigation menu visible
✅ Can create/view content based on role
✅ Real-time notifications appear

---

## 🆘 Need Help?

1. **IP Not Whitelisted?** → Check **MONGODB_ATLAS_SETUP.md**
2. **Connection Issues?** → Verify MongoDB Atlas cluster is active
3. **Seed Failed?** → Make sure IP is whitelisted first
4. Check browser console (F12) for errors
5. Check terminal output for error messages

---

## 🚀 You're Ready!

1. Whitelist IP in MongoDB Atlas ✅
2. Start Backend ✅
3. Start Frontend ✅
4. Open Browser ✅
5. Login & Test ✅

**Enjoy Campus Connect Portal!** 🎓

---

### 📝 Remember

- **MongoDB Atlas** is used (cloud database - no local install needed)
- Whitelist your IP address first (most important step!)
- Backend must be running before frontend
- Default test accounts available after seed
- Both servers run simultaneously
- Check http://localhost:5173 in browser

**Have fun exploring all the features!** ✨
