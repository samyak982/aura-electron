# Aura — Invisible Live AI Assistant
### Electron wrapper with OS-level screen capture protection

---

## What makes this different from the HTML version

| Feature | HTML file | Electron app |
|---|---|---|
| Screen capture protection | ❌ (CSS tricks only) | ✅ **`setContentProtection(true)`** — hidden from ALL recorders |
| Global shortcuts | ❌ (window must be focused) | ✅ Work even when window is hidden |
| System tray | ❌ | ✅ Lives in menu bar / tray |
| Native transparency | Limited | ✅ True OS-level transparent window |
| macOS vibrancy blur | ❌ | ✅ Native frosted glass behind window |
| Windows 11 Acrylic | ❌ | ✅ Native acrylic material |
| Always on top (all spaces) | ❌ | ✅ Floats above fullscreen apps |
| Auto-hide on blur | ❌ | ✅ Disappears when you click away |

---

## Setup (takes ~2 minutes)

### Prerequisites
- **Node.js 18+** → https://nodejs.org
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
| `Alt+Space` | **Show / hide window** (global — works anywhere) |
| `Alt+H` | Stealth mode — 6% opacity, hover to reveal |
| `Alt+G` | Ghost mode — 28% opacity, hover to 85% |
| `Alt+C` | Compact mode — collapse to title bar only |
| `Alt+[` | Decrease opacity −5% |
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
| `Alt+1` | 🎯 Interview — real-time answer coaching |
| `Alt+2` | 📋 Meeting — summaries & action items |
| `Alt+3` | 💻 Coding — code help & explanations |
| `Alt+4` | ✍ Writing — text improvement |
| `Alt+5` | 🧠 General — all-purpose assistant |

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
- **Linux**: Varies by compositor — works with most Wayland compositors

**Toggle protection**: Click the `PROTECTED` badge in the title bar, or use the system tray menu.

> ⚠️ Note: Protection prevents the window content from appearing in screen captures but the window frame/outline may still be visible in some captures. For maximum stealth, combine with Stealth mode (Alt+H).

---

## System Tray

Right-click the tray icon (menu bar on macOS, system tray on Windows) for:
- Show/hide window
- Toggle always-on-top
- Toggle content protection
- Toggle auto-hide on blur
- Opacity presets (100% → 5%)
- Reload / Developer Tools / Quit

---

## Project Structure

```
aura-electron/
├── main.js              ← Electron main process (window, tray, global shortcuts, IPC)
├── preload.js           ← Secure IPC bridge (contextBridge)
├── package.json         ← Dependencies & build config
├── renderer/
│   └── index.html       ← Full Aura UI (glassmorphic, all features)
└── assets/
    └── entitlements.mac.plist  ← macOS permissions (mic, camera, network)
```

---

## Troubleshooting

**"Speech recognition not working"**
- Electron uses Chromium's speech API. Make sure you allowed microphone access when prompted.
- On macOS: System Preferences → Security & Privacy → Microphone → enable for Aura

**"Screen share not working"**  
- On macOS: System Preferences → Security & Privacy → Screen Recording → enable for Aura

**"Global shortcuts not working"**
- On macOS: System Preferences → Security & Privacy → Accessibility → enable for Aura
- Some shortcuts may conflict with OS shortcuts — you can edit `main.js` to change them

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
