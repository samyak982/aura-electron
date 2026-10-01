# Aura \E2\80\94 Invisible Live AI Assistant
### Electron wrapper with OS-level screen capture protection

---

## What makes this different from the HTML version

| Feature | HTML file | Electron app |
|---|---|---|
| Screen capture protection | \E2\9D\8C (CSS tricks only) | \E2\9C\85 **`setContentProtection(true)`** \E2\80\94 hidden from ALL recorders |
| Global shortcuts | \E2\9D\8C (window must be focused) | \E2\9C\85 Work even when window is hidden |
| System tray | \E2\9D\8C | \E2\9C\85 Lives in menu bar / tray |
| Native transparency | Limited | \E2\9C\85 True OS-level transparent window |
| macOS vibrancy blur | \E2\9D\8C | \E2\9C\85 Native frosted glass behind window |
| Windows 11 Acrylic | \E2\9D\8C | \E2\9C\85 Native acrylic material |
| Always on top (all spaces) | \E2\9D\8C | \E2\9C\85 Floats above fullscreen apps |
| Auto-hide on blur | \E2\9D\8C | \E2\9C\85 Disappears when you click away |

---

## Setup (takes ~2 minutes)

### Prerequisites
- **Node.js 18+** \E2\86\92 https://nodejs.org
- **npm** (comes with Node)

### Install & Run

```bash
# 1. Navigate to this folder
cd aura-electron

# 2. Install dependencies (only needed once)
npm install

# 3. Launch the app
npm start
```

### Build a distributable app

```bash
# macOS (.dmg for Intel + Apple Silicon)
npm run build:mac

# Windows (.exe installer)
npm run build:win

# Linux (.AppImage + .deb)
npm run build:linux

# All platforms at once
npm run build
```

Built files appear in the `dist/` folder.

---

## Keyboard Shortcuts

All shortcuts use **Alt** (Windows/Linux) or **Option** (macOS).
Global shortcuts work even when the window is hidden.

### Window & Visibility
| Shortcut | Action |
|---|---|
| `Alt+Space` | **Show / hide window** (global \E2\80\94 works anywhere) |
| `Alt+H` | Stealth mode \E2\80\94 6% opacity, hover to reveal |
| `Alt+G` | Ghost mode \E2\80\94 28% opacity, hover to 85% |
| `Alt+C` | Compact mode \E2\80\94 collapse to title bar only |
| `Alt+[` | Decrease opacity \E2\88\925% |
| `Alt+]` | Increase opacity +5% |

### Recording & Analysis
| Shortcut | Action |
|---|---|
| `Alt+M` | Toggle microphone / live transcription |
| `Alt+S` | Take screenshot (screen share) |
| `Alt+K` | Analyze transcript now |
| `Enter` | Send typed question |
| `Alt+Enter` | Analyze transcript + typed question together |

### AI Modes
| Shortcut | Mode |
|---|---|
| `Alt+1` | \F0\9F\8E\AF Interview \E2\80\94 real-time answer coaching |
| `Alt+2` | \F0\9F\93\8B Meeting \E2\80\94 summaries & action items |
| `Alt+3` | \F0\9F\92\BB Coding \E2\80\94 code help & explanations |
| `Alt+4` | \E2\9C\8D Writing \E2\80\94 text improvement |
| `Alt+5` | \F0\9F\A7\A0 General \E2\80\94 all-purpose assistant |

### Utilities
| Shortcut | Action |
|---|---|
| `Alt+A` | Toggle auto-analyze on/off |
| `Alt+L` | Copy last AI response to clipboard |
| `Alt+T` | Copy full transcript to clipboard |
| `Alt+Del` | Clear all transcript & responses |
| `Alt+/` | Show / hide keyboard shortcuts panel |
| `Esc` | Close overlay / exit modes |

---

## Screen Capture Protection

Aura uses Electron's [`setContentProtection(true)`](https://www.electronjs.org/docs/latest/api/browser-window#winsetcontentprotectionenable-macos-windows) API.

**What this blocks on each OS:**

- **macOS**: `screencapture`, `Screenshot.app`, QuickTime screen recording, Cmd+Shift+4/5, third-party tools (Cleanshot, etc.)
- **Windows**: `PrintScreen`, `Win+G` (Game Bar), OBS Studio, ShareX, Windows Snipping Tool, any `BitBlt`/`WGC` based capture
- **Linux**: Varies by compositor \E2\80\94 works with most Wayland compositors

**Toggle protection**: Click the `PROTECTED` badge in the title bar, or use the system tray menu.

> \E2\9A\A0\EF\B8\8F Note: Protection prevents the window content from appearing in screen captures but the window frame/outline may still be visible in some captures. For maximum stealth, combine with Stealth mode (Alt+H).

---

## System Tray

Right-click the tray icon (menu bar on macOS, system tray on Windows) for:
- Show/hide window
- Toggle always-on-top
- Toggle content protection
- Toggle auto-hide on blur
- Opacity presets (100% \E2\86\92 5%)
- Reload / Developer Tools / Quit

---

## Project Structure

```
aura-electron/
\E2\94\9C\E2\94\80\E2\94\80 main.js              \E2\86\90 Electron main process (window, tray, global shortcuts, IPC)
\E2\94\9C\E2\94\80\E2\94\80 preload.js           \E2\86\90 Secure IPC bridge (contextBridge)
\E2\94\9C\E2\94\80\E2\94\80 package.json         \E2\86\90 Dependencies & build config
\E2\94\9C\E2\94\80\E2\94\80 renderer/
\E2\94\82   \E2\94\94\E2\94\80\E2\94\80 index.html       \E2\86\90 Full Aura UI (glassmorphic, all features)
\E2\94\94\E2\94\80\E2\94\80 assets/
    \E2\94\94\E2\94\80\E2\94\80 entitlements.mac.plist  \E2\86\90 macOS permissions (mic, camera, network)
```

---

## Troubleshooting

**"Speech recognition not working"**
- Electron uses Chromium's speech API. Make sure you allowed microphone access when prompted.
- On macOS: System Preferences \E2\86\92 Security & Privacy \E2\86\92 Microphone \E2\86\92 enable for Aura

**"Screen share not working"**  
- On macOS: System Preferences \E2\86\92 Security & Privacy \E2\86\92 Screen Recording \E2\86\92 enable for Aura

**"Global shortcuts not working"**
- On macOS: System Preferences \E2\86\92 Security & Privacy \E2\86\92 Accessibility \E2\86\92 enable for Aura
- Some shortcuts may conflict with OS shortcuts \E2\80\94 you can edit `main.js` to change them

**"Window appears on screen captures"**
- Verify `setContentProtection(true)` is active: the `PROTECTED` badge in the title bar should be green
- Some VM environments or remote desktop tools bypass content protection

---

## Customization

Edit `main.js` to change:
- Default window size (line: `width:`, `height:`)
- Default opacity (line: `currentOpacity`)
- Global shortcut keys (the `shortcuts` array)
- Auto-hide on blur (line: `autoHideOnBlur`)

Edit `renderer/index.html` to change the UI, add features, or swap the AI model.
