# Campus Hub - Environment Setup Guide

## Backend Configuration

### 1. MongoDB Setup
Create a MongoDB database (local or Atlas) and get the connection string.

### 2. Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campushub
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campushub?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Nodemailer - Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=Campus Hub <noreply@campushub.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar API (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/google/callback

# Web Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@campushub.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Generate VAPID Keys for Push Notifications
Run this command in the backend directory:
```bash
npx web-push generate-vapid-keys
```
Copy the generated keys to your `.env` file.

### 4. Email Setup (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASSWORD` (not your regular password)

### 5. Twilio Setup (Optional - for SMS)
1. Sign up at https://www.twilio.com/
2. Get your Account SID, Auth Token, and phone number
3. Add credits to your account for testing

### 6. Google Calendar API Setup (Optional)
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs: `http://localhost:5000/api/calendar/google/callback`
6. Copy Client ID and Client Secret to `.env`

---

## Frontend Configuration

### 1. Environment Variables
Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000

# VAPID Public Key (same as backend)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

---

## Installation & Running

### Backend
```bash
cd backend
npm install
npm run dev
```

The backend server will start on http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

---

## First Time Setup

### 1. Create Admin User
After starting the backend, use a tool like Postman or cURL to create the first admin:

```bash
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

### 2. Update Admin Role in Database
If needed, manually update the user role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@campushub.com" },
  { $set: { role: "admin" } }
)
```

### 3. Create Sample Data
Log in as admin and create:
- Subjects
- Teachers
- Students
- Notices

---

## Testing Features

### 1. Assignments
- **Teacher**: Create assignment → Students receive notifications
- **Student**: View assignments → Submit → View grade

### 2. Attendance
- **Teacher**: Generate QR code → Display to students
- **Student**: Scan QR code → Mark attendance (within 10 minutes)
- Check geolocation (must be within 500m of teacher)

### 3. Grades
- **Teacher**: Enter grades → Calculate GPA automatically
- **Student**: View grades and GPA

### 4. Calendar
- Create events → Sync with Google Calendar (if configured)
- View calendar → Check conflicts

### 5. Chat Rooms
- Create rooms → Join rooms → Send messages (real-time via Socket.IO)

### 6. Analytics Dashboard
- **Admin/Teacher**: View statistics, charts, trends
- Export data to CSV

### 7. Push Notifications
- Allow notifications in browser
- Subscribe to push notifications
- Test by creating assignments/notices

### 8. PWA (Progressive Web App)
- Visit the app in Chrome/Edge
- Click "Install" icon in address bar
- Use app offline (cached assets)

---

## Production Deployment

### Environment Updates
1. Update all URLs to production domains
2. Use strong JWT_SECRET (min 32 characters)
3. Set NODE_ENV=production
4. Use secure SMTP provider (SendGrid, AWS SES)
5. Enable HTTPS for push notifications

### Database
- Use MongoDB Atlas or hosted MongoDB
- Enable authentication
- Set up backups

### Security
- Enable CORS for specific domains only
- Use rate limiting (already configured)
- Add helmet.js for security headers
- Validate all inputs (already configured)

### Performance
- Enable MongoDB indexes (check models)
- Use CDN for static assets
- Enable gzip compression
- Set up load balancing if needed

---

## Troubleshooting

### CORS Errors
- Check `FRONTEND_URL` in backend `.env`
- Ensure frontend is running on the correct port

### Push Notifications Not Working
- Ensure HTTPS in production (required for web push)
- Check VAPID keys match between frontend and backend
- Allow notifications in browser settings

### QR Code Scanning Issues
- Enable camera permissions
- Use HTTPS in production (camera requires secure context)
- Check geolocation permissions

### Socket.IO Connection Issues
- Check `VITE_WS_URL` in frontend `.env`
- Ensure backend Socket.IO is configured correctly
- Check firewall/network settings

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Use app password for Gmail (not regular password)
- Check email provider rate limits

---

## Support & Resources

- MongoDB Documentation: https://docs.mongodb.com/
- React Documentation: https://react.dev/
- Express Documentation: https://expressjs.com/
- Socket.IO Documentation: https://socket.io/docs/
- Material-UI Documentation: https://mui.com/
- Web Push Guide: https://web.dev/push-notifications/

---

## License
MIT License - Feel free to use this project for educational purposes.
