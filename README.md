# JI-Intern Contact Directory PWA

This is the Progressive Web App (PWA) version of the JI-Intern Contact Directory, specifically configured for GitHub Pages deployment.

## 🚀 Quick Deploy to GitHub Pages

1. **Create a new repository** on GitHub
2. **Upload all files** from this folder to your repository
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (or master)
   - Folder: / (root)
4. **Wait for deployment** (usually takes a few minutes)

## 📱 PWA Features

- ✅ **Installable** - Add to home screen on mobile/desktop
- ✅ **Offline Support** - Works without internet connection
- ✅ **Responsive Design** - Works on all device sizes
- ✅ **Fast Loading** - Service worker caching
- ✅ **Native App Feel** - Standalone mode

## 🔧 PWA Configuration

The app includes:
- `manifest.json` - PWA configuration
- `sw.js` - Service worker for offline functionality
- Proper meta tags for mobile devices
- Apple touch icons for iOS

## 📁 Required Files

Make sure these files are in your repository root:
- `index.html` - Main app page
- `manifest.json` - PWA manifest
- `sw.js` - Service worker
- `styles.css` - App styling
- `app.js` - Main app logic
- `contacts-data.js` - Contact data
- `list.csv` - Contact list
- `csv-data.html` - CSV data page
- `icon.png` - App icon (512x512 recommended)
- `banner.png` - App banner image

## 🌐 GitHub Pages URL

Your PWA will be available at:
```
https://[username].github.io/[repository-name]/
```

## 📱 Testing PWA Features

1. **Install**: Look for the install button in your browser
2. **Offline**: Turn off internet and refresh the page
3. **Mobile**: Test on mobile device for native app experience

## 🐛 Troubleshooting

- **PWA not installing**: Check browser console for errors
- **Service worker not working**: Ensure HTTPS (GitHub Pages provides this)
- **Icons not showing**: Verify icon.png exists and is accessible

## 📝 Notes

- This PWA is configured for GitHub Pages with relative paths (`./`)
- Service worker automatically caches all necessary files
- App works offline after first visit
- Compatible with all modern browsers

## 🔄 Updates

When you update the app:
1. Update files in your repository
2. GitHub Pages will automatically redeploy
3. Users will get update notifications
4. Service worker will cache new versions
