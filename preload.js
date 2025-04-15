// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded.'); // Log to confirm loading

// Expose a controlled API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Function renderer can call to request opening the file dialog
  openFile: () => ipcRenderer.invoke('dialog:openFile')
  // We can add more functions here later (e.g., for saving, etc.)
});