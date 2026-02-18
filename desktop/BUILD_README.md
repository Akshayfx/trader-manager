# ChartWise Desktop - Build Instructions

This guide explains how to build the ChartWise Trade Manager desktop application for Windows (.exe) and macOS (.dmg).

## Prerequisites

### All Platforms
- Node.js 18+ 
- npm or yarn

### Windows
- Windows 10/11
- Visual Studio Build Tools (for native modules)

### macOS
- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools

## Quick Build

### Option 1: Using the Build Script

```bash
# Build for all platforms (on current OS)
node build.js

# Build only for Windows
node build.js --win

# Build only for macOS
node build.js --mac

# Build for all platforms
node build.js --all
```

### Option 2: Using npm Scripts

```bash
# Install dependencies
npm install

# Build for Windows (.exe)
npm run build:win

# Build for macOS (.dmg)
npm run build:mac

# Build for Linux (.AppImage, .deb)
npm run build:linux
```

## Build Outputs

After building, the installers will be in the `dist/` directory:

### Windows
- `ChartWise Trade Manager Setup.exe` - NSIS installer
- `ChartWise Trade Manager.exe` - Portable version

### macOS
- `ChartWise Trade Manager.dmg` - DMG installer
- `ChartWise Trade Manager-mac.zip` - ZIP archive

### Linux
- `ChartWise Trade Manager.AppImage` - AppImage
- `chartwise-desktop.deb` - Debian package

## Installation

### Windows
1. Run `ChartWise Trade Manager Setup.exe`
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

### macOS
1. Open `ChartWise Trade Manager.dmg`
2. Drag the app to Applications folder
3. Launch from Applications

### Linux
```bash
# AppImage
chmod +x ChartWise\ Trade\ Manager.AppImage
./ChartWise\ Trade\ Manager.AppImage

# Debian package
sudo dpkg -i chartwise-desktop.deb
sudo apt-get install -f  # Fix dependencies if needed
```

## Development

```bash
# Run in development mode
npm run dev

# Run normally
npm start
```

## Troubleshooting

### Windows Build Issues
- Install Visual Studio Build Tools: `npm install --global windows-build-tools`
- Run PowerShell as Administrator

### macOS Build Issues
- Install Xcode Command Line Tools: `xcode-select --install`
- Sign the app for distribution (requires Apple Developer account)

### Linux Build Issues
- Install required packages:
  ```bash
  sudo apt-get install icnsutils graphicsmagick
  ```

## Code Signing (Optional)

### Windows
Set environment variables:
```bash
set WIN_CSC_LINK=path/to/certificate.p12
set WIN_CSC_KEY_PASSWORD=your-password
```

### macOS
Set environment variables:
```bash
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=your-apple-id
export APPLE_APP_SPECIFIC_PASSWORD=your-app-password
export TEAM_ID=your-team-id
```

## Auto-Update

The app supports auto-updates via electron-updater. Configure in `src/main.js`:

```javascript
const { autoUpdater } = require('electron-updater');
autoUpdater.checkForUpdatesAndNotify();
```

## Support

For build issues, contact: support@chartwise.app
