# Setup Guide - Campus Connect Portal

## Prerequisites

You are using **MongoDB Atlas (Cloud)** - No local installation needed! ✅

**Current Configuration:**
- MongoDB Atlas connection configured
- Database: `campus_connect`
- Connection string already in `.env` file

**⚠️ IMPORTANT:** You need to whitelist your IP address in MongoDB Atlas:
1. Go to https://cloud.mongodb.com/
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Click **"Add Current IP Address"** OR enter `0.0.0.0/0` to allow all IPs
5. Wait 1-2 minutes for changes to apply

See **MONGODB_ATLAS_SETUP.md** for detailed step-by-step instructions.

---

## Installation Steps

### 1. Install Backend Dependencies

```powershell
cd "C:\Users\rutik\Desktop\Campus hub\backend"
npm install
```

### 2. Configure Environment

```powershell
# Copy example env file
copy .env.example .env

# Edit .env file with your settings:
# - Update MONGO_URI if using MongoDB Atlas
# - Set a strong JWT_SECRET
```

### 3. Seed Database (Create Admin & Teacher Users)

```powershell
npm run seed
```

This creates:
- **Admin**: admin@campus.edu / admin123
- **Teacher**: teacher@campus.edu / teacher123

### 4. Start Backend Server

```powershell
npm run dev
```

Backend runs on http://localhost:5000

### 5. Install Frontend Dependencies

Open a NEW terminal:

```powershell
cd "C:\Users\rutik\Desktop\Campus hub\frontend"
npm install
```

### 6. Start Frontend Server

```powershell
npm run dev
```

Frontend runs on http://localhost:5173

## Quick Start Testing

1. **Open Browser**: http://localhost:5173

2. **Test as Student**:
   - Click "Signup"
   - Create account (default role: student)
   - Explore: Dashboard, Schedule, Subjects, Notices, Chat

3. **Test as Teacher**:
   - Login with: teacher@campus.edu / teacher123
   - You can now:
     - Create subjects
     - Create class schedules
     - Post notices
     - All features available to students

4. **Test as Admin**:
   - Login with: admin@campus.edu / admin123
   - Full access to:
     - All teacher features
     - Delete subjects/schedules
     - User management (future feature)

## Troubleshooting

### MongoDB Connection Error

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
```powershell
# Check if MongoDB is running
Get-Service -Name MongoDB

# If not running, start it
Start-Service -Name MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

### Frontend Can't Connect to Backend

**Solution**:
- Make sure backend is running on http://localhost:5000
- Check browser console for CORS errors
- Verify `.env` settings in backend

## Next Steps

Once everything is running:

1. ✅ Login as teacher/admin
2. ✅ Create some subjects (e.g., "Computer Science 101")
3. ✅ Create class schedules for the week
4. ✅ Post a notice
5. ✅ Open multiple browser tabs to see real-time notifications
6. ✅ Test chat functionality
7. ✅ Upload and download files

Enjoy your Campus Connect Portal! 🎓
