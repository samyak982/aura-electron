/**
 * Aura — Electron Main Process v2
 *
 * Fixes in this version:
 *  - skipTaskbar: true  → hidden from Windows taskbar
 *  - app.dock.hide()    → hidden from macOS dock
 *  - desktopCapturer    → real screen capture without user picker dialog
 *  - setDisplayMediaRequestHandler → auto-fulfills getDisplayMedia in renderer
 *  - 'capture-screenshot' IPC → direct high-res screenshot via NativeImage
 */

const {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  ipcMain,
  screen,
  nativeImage,
  desktopCapturer,
} = require('electron');
const path = require('path');

// ── Hide from dock/taskbar before window creation ────────────────────────────
// macOS: removes icon from dock entirely
if (process.platform === 'darwin') {
  app.dock.hide();
}

// ── State ────────────────────────────────────────────────────────────────────
let win = null;
let tray = null;
let isVisible = true;
let isAlwaysOnTop = true;
let isContentProtected = true;
let currentOpacity = 0.95;
let isDev = process.argv.includes('--dev');
let autoHideOnBlur = false;

// ── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Never quit on window-all-closed — live in tray
  // (on non-macOS, explicit quit from tray is the only exit)
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width:  Math.min(1280, width  - 40),
    height: Math.min(800,  height - 40),
    x: Math.floor((width  - Math.min(1280, width  - 40)) / 2),
    y: Math.floor((height - Math.min(800,  height - 40)) / 2),

    // ── Stealth ──
    skipTaskbar: true,          // ← hidden from Windows taskbar
    // macOS dock already hidden via app.dock.hide() above

    // ── Visual ──
    transparent: true,
    backgroundColor: '#00000000',
    vibrancy: 'under-window',          // macOS native blur
    visualEffectState: 'active',
    backgroundMaterial: 'acrylic',     // Windows 11 acrylic
    roundedCorners: true,

    // ── Frame ──
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },

    // ── Behaviour ──
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    minimizable: true,
    hasShadow: true,

    // ── Security ──
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  // ★ Hides window from ALL screen recorders & OS capture APIs
  win.setContentProtection(true);
  isContentProtected = true;

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Always-on-top across all spaces / virtual desktops
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // ── FIX: Auto-fulfill getDisplayMedia without picker dialog ──────────────
  // This intercepts navigator.mediaDevices.getDisplayMedia() in the renderer
  // and immediately grants access to the primary screen — no user dialog shown.
  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] })
      .then(sources => {
        if (sources.length > 0) {
          callback({ video: sources[0] });
        } else {
          callback({});
        }
      })
      .catch(() => callback({}));
  });

  win.on('blur', () => { if (autoHideOnBlur) hideWindow(); });
  win.on('closed', () => { win = null; });

  if (isDev) win.webContents.openDevTools({ mode: 'detach' });
}

// ── Show / Hide ───────────────────────────────────────────────────────────────
function showWindow() {
  if (!win) { createWindow(); return; }
  win.show();
  win.focus();
  win.setOpacity(currentOpacity);
  isVisible = true;
  updateTrayMenu();
}

function hideWindow() {
  if (!win) return;
  win.hide();
  isVisible = false;
  updateTrayMenu();
}

function toggleWindow() {
  isVisible ? hideWindow() : showWindow();
}

function sendToRenderer(channel, ...args) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, ...args);
}

// ── Global Shortcuts ──────────────────────────────────────────────────────────
function registerGlobalShortcuts() {
  const shortcuts = [
    { key: 'Alt+Space',  fn: toggleWindow },
    { key: 'Alt+M',      fn: () => sendToRenderer('shortcut', 'toggleMic') },
    { key: 'Alt+S',      fn: () => sendToRenderer('shortcut', 'screenshot') },
    { key: 'Alt+K',      fn: () => sendToRenderer('shortcut', 'analyzeNow') },
    { key: 'Alt+H',      fn: () => { sendToRenderer('shortcut', 'stealth'); toggleNativeOpacity(0.06); } },
    { key: 'Alt+G',      fn: () => { sendToRenderer('shortcut', 'ghost');   toggleNativeOpacity(0.28); } },
    { key: 'Alt+C',      fn: () => sendToRenderer('shortcut', 'compact') },
    { key: 'Alt+[',      fn: () => nudgeOpacity(-0.05) },
    { key: 'Alt+]',      fn: () => nudgeOpacity(+0.05) },
    { key: 'Alt+A',      fn: () => sendToRenderer('shortcut', 'toggleAuto') },
    { key: 'Alt+L',      fn: () => sendToRenderer('shortcut', 'copyLast') },
    { key: 'Alt+T',      fn: () => sendToRenderer('shortcut', 'copyTranscript') },
    { key: 'Alt+Delete', fn: () => sendToRenderer('shortcut', 'clear') },
    { key: 'Alt+/',      fn: () => sendToRenderer('shortcut', 'showKeys') },
    { key: 'Alt+1',      fn: () => sendToRenderer('shortcut', 'mode', 0) },
    { key: 'Alt+2',      fn: () => sendToRenderer('shortcut', 'mode', 1) },
    { key: 'Alt+3',      fn: () => sendToRenderer('shortcut', 'mode', 2) },
    { key: 'Alt+4',      fn: () => sendToRenderer('shortcut', 'mode', 3) },
    { key: 'Alt+5',      fn: () => sendToRenderer('shortcut', 'mode', 4) },
  ];

  shortcuts.forEach(({ key, fn }) => {
    try { globalShortcut.register(key, fn); }
    catch (e) { console.warn(`Shortcut ${key} failed:`, e.message); }
  });
}

// ── Opacity ───────────────────────────────────────────────────────────────────
function toggleNativeOpacity(target) {
  if (!win) return;
  const cur = win.getOpacity();
  if (Math.abs(cur - target) < 0.02) {
    win.setOpacity(currentOpacity);
  } else {
    currentOpacity = cur;
    win.setOpacity(target);
  }
  updateTrayMenu();
}

function nudgeOpacity(delta) {
  if (!win) return;
  const next = Math.min(1, Math.max(0.05, win.getOpacity() + delta));
  win.setOpacity(next);
  currentOpacity = next;
  sendToRenderer('opacityChange', Math.round(next * 100));
}

// ── IPC ───────────────────────────────────────────────────────────────────────
function setupIPC() {
  ipcMain.on('set-opacity', (_, value) => {
    if (!win) return;
    const v = Math.max(0.05, Math.min(1, value / 100));
    win.setOpacity(v);
    currentOpacity = v;
  });

  ipcMain.on('window-minimize', () => win?.minimize());
  ipcMain.on('window-close',    () => hideWindow());
  ipcMain.on('window-hide',     () => hideWindow());

  ipcMain.on('toggle-protection', () => {
    isContentProtected = !isContentProtected;
    win?.setContentProtection(isContentProtected);
    sendToRenderer('protectionStatus', isContentProtected);
    updateTrayMenu();
  });

  ipcMain.handle('get-status', () => ({
    contentProtected: isContentProtected,
    alwaysOnTop: isAlwaysOnTop,
    platform: process.platform,
    version: app.getVersion(),
  }));

  // ── FIX: Direct screenshot via desktopCapturer ────────────────────────────
  // Returns a high-res base64 PNG data URL of the primary screen.
  // Works without any user interaction or picker dialog.
  ipcMain.handle('capture-screenshot', async (_, monitorIndex = 0) => {
    try {
      const displays = screen.getAllDisplays();
      const display  = displays[monitorIndex] || displays[0];
      const { width, height } = display.size;

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height },
        fetchWindowIcons: false,
      });

      if (!sources || sources.length === 0) return null;

      // Match source to the correct display if multi-monitor
      const source = sources[monitorIndex] || sources[0];
      const dataURL = source.thumbnail.toDataURL();
      return dataURL; // full "data:image/png;base64,..." string
    } catch (err) {
      console.error('capture-screenshot error:', err);
      return null;
    }
  });

  // ── Universal AI call — Node.js side, no CORS, correct image format per provider ──
  ipcMain.handle('call-ai', async (_, { provider, apiKey, model, system, messages, max_tokens }) => {
    const https = require('https');
    const http  = require('http');

    // Raw HTTP/HTTPS POST helper
    function request(url, extraHeaders, bodyObj) {
      return new Promise((resolve, reject) => {
        const body = JSON.stringify(bodyObj);
        const u    = new URL(url);
        const mod  = u.protocol === 'https:' ? https : http;
        const opts = {
          hostname: u.hostname,
          port:     u.port || (u.protocol === 'https:' ? 443 : 80),
          path:     u.pathname + u.search,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(body),
            ...extraHeaders,
          },
        };
        const req = mod.request(opts, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try   { resolve(JSON.parse(d)); }
            catch { reject(new Error('Bad JSON (' + res.statusCode + '): ' + d.slice(0, 400))); }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
    }

    // Extract raw base64 string + text from the internal message format
    // messages = [{role:'user', content:[{type:'image',source:{data:'...'}},{type:'text',text:'...'}]}]
    function parseContent(msg) {
      const content = msg.content;
      if (!Array.isArray(content)) return { text: content || '', imageB64: null };
      let text = '', imageB64 = null;
      for (const part of content) {
        if (part.type === 'text')  text     = part.text || '';
        if (part.type === 'image') imageB64 = part.source?.data || null;
      }
      return { text, imageB64 };
    }

    function openAIresult(data) {
      if (data.error) return { error: data.error.message || JSON.stringify(data.error) };
      return { text: data.choices?.[0]?.message?.content || '' };
    }

    try {
      switch (provider) {

        // ── OLLAMA ─────────────────────────────────────────────────────────
        // Ollama /api/chat uses:
        //   text-only models  → { role, content: "string" }
        //   vision (llava)    → { role, content: "string", images: ["base64..."] }
        case 'ollama': {
          const isVision = (model || '').toLowerCase().includes('llava')
                        || (model || '').toLowerCase().includes('vision')
                        || (model || '').toLowerCase().includes('bakllava');

          const ollamaMsgs = [];
          if (system) ollamaMsgs.push({ role: 'system', content: system });

          for (const msg of messages) {
            const { text, imageB64 } = parseContent(msg);
            const entry = { role: msg.role, content: text };
            if (imageB64 && isVision) entry.images = [imageB64];  // ← key fix
            ollamaMsgs.push(entry);
          }

          const data = await request(
            'http://127.0.0.1:11434/api/chat',
            {},
            { model: model || 'llama3.2', messages: ollamaMsgs, stream: false,
              options: { num_predict: max_tokens || 1000 } }
          );
          if (data.error) return { error: String(data.error) };
          return { text: data.message?.content || '' };
        }

        // ── GROQ ───────────────────────────────────────────────────────────
        // Llama 4 Scout/Maverick support vision via OpenAI image_url format.
        // Older text-only models get a text notice instead.
        case 'groq': {
          const groqModel = model || 'meta-llama/llama-4-scout-17b-16e-instruct';
          const supportsVision = groqModel.includes('llama-4');

          const groqMsgs = [];
          if (system) groqMsgs.push({ role: 'system', content: system });

          for (const msg of messages) {
            const { text, imageB64 } = parseContent(msg);
            if (imageB64 && supportsVision) {
              // OpenAI vision format — Llama 4 Scout/Maverick accept this
              groqMsgs.push({
                role: msg.role,
                content: [
                  { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
                  { type: 'text', text },
                ],
              });
            } else {
              // Text-only fallback for older models
              const content = imageB64
                ? `[Screenshot shared — describe and analyze from context]\n\n${text}`
                : text;
              groqMsgs.push({ role: msg.role, content });
            }
          }

          const data = await request(
            'https://api.groq.com/openai/v1/chat/completions',
            { Authorization: `Bearer ${apiKey}` },
            { model: groqModel, messages: groqMsgs, max_tokens: max_tokens || 1000 }
          );
          return openAIresult(data);
        }

        // ── GEMINI ─────────────────────────────────────────────────────────
        // Gemini uses its own format with inlineData for images
        case 'gemini': {
          const contents = [];
          for (const msg of messages) {
            const { text, imageB64 } = parseContent(msg);
            const parts = [];
            if (imageB64) parts.push({ inlineData: { mimeType: 'image/png', data: imageB64 } });
            parts.push({ text });
            contents.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts,
            });
          }

          const gemModel = model || 'gemini-1.5-flash';
          const data = await request(
            `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${apiKey}`,
            {},
            {
              contents,
              systemInstruction: system ? { parts: [{ text: system }] } : undefined,
              generationConfig:  { maxOutputTokens: max_tokens || 1000 },
            }
          );
          if (data.error) return { error: data.error.message || JSON.stringify(data.error) };
          return { text: data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '' };
        }

        // ── OPENROUTER ─────────────────────────────────────────────────────
        // OpenRouter uses OpenAI format. Vision models use image_url content parts.
        case 'openrouter': {
          const orMsgs = [];
          if (system) orMsgs.push({ role: 'system', content: system });

          for (const msg of messages) {
            const { text, imageB64 } = parseContent(msg);
            if (imageB64) {
              // OpenAI vision format
              orMsgs.push({
                role: msg.role,
                content: [
                  { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
                  { type: 'text', text },
                ],
              });
            } else {
              orMsgs.push({ role: msg.role, content: text });
            }
          }

          const data = await request(
            'https://openrouter.ai/api/v1/chat/completions',
            { Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://github.com/aura-ai',
              'X-Title':      'Aura Live AI' },
            { model: model || 'meta-llama/llama-3.2-11b-vision-instruct:free',
              messages: orMsgs, max_tokens: max_tokens || 1000 }
          );
          return openAIresult(data);
        }

        default:
          return { error: `Unknown provider: ${provider}` };
      }
    } catch (err) {
      return { error: err.message };
    }
  });

  // Store / retrieve provider config in memory (session only)
  let _config = { provider: 'ollama', apiKey: '', model: '' };
  ipcMain.handle('get-config',  ()     => _config);
  ipcMain.on   ('set-config',   (_, c) => { _config = { ..._config, ...c }; });

  // List available screen sources (for multi-monitor picker if needed)
  ipcMain.handle('get-screen-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 },
      });
      return sources.map(s => ({
        id:        s.id,
        name:      s.name,
        thumbnail: s.thumbnail.toDataURL(),
      }));
    } catch (err) {
      return [];
    }
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Aura — Live AI (Alt+Space to show)');
  tray.on('click', toggleWindow);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: '● Aura — Live AI', enabled: false },
    { type: 'separator' },
    {
      label: isVisible ? '👁  Hide Window' : '👁  Show Window',
      accelerator: 'Alt+Space',
      click: toggleWindow,
    },
    {
      label: isAlwaysOnTop ? '📌 Always on Top: ON' : '📌 Always on Top: OFF',
      click: () => {
        isAlwaysOnTop = !isAlwaysOnTop;
        win?.setAlwaysOnTop(isAlwaysOnTop, 'screen-saver', 1);
        win?.setVisibleOnAllWorkspaces(isAlwaysOnTop, { visibleOnFullScreen: true });
        updateTrayMenu();
      },
    },
    {
      label: isContentProtected ? '🛡  Screen Protection: ON' : '🛡  Screen Protection: OFF',
      click: () => {
        isContentProtected = !isContentProtected;
        win?.setContentProtection(isContentProtected);
        updateTrayMenu();
      },
    },
    {
      label: autoHideOnBlur ? '🫥 Auto-hide on Blur: ON' : '🫥 Auto-hide on Blur: OFF',
      click: () => { autoHideOnBlur = !autoHideOnBlur; updateTrayMenu(); },
    },
    { type: 'separator' },
    { label: '🎙  Toggle Mic',    click: () => sendToRenderer('shortcut', 'toggleMic') },
    { label: '📸  Screenshot',    click: () => sendToRenderer('shortcut', 'screenshot') },
    { label: '⚡ Analyze Now',    click: () => sendToRenderer('shortcut', 'analyzeNow') },
    { type: 'separator' },
    {
      label: 'Opacity',
      submenu: [
        { label: '100%',           click: () => { win?.setOpacity(1);    currentOpacity=1;    sendToRenderer('opacityChange',100) } },
        { label: '80%',            click: () => { win?.setOpacity(0.8);  currentOpacity=0.8;  sendToRenderer('opacityChange',80)  } },
        { label: '60%',            click: () => { win?.setOpacity(0.6);  currentOpacity=0.6;  sendToRenderer('opacityChange',60)  } },
        { label: '40%',            click: () => { win?.setOpacity(0.4);  currentOpacity=0.4;  sendToRenderer('opacityChange',40)  } },
        { label: '20% — Ghost',    click: () => { win?.setOpacity(0.2);  currentOpacity=0.2;  sendToRenderer('opacityChange',20)  } },
        { label: '5%  — Stealth',  click: () => { win?.setOpacity(0.05); currentOpacity=0.05; sendToRenderer('opacityChange',5)   } },
      ],
    },
    { type: 'separator' },
    { label: '🔧 DevTools', click: () => win?.webContents.openDevTools({ mode:'detach' }), visible: isDev },
    { label: '↺  Reload',   click: () => win?.reload() },
    { type: 'separator' },
    { label: '✕  Quit Aura', click: () => { globalShortcut.unregisterAll(); app.exit(0); } },
  ]);
  tray.setContextMenu(menu);
}

// ── Tray icon (16×16 teal circle, inline base64) ──────────────────────────────
function createTrayIcon() {
  // Minimal 16×16 PNG: a teal circle on transparent background
  const size = 16;
  // Use nativeImage to create a programmatic icon
  const img = nativeImage.createEmpty();
  try {
    // Try to create from base64 embedded icon
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU5ErkJggg==';
    return nativeImage.createFromDataURL('data:image/png;base64,' + b64)
      .resize({ width: size, height: size });
  } catch {
    return nativeImage.createEmpty();
  }
}
