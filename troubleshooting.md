# 🔧 Troubleshooting Guide - Fixing 404 Errors

## 🚨 **404 Error When Starting New Page**

If you're getting a 404 error when starting a new page in your PWA, here's how to fix it:

### **Step 1: Test Navigation**
1. Open your PWA in the browser
2. Click the **"🧪 Test Navigation"** button in the data status section
3. Check the browser console (F12 → Console tab) for results
4. Look for any ❌ errors that indicate which files can't be accessed

### **Step 2: Common Causes & Fixes**

#### **❌ Problem: Files not found**
**Symptoms:** Console shows "❌ filename: Failed to fetch"
**Fix:** Make sure all files are uploaded to GitHub in the correct folder structure

#### **❌ Problem: Wrong file paths**
**Symptoms:** Console shows "❌ ./filename: 404 Not Found"
**Fix:** Check that all file references use `./` (relative paths)

#### **❌ Problem: Service Worker cache issues**
**Symptoms:** PWA works offline but not online, or vice versa
**Fix:** Clear browser cache and reload, or update service worker version

#### **❌ Problem: GitHub Pages not serving files**
**Symptoms:** Files accessible locally but not on GitHub Pages
**Fix:** Check GitHub Pages settings and ensure files are in the correct branch

### **Step 3: File Structure Check**

Your `github-pwa` folder should contain:
```
github-pwa/
├── index.html          ← Main page
├── app.js             ← App logic
├── styles.css         ← Styling
├── contacts-data.js   ← Contact data
├── manifest.json      ← PWA manifest
├── sw.js             ← Service worker
├── icon.png          ← App icon
├── banner.png        ← Banner image
├── list.csv          ← CSV data
└── csv-data.html     ← CSV fallback
```

### **Step 4: Browser Console Check**

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Look for errors:**
   - Red error messages
   - Failed network requests
   - JavaScript errors

### **Step 5: Network Tab Check**

1. **Go to Network tab** in Developer Tools
2. **Reload the page**
3. **Look for:**
   - Failed requests (red)
   - 404 status codes
   - Missing files

### **Step 6: Quick Fixes**

#### **Clear Browser Cache:**
- **Chrome:** Ctrl+Shift+Delete → Clear browsing data
- **Firefox:** Ctrl+Shift+Delete → Clear data
- **Safari:** Cmd+Option+E → Empty caches

#### **Update Service Worker:**
- Change `CACHE_NAME` in `sw.js` to a new version
- Reload the page
- Accept the update prompt

#### **Check File Permissions:**
- Ensure all files are readable
- Check GitHub repository settings
- Verify GitHub Pages is enabled

### **Step 7: Test Results**

After running the navigation test, you should see:
```
✅ ./index.html: 200 OK
✅ ./app.js: 200 OK
✅ ./styles.css: 200 OK
✅ ./contacts-data.js: 200 OK
✅ ./manifest.json: 200 OK
✅ ./icon.png: 200 OK
✅ Service Worker registered: [scope]
✅ PWA is controlled by Service Worker
```

### **🚨 Still Getting 404 Errors?**

If you're still experiencing issues:

1. **Check the console output** from the test button
2. **Verify all files are uploaded** to GitHub
3. **Ensure GitHub Pages is enabled** in repository settings
4. **Check the repository URL** matches your GitHub Pages URL
5. **Try accessing files directly** by typing the full URL

### **📱 Mobile/Android Specific Issues**

- **Clear app cache** in Android settings
- **Uninstall and reinstall** the PWA
- **Check if HTTPS is required** (GitHub Pages provides this)
- **Verify manifest.json** has correct icon paths

### **🔗 Need More Help?**

If the troubleshooting doesn't resolve your issue:
1. **Copy the console output** from the test button
2. **Check the Network tab** for failed requests
3. **Verify your GitHub Pages URL** is correct
4. **Ensure all files are in the main branch** of your repository

---

**Remember:** The 404 error usually means a file path is incorrect or a file is missing. The navigation test will help identify exactly which files are causing the problem.
