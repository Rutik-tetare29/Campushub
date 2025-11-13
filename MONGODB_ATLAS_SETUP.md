# MongoDB Atlas IP Whitelist Setup

## ⚠️ Current Issue
Your IP address is not whitelisted in MongoDB Atlas. You need to add your IP to the allowed list.

## 🔧 Quick Fix (5 minutes)

### Step 1: Go to MongoDB Atlas
1. Open: https://cloud.mongodb.com/
2. Login with your account

### Step 2: Navigate to Network Access
1. Click on **"Network Access"** in the left sidebar
2. (It's under the SECURITY section)

### Step 3: Add Your IP Address

**Option A: Allow Your Current IP (Recommended for Development)**
1. Click **"Add IP Address"** button
2. Click **"Add Current IP Address"**
3. It will auto-detect your IP
4. Click **"Confirm"**

**Option B: Allow All IPs (Easy but less secure)**
1. Click **"Add IP Address"** button
2. Enter: `0.0.0.0/0` in the IP Address field
3. Add comment: "Allow all IPs for development"
4. Click **"Confirm"**

### Step 4: Wait 1-2 Minutes
- Atlas needs a moment to apply the changes
- You'll see your IP in the list

### Step 5: Test Connection
```powershell
cd "C:\Users\rutik\Desktop\Campus hub\backend"
npm run seed
```

---

## ✅ After Whitelisting

You should see:
```
MongoDB connected
✅ Admin user created: admin@campus.edu / admin123
✅ Teacher user created: teacher@campus.edu / teacher123

🎉 Seed complete!
```

---

## 🚀 Then Start Your Servers

### Terminal 1 - Backend
```powershell
cd "C:\Users\rutik\Desktop\Campus hub\backend"
npm run dev
```

### Terminal 2 - Frontend (already running)
```powershell
cd "C:\Users\rutik\Desktop\Campus hub\frontend"
npm run dev
```

---

## 📝 Your MongoDB Atlas Connection

✅ Already configured in `.env`:
```
MONGO_URI=mongodb+srv://rutiktetare_db_user:TOfwalPtYDC38JDR@cluster0.dqsycif.mongodb.net/campus_connect
```

Database name: **campus_connect**

---

## 🔒 Security Note

For **development**: Allow all IPs (0.0.0.0/0) is fine
For **production**: Only whitelist specific IPs or use VPC peering

---

## 🆘 Still Having Issues?

### Check Database User
1. In MongoDB Atlas, go to **"Database Access"**
2. Verify user: `rutiktetare_db_user` exists
3. Password should be: `TOfwalPtYDC38JDR`
4. User should have **"Read and write to any database"** role

### Check Cluster Status
1. In MongoDB Atlas, go to **"Database"**
2. Make sure your cluster is not paused
3. Status should show **"Active"**

---

## ✨ Once Working

Your app will:
- ✅ Store all data in MongoDB Atlas (cloud)
- ✅ No need for local MongoDB installation
- ✅ Access from anywhere
- ✅ Automatic backups
- ✅ Free tier (512MB storage)

---

**Follow Step 1-5 above and you'll be ready in 5 minutes!** 🚀
