const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Database operations
  dbQuery: (query, params) => ipcRenderer.invoke('db:query', query, params),
  dbRun: (query, params) => ipcRenderer.invoke('db:run', query, params),
  dbClear: () => ipcRenderer.invoke('db:clear'),
  initUserDb: (userId) => ipcRenderer.invoke('db:init-user', userId),

  // Storage and drive selection (local & cloud sync)
  getStorageConfig: () => ipcRenderer.invoke('storage:get-config'),
  setStorageDirectory: (newDir) => ipcRenderer.invoke('storage:set-directory', newDir),
  selectDirectory: () => ipcRenderer.invoke('storage:select-directory'),
  getAvailableDrives: () => ipcRenderer.invoke('storage:get-drives'),
  getCloudFolders: () => ipcRenderer.invoke('storage:get-cloud-folders'),
  openStorageFolder: () => ipcRenderer.invoke('storage:open-folder'),

  // Backup & Restore
  exportBackup: () => ipcRenderer.invoke('storage:export-backup'),
  importBackup: () => ipcRenderer.invoke('storage:import-backup'),

  // External shell
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // Secure Email via Node.js
  sendEmail: (payload) => ipcRenderer.invoke('email:send', payload),
  getEmailStatus: (customKey) => ipcRenderer.invoke('email:get-status', customKey),
});
