const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('quit-app'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  saveNotesToFile: (notes) => ipcRenderer.invoke('save-notes-to-file', notes),
  loadNotesFromFile: () => ipcRenderer.invoke('load-notes-from-file')
});
