# ChartWise Trade Manager

A professional trade management tool for MetaTrader 4/5 with desktop and mobile support.

## Features

- **Plan Trade**: Set SL/TP on chart with auto lot size calculation
- **Buy/Sell Execution**: Direct trade execution with calculated lot size
- **Smart Direction Detection**: Auto-detects trade direction based on SL position
- **Partial TP**: Price-based or pips-based partial take profit triggers
- **Custom Close**: Single click for default close, long press for presets
- **Auto BE**: Toggle with glow effect, long press for settings
- **Pip Counter**: Shows pips in profit/loss on MT4 chart (blue=profit, orange=loss)
- **Prop Firm Mode**: Daily loss limits, news blocking, risk management
- **News Monitoring**: Customizable currencies and impact levels

## Testing Guide

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MetaTrader 4 or 5** with DLL imports enabled
3. **npm** or **yarn**

### Desktop App Setup

```bash
# Navigate to desktop app directory
cd desktop

# Install dependencies
npm install

# Start development mode
npm run dev

# Or build for production
npm run build
```

### MT4/MT5 EA Setup

1. Download the EA from the app's Download tab
2. Copy `ChartWise_Manager.mq4` to `MQL4/Experts` folder
3. Restart MetaTrader
4. Drag the EA to your chart
5. Enable DLL imports when prompted

### Testing Features

#### 1. Plan Trade
1. Click "PLAN TRADE" button
2. Set SL line on MT4 chart (drag the red line)
3. App auto-detects direction (BUY if SL below price, SELL if above)
4. Lot size calculates automatically
5. Click "OPEN TRADE" or use Buy/Sell buttons

#### 2. Buy/Sell Buttons
- Click SELL (red) or BUY (green) button
- Executes trade with calculated lot size
- Shows lot size in the center display

#### 3. Partial TP
- **Single Click**: Toggle PTP on/off with default settings
- **Long Press** (hold 800ms): Open PTP settings modal
- Choose Pips or Price mode
- Set levels and percentages

#### 4. Custom Close
- **Single Click**: Close default % (set in settings)
- **Long Press**: Open quick presets modal

#### 5. Auto BE
- **Single Click**: Toggle on/off (glows when active)
- **Long Press**: Open Auto BE settings

#### 6. Pip Counter on MT4
- Appears at top-right corner when in a trade
- Blue = Profit, Orange = Loss
- Shows direction, lot size, and pips

### Troubleshooting

#### Long Press Not Working
- Make sure you're holding the button for at least 800ms
- Check browser console for errors
- Try using mouse instead of touch

#### MT4 Not Connecting
- Verify Magic Key matches in both app and EA
- Check that DLL imports are enabled
- Ensure port 3001 is not blocked by firewall

#### Lot Size Not Calculating
- Verify SL is set on chart
- Check account balance is loaded
- Ensure symbol is supported (forex, gold, crypto)

## Project Structure

```
chartwise/
├── desktop/           # Electron desktop app
│   ├── src/
│   │   ├── main/     # Main process
│   │   ├── preload/  # Preload scripts
│   │   └── renderer/ # UI (HTML, CSS, JS)
│   └── package.json
├── mobile/           # React Native Android app
│   └── (coming soon)
├── mt4/              # MT4 Expert Advisor
│   └── ChartWise_Manager.mq4
├── mt5/              # MT5 Expert Advisor
│   └── ChartWise_Manager.mq5
└── server/           # Backend server
    └── server.js
```

## Android App Development

The Android app is built with React Native and shares the same backend as the desktop app.

### Setup

```bash
cd mobile
npm install
npx react-native run-android
```

### Features (Same as Desktop)

- All trading buttons (Plan Trade, Buy/Sell, Partial TP, etc.)
- Long press support
- News monitoring
- Settings sync with desktop
- MT4/MT5 connection via WebSocket

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/user/settings` - Get user settings
- `POST /api/user/settings` - Save user settings
- `WS /` - WebSocket for real-time communication

## License

MIT License - See LICENSE file for details
