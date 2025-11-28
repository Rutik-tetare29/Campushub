# 🎥 Camera & Microphone Fix - Complete Guide

## ✅ What Was Fixed

I've implemented comprehensive fixes for camera and microphone issues:

1. **Enhanced error handling** with specific messages
2. **Automatic fallback** to lower quality if needed
3. **Better video element initialization**
4. **Detailed console logging** for debugging
5. **Video playback verification**
6. **Camera Test Page** for troubleshooting

---

## 🧪 TEST YOUR CAMERA FIRST!

### Step 1: Access the Camera Test Page

Visit: **http://localhost:5174/camera-test** (or whatever port Vite is using)

This dedicated test page will:
- ✅ Show if your camera/microphone are detected
- ✅ Display number of cameras and microphones found
- ✅ Test camera access without WebRTC complexity
- ✅ Show detailed error messages
- ✅ Log everything to browser console

### Step 2: Click "Start Camera"

- Browser will ask for permissions → Click **"Allow"**
- You should see your camera feed appear
- Check the status messages for any errors

### Step 3: Check Browser Console

Press **F12** to open Developer Tools and check:

```
✅ Available cameras: X
✅ Available microphones: X
✅ Stream obtained: MediaStream {...}
✅ Video tracks: [...]
✅ Video loaded: 1280 x 720
✅ Video is playing
```

If you see these messages, your camera is working! 🎉

---

## 🔧 Common Issues & Solutions

### Issue 1: Black Screen but "LIVE" Badge Shows

**Symptoms:**
- Stream appears to start (LIVE badge shows)
- Video area is black
- No camera feed visible

**Solutions:**

1. **Check Browser Console (F12):**
   - Look for error messages in red
   - Check if video dimensions show (should be: `1280 x 720` or similar)
   - Look for `Video is playing` message

2. **Verify Camera Access:**
   - Click the camera icon in browser address bar
   - Make sure Camera is set to "Allow"
   - Refresh the page after allowing

3. **Test with Camera Test Page:**
   - Go to `/camera-test` route
   - If it works there but not in chat room, it's a WebRTC/signaling issue
   - If it doesn't work there either, it's a camera/permissions issue

4. **Check Video Element:**
   - Open browser Developer Tools (F12)
   - Go to Elements/Inspector tab
   - Find the `<video>` element
   - Check if `srcObject` has a MediaStream
   - Right-click video element → Inspect properties

5. **Force Reload:**
   - Press **Ctrl + Shift + R** (hard reload)
   - Or **Ctrl + F5**
   - This clears cached JavaScript

### Issue 2: Permission Denied

**Error:** "Camera/microphone permission denied"

**Solutions:**

**Chrome:**
1. Click the **🔒 or 🎥** icon in address bar (left side)
2. Find Camera and Microphone settings
3. Select **"Allow"**
4. Reload page (F5)

**Firefox:**
1. Click the **🎥** icon in address bar
2. Remove the block (X button)
3. Or select **"Allow"** from dropdown
4. Reload page

**Edge:**
Same as Chrome

**Manual Settings:**
- Chrome: `chrome://settings/content/camera`
- Firefox: `about:preferences#privacy` → Permissions
- Edge: `edge://settings/content/camera`

### Issue 3: Device Not Found

**Error:** "No camera or microphone found"

**Solutions:**

1. **Check Device Manager (Windows):**
   - Press Win + X → Device Manager
   - Expand "Cameras" and "Audio inputs and outputs"
   - Look for your camera/microphone
   - If yellow exclamation mark → Update driver

2. **Check System Settings:**
   - Windows Settings → Privacy → Camera
   - Make sure "Allow apps to access your camera" is ON
   - Do the same for Microphone

3. **Test in Another App:**
   - Open Camera app (Windows)
   - Or try Zoom/Skype/Teams
   - If it doesn't work there, it's a system issue, not a browser issue

4. **Reconnect Device:**
   - Unplug USB camera/microphone
   - Wait 5 seconds
   - Plug back in
   - Try different USB port

### Issue 4: Already in Use

**Error:** "Camera/microphone is already in use"

**Solutions:**

1. **Close Other Apps:**
   - Zoom
   - Microsoft Teams
   - Skype
   - Discord
   - Any other video chat apps
   - Other browser tabs with camera access

2. **Check Task Manager:**
   - Press Ctrl + Shift + Esc
   - Look for apps using camera
   - End those tasks

3. **Restart Browser:**
   - Close ALL browser windows
   - Open Task Manager → End all browser processes
   - Restart browser

### Issue 5: Video Shows Then Turns Black

**Symptoms:**
- Camera works initially
- Then video goes black
- Or freezes

**Solutions:**

1. **Check Console for Errors:**
   - Press F12
   - Look for track stopped messages
   - Check if stream is still active

2. **Video Track Issue:**
   ```javascript
   // In console, check:
   stream.getVideoTracks()[0].enabled // Should be true
   stream.getVideoTracks()[0].readyState // Should be "live"
   ```

3. **Refresh Stream:**
   - End the stream
   - Start again
   - Check if it persists

---

## 🔍 Advanced Debugging

### Check Video Element in Console

Open browser console (F12) and run:

```javascript
// Get video element
const video = document.querySelector('video');

// Check if it has a stream
console.log('Has stream:', !!video.srcObject);

// Check stream tracks
if (video.srcObject) {
  console.log('Video tracks:', video.srcObject.getVideoTracks());
  console.log('Audio tracks:', video.srcObject.getAudioTracks());
  
  // Check if tracks are active
  video.srcObject.getTracks().forEach(track => {
    console.log(`${track.kind}: ${track.readyState} (${track.enabled ? 'enabled' : 'disabled'})`);
  });
}

// Check video dimensions
console.log('Video size:', video.videoWidth, 'x', video.videoHeight);

// Check if playing
console.log('Paused:', video.paused);
console.log('Ready state:', video.readyState);
```

### Expected Output:
```
Has stream: true
Video tracks: [MediaStreamTrack]
Audio tracks: [MediaStreamTrack]
video: live (enabled)
audio: live (enabled)
Video size: 1280 x 720
Paused: false
Ready state: 4
```

### List Available Devices

```javascript
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device => {
      console.log(device.kind, ':', device.label);
    });
  });
```

### Test Camera Directly

```javascript
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('✅ Camera access successful!');
    console.log('Stream ID:', stream.id);
    console.log('Tracks:', stream.getTracks());
    
    // Stop the stream
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ Camera access failed:', err.name, err.message);
  });
```

---

## 📋 Step-by-Step Testing Checklist

### Before Starting Stream:

- [ ] Camera is connected (check Device Manager)
- [ ] Browser has camera permissions (check address bar icon)
- [ ] No other apps are using camera (close Zoom, Teams, etc.)
- [ ] Browser is up to date
- [ ] Try the Camera Test page first (`/camera-test`)

### When Starting Stream:

- [ ] Click "Go Live" button
- [ ] Browser prompts for permissions → Click "Allow"
- [ ] See "Requesting camera and microphone access..." message
- [ ] Success message: "Live stream started! 🎥"
- [ ] Video appears (not black screen)
- [ ] Can see yourself in the video
- [ ] Audio meter/indicator shows activity when speaking

### Check Console:

- [ ] No red error messages
- [ ] See "✅ Stream acquired with tracks: video: ... audio: ..."
- [ ] See "Setting video srcObject..."
- [ ] See "✅ Local video playing successfully"
- [ ] See "Video loaded: 1280 x 720" (or similar)
- [ ] See "✅ Video is playing!"

### If Black Screen:

- [ ] Check console for errors
- [ ] Run video element debugging code (see above)
- [ ] Test on Camera Test page
- [ ] Try in incognito/private mode
- [ ] Try different browser

---

## 🌐 Browser-Specific Notes

### Chrome (Recommended ✅)
- Best compatibility
- Clear error messages
- Works with all features

### Firefox (Recommended ✅)
- Good compatibility
- May need to allow permissions twice
- Check `about:preferences#privacy`

### Edge (Recommended ✅)
- Similar to Chrome
- Good compatibility

### Safari (Mac/iOS)
- Works but more restrictive
- Requires HTTPS in production
- iOS: Only works in Safari, not other browsers

### Not Supported:
- ❌ Internet Explorer
- ❌ Older browser versions

---

## 🎯 Quick Test Commands

Copy and paste these in browser console (F12) for quick testing:

### 1. Check if camera is accessible:
```javascript
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(s => { console.log('✅ Camera works!', s.getTracks()); s.getTracks().forEach(t => t.stop()); })
  .catch(e => console.error('❌ Failed:', e.name));
```

### 2. List devices:
```javascript
navigator.mediaDevices.enumerateDevices()
  .then(d => console.log(d.filter(x => x.kind.includes('video') || x.kind.includes('audio'))));
```

### 3. Check video element:
```javascript
const v = document.querySelector('video');
console.log('Has stream:', !!v.srcObject, 'Size:', v.videoWidth+'x'+v.videoHeight, 'Playing:', !v.paused);
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Camera Test page shows your video
2. ✅ Console shows all green checkmarks (✅)
3. ✅ Video element has correct dimensions (not 0x0)
4. ✅ `video.srcObject` has MediaStream
5. ✅ `video.paused` is false
6. ✅ No red errors in console
7. ✅ Can see yourself in the video feed
8. ✅ "LIVE" badge shows and video is visible (not black)

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Test URL:** `/camera-test` - Does it work there?
2. **Console errors:** Copy all red errors and check them
3. **Try incognito mode:** Rules out extension issues
4. **Try different browser:** Chrome → Firefox → Edge
5. **Restart computer:** Fixes most hardware issues
6. **Update drivers:** Update camera drivers
7. **Check antivirus:** Temporarily disable antivirus
8. **Different device:** Test on another computer/phone

---

## 📞 Getting Help

When asking for help, provide:

1. **Browser & version** (e.g., Chrome 120)
2. **Operating system** (Windows 11, Mac, etc.)
3. **Error messages** from console (F12)
4. **Camera Test page result** - Does it work there?
5. **Screenshotof the black screen
6. **Console logs** when starting stream

---

**Last Updated:** November 28, 2025

**Version:** 3.0 - Major camera fix with test page

---

Good luck! The camera should now work properly. Start with the Camera Test page to verify your setup! 🎥✨
