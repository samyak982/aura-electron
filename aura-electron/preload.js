const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aura', {
  minimize:         ()    => ipcRenderer.send('window-minimize'),
  close:            ()    => ipcRenderer.send('window-close'),
  hide:             ()    => ipcRenderer.send('window-hide'),
  setOpacity:       (v)   => ipcRenderer.send('set-opacity', v),
  toggleProtection: ()    => ipcRenderer.send('toggle-protection'),
  getStatus:        ()    => ipcRenderer.invoke('get-status'),

  // Provider config (session-only, never saved to disk)
  setConfig:  (cfg)  => ipcRenderer.send('set-config', cfg),
  getConfig:  ()     => ipcRenderer.invoke('get-config'),

  // Universal AI call — all providers routed through Node (no CORS)
  callAI: (payload)  => ipcRenderer.invoke('call-ai', payload),

  // Screen capture
  captureScreenshot: (idx) => ipcRenderer.invoke('capture-screenshot', idx || 0),
  getScreenSources:  ()    => ipcRenderer.invoke('get-screen-sources'),

  onShortcut:         (cb) => ipcRenderer.on('shortcut',         (_, a, ...r) => cb(a, ...r)),
  onOpacityChange:    (cb) => ipcRenderer.on('opacityChange',    (_, v)       => cb(v)),
  onProtectionStatus: (cb) => ipcRenderer.on('protectionStatus', (_, s)       => cb(s)),

  platform: process.platform,
});
