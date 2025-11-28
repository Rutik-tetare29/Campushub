# 🎥 Camera & Microphone Troubleshooting Guide

## ✅ Fixed Issues

The camera and microphone functionality has been improved with:

1. **Better Error Handling** - Detailed error messages for different failure scenarios
2. **Permission Checks** - Clear guidance when permissions are denied
3. **Fallback Support** - Automatic retry with lower quality if high quality fails
4. **Browser Compatibility** - Detection of unsupported browsers
5. **Device Validation** - Checks if camera/microphone devices exist
6. **Auto-play Fixes** - Handles browser auto-play restrictions

---

## 🔧 Common Issues & Solutions

### 1. ⚠️ Permission Denied

**Error:** "Camera/microphone permission denied"

**Solutions:**
- Click the **camera icon** in your browser's address bar
- Select "Always allow" for this site
- Click "Allow" when the browser prompts for permissions
- **Chrome:** chrome://settings/content/camera and chrome://settings/content/microphone
- **Firefox:** about:preferences#privacy → Permissions → Camera/Microphone
- **Edge:** edge://settings/content/camera and edge://settings/content/microphone

### 2. 🎥 No Camera or Microphone Found

**Error:** "No camera or microphone found"

**Solutions:**
- Check if your camera/microphone is properly connected
- Restart your browser
- Check Device Manager (Windows) or System Preferences (Mac)
- Try a different USB port
- Restart your computer
- Test in another application (e.g., Camera app on Windows)

### 3. 🔴 Device Already in Use

**Error:** "Camera/microphone is already in use by another application"

**Solutions:**
- Close other applications using camera/microphone:
  - Zoom, Microsoft Teams, Skype
  - Other browser tabs with video calls
  - Discord, Slack video calls
  - OBS, streaming software
- **Windows:** Open Task Manager → Find and close the app
- **Mac:** Activity Monitor → Force quit the app
- Restart your browser

### 4. 🌐 Browser Not Supported

**Error:** "Your browser does not support camera/microphone access"

**Solutions:**
- **Recommended Browsers:**
  - ✅ Google Chrome (latest version)
  - ✅ Mozilla Firefox (latest version)
  - ✅ Microsoft Edge (latest version)
  - ✅ Safari (macOS/iOS only)
- Update your browser to the latest version
- Avoid Internet Explorer (not supported)

### 5. 🔊 No Audio/Video Visible

**Camera light is on but no video showing:**

**Solutions:**
- Check if video is muted (camera off icon)
- Refresh the page (F5 or Ctrl+R)
- Clear browser cache and cookies
- Disable browser extensions that might block video
- Check if antivirus/firewall is blocking access

### 6. 🔐 HTTPS Required

**Some browsers require HTTPS for camera/microphone access**

**Solutions:**
- Access via HTTPS: `https://localhost:5173`
- Configure Vite for HTTPS (see below)
- For production, always use HTTPS

---

## 🎯 Step-by-Step Permission Guide

### Google Chrome

1. Click the **🔒 lock icon** or **camera icon** in the address bar
2. Find "Camera" and "Microphone" settings
3. Select **"Allow"** for both
4. Refresh the page

### Mozilla Firefox

1. Click the **camera icon** in the address bar
2. Click the **X** next to blocked permissions
3. Or click **"..."** → **Allow** for Camera and Microphone
4. Refresh the page

### Microsoft Edge

1. Click the **lock icon** in the address bar
2. Find permissions section
3. Set Camera and Microphone to **"Allow"**
4. Refresh the page

---

## 🛠️ Advanced Troubleshooting

### Test Camera/Microphone

Before using the app, test your devices:

1. **Windows:**
   - Settings → Privacy → Camera
   - Settings → Privacy → Microphone
   - Test in Camera app

2. **Mac:**
   - System Preferences → Security & Privacy → Camera
   - System Preferences → Security & Privacy → Microphone

3. **Online Test:**
   - Visit: https://webcammictest.com/

### Check Browser Console

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for error messages (red text)
4. Share errors with support if needed

### Clear Browser Data

1. **Chrome:** Settings → Privacy and security → Clear browsing data
2. Select **"Cached images and files"** and **"Cookies"**
3. Click **Clear data**
4. Restart browser

### Disable Browser Extensions

Some extensions block camera/microphone:

1. Go to browser extensions/add-ons
2. Disable ad blockers, privacy tools
3. Test again
4. Re-enable extensions one by one to find the culprit

---

## 🔒 Enable HTTPS (For Developers)

Some browsers require HTTPS for camera access. To enable HTTPS in development:

### Vite Configuration

1. Install `@vitejs/plugin-basic-ssl`:
```bash
cd frontend
npm install @vitejs/plugin-basic-ssl --save-dev
```

2. Update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    port: 5173
  }
})
```

3. Access via: `https://localhost:5173`

---

## 📱 Mobile Device Issues

### iOS (iPhone/iPad)

- Ensure iOS is updated to latest version
- Use Safari browser (best compatibility)
- Check Settings → Safari → Camera/Microphone
- Camera access only works in Safari, not in other browsers

### Android

- Update Chrome to latest version
- Check Settings → Apps → Chrome → Permissions
- Allow Camera and Microphone
- Clear Chrome cache if needed

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Browser is updated to latest version
- [ ] Camera and microphone are connected
- [ ] No other apps are using camera/microphone
- [ ] Browser permissions are set to "Allow"
- [ ] Camera light turns on when starting stream
- [ ] You can see yourself in the video preview
- [ ] Audio indicator shows when speaking
- [ ] Tested in a different browser (if issues persist)

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Restart your computer** - Solves most device issues
2. **Try a different device** - Test on laptop, phone, or tablet
3. **Update drivers** - Update camera/microphone drivers
4. **Check antivirus** - Temporarily disable antivirus/firewall
5. **Use a different browser** - Test in Chrome, Firefox, and Edge
6. **Contact support** - Share browser console errors

---

## 📝 Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| `NotAllowedError` | Permission denied | Allow in browser settings |
| `NotFoundError` | No device found | Connect camera/microphone |
| `NotReadableError` | Device in use | Close other apps |
| `OverconstrainedError` | Quality too high | Auto-reduced quality |
| `TypeError` | Browser unsupported | Use Chrome/Firefox/Edge |
| `AbortError` | Connection interrupted | Refresh and try again |

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Camera light turns on
- ✅ You see your video preview
- ✅ Audio meter shows levels when you speak
- ✅ "Stream started" success message appears
- ✅ Viewers can see your stream
- ✅ No error messages in browser console

---

## 💡 Best Practices

1. **Always use latest browsers** - Update Chrome, Firefox, or Edge
2. **Close unused tabs** - Free up system resources
3. **Test before going live** - Always test camera/microphone first
4. **Good lighting** - Position yourself facing a light source
5. **Stable internet** - Use wired connection when possible
6. **Quiet environment** - Minimize background noise

---

## 🔧 Developer Notes

### Implementation Details

The app now includes:

- **getUserMedia** with detailed constraints
- **Error handling** for all error types
- **Fallback support** - Retries with lower quality
- **Permission checks** before accessing devices
- **Auto-play handling** - Works with browser restrictions
- **Device validation** - Checks if devices exist
- **Browser detection** - Warns about unsupported browsers

### Code Features

```javascript
// High-quality stream attempt
await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

// Automatic fallback to lower quality
await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480 },
  audio: true
});
```

---

**Last Updated:** November 28, 2025
**Version:** 2.0

For more help, check the browser console (F12) for detailed error messages.
