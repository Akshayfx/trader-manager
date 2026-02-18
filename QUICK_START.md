# ChartWise Trade Manager - Quick Start Guide

## 🎯 What You Have

You now have a complete full-stack trading automation platform:

1. **Desktop App** - Windows (.exe) & macOS (.dmg) installers
2. **Mobile Apps** - Android & iOS (React Native)
3. **Landing Page** - SEO-optimized website
4. **Backend API** - Node.js server with WebSocket
5. **MT4/MT5 EA** - Expert Advisors for terminal integration

---

## 🖥️ Desktop App - Build & Install

### Prerequisites
- Node.js 18+
- Windows: Visual Studio Build Tools
- macOS: Xcode Command Line Tools

### Build Instructions

```bash
# 1. Navigate to desktop directory
cd /mnt/okcomputer/output/chartwise/desktop

# 2. Install dependencies
npm install

# 3. Build for your platform

# Windows (.exe installer)
npm run build:win
# Output: dist/ChartWise Trade Manager Setup.exe

# macOS (.dmg installer) - requires macOS
npm run build:mac
# Output: dist/ChartWise Trade Manager.dmg

# Linux (.AppImage)
npm run build:linux
# Output: dist/ChartWise Trade Manager.AppImage
```

### Installation

**Windows:**
1. Run `ChartWise Trade Manager Setup.exe`
2. Follow installation wizard
3. Launch from Start Menu

**macOS:**
1. Open `ChartWise Trade Manager.dmg`
2. Drag app to Applications folder
3. Launch from Applications

**Linux:**
```bash
chmod +x ChartWise\ Trade\ Manager.AppImage
./ChartWise\ Trade\ Manager.AppImage
```

---

## 📱 Mobile Apps - Build & Run

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS - macOS only)

### Setup

```bash
# 1. Navigate to mobile directory
cd /mnt/okcomputer/output/chartwise/mobile

# 2. Install dependencies
npm install

# 3. Install CocoaPods (iOS only)
cd ios && pod install && cd ..
```

### Run Development

```bash
# Android
npx react-native run-android

# iOS (macOS only)
npx react-native run-ios
```

### Build Release

```bash
# Android APK
npx react-native build-android --mode=release

# Android App Bundle (for Play Store)
cd android
./gradlew bundleRelease

# iOS Archive (for App Store)
npx react-native build-ios --mode=release
```

---

## 🌐 Landing Page - Deploy

### Local Testing
```bash
# Simply open in browser
cd /mnt/okcomputer/output/chartwise/landing
open index.html  # macOS
start index.html # Windows
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /mnt/okcomputer/output/chartwise/landing
vercel
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd /mnt/okcomputer/output/chartwise/landing
netlify deploy --prod
```

---

## 🔧 Backend - Setup & Run

```bash
# 1. Navigate to backend
cd /mnt/okcomputer/output/chartwise/backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your settings

# 4. Start server
npm start

# Server runs on http://localhost:3001
```

---

## 📊 Data Collection Setup

### Firebase Configuration

1. Create Firebase project at https://console.firebase.google.com
2. Add Android & iOS apps
3. Download config files:
   - Android: `google-services.json` → `/mobile/android/app/`
   - iOS: `GoogleService-Info.plist` → `/mobile/ios/`
4. Enable Analytics & Crashlytics

### Environment Variables

Create `.env` files:

**Mobile (`/mobile/.env`):**
```
API_URL=https://api.chartwise.app
FIREBASE_API_KEY=your_key
```

**Desktop (`/desktop/.env`):**
```
API_URL=https://api.chartwise.app
WS_URL=wss://api.chartwise.app
```

---

## 🎨 Customization

### Change App Name
1. Edit `package.json` in each project
2. Update `productName` field

### Change Colors
1. Edit theme files:
   - Desktop: `/desktop/src/renderer/styles.css`
   - Mobile: `/mobile/src/store/themeStore.ts`
   - Landing: `/landing/styles.css`

### Add Features
1. Mobile: Add screens in `/mobile/src/screens/`
2. Desktop: Edit `/desktop/src/renderer/app.js`
3. Backend: Add routes in `/backend/routes/`

---

## 🐛 Troubleshooting

### Desktop Build Issues

**Windows:**
```bash
# Install build tools
npm install --global windows-build-tools

# Run as Administrator
```

**macOS:**
```bash
# Install Xcode tools
xcode-select --install

# Sign app for distribution (optional)
export CSC_LINK=path/to/cert.p12
export CSC_KEY_PASSWORD=your-password
```

### Mobile Build Issues

**Android:**
```bash
# Clean build
cd android
./gradlew clean
./gradlew assembleDebug
```

**iOS:**
```bash
# Clean Pods
cd ios
pod deintegrate
pod install
```

---

## 📈 Next Steps

1. **Test the apps** on your devices
2. **Set up Firebase** for analytics
3. **Configure backend** with your domain
4. **Deploy landing page** to hosting
5. **Submit mobile apps** to stores
6. **Share desktop installers** with users

---

## 💡 Tips

- Use `npm run dev` for development with hot reload
- Test on real devices before release
- Enable code signing for production builds
- Set up CI/CD for automated builds
- Monitor analytics to understand user behavior

---

## 📞 Need Help?

- Check `BUILD_README.md` for detailed build instructions
- See `IMPLEMENTATION_SUMMARY.md` for architecture details
- Review `MARKETING_STRATEGY.md` for launch planning

---

**You're all set! Start building with ChartWise! 🚀**
