const { contextBridge, ipcRenderer } = require('electron');
// Load saved data file into localStorage BEFORE the page starts (once per window)
try {
  if (location.protocol === 'file:' && !sessionStorage.getItem('pdr_file_loaded')) {
    sessionStorage.setItem('pdr_file_loaded', '1');
    const raw = ipcRenderer.sendSync('pdr-data-read');
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.localStorage) {
        localStorage.clear();
        for (const k of Object.keys(d.localStorage)) localStorage.setItem(k, d.localStorage[k]);
      }
    }
  }
} catch (e) {}
contextBridge.exposeInMainWorld('electronAPI', {
  // window.prompt() is not supported in Electron, so this gives a synchronous replacement
  promptSync: (message, def) => ipcRenderer.sendSync('pdr-prompt', { message, def }),
  saveData: (json) => ipcRenderer.send('pdr-data-save', json),
  saveDataSync: (json) => ipcRenderer.sendSync('pdr-data-save-sync', json),
  openDataDir: () => ipcRenderer.send('pdr-open-dir')
});
