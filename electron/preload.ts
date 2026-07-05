import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Window Control APIs
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),

  // File System APIs
  openDirectory: () => ipcRenderer.invoke('fs:openDirectory'),
  readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (parentPath: string, name: string, type: 'md' | 'Tasks' | 'Board') => 
    ipcRenderer.invoke('fs:createFile', parentPath, name, type),
  createDirectory: (parentPath: string, name: string) => 
    ipcRenderer.invoke('fs:createDirectory', parentPath, name),
  deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
  deleteDirectory: (dirPath: string) => ipcRenderer.invoke('fs:deleteDirectory', dirPath),
  renameEntry: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:renameEntry', oldPath, newPath),
  showInExplorer: (filePath: string) => ipcRenderer.invoke('fs:showInExplorer', filePath),

  // New v1.0 APIs
  searchFiles: (vaultPath: string, query: string, options: { regex?: boolean; caseSensitive?: boolean }) =>
    ipcRenderer.invoke('fs:searchFiles', vaultPath, query, options),
  moveToTrash: (filePath: string, isDirectory: boolean) =>
    ipcRenderer.invoke('fs:moveToTrash', filePath, isDirectory),
  restoreFromTrash: (trashEntry: any) =>
    ipcRenderer.invoke('fs:restoreFromTrash', trashEntry),
  listTrash: (vaultPath: string) =>
    ipcRenderer.invoke('fs:listTrash', vaultPath),
  emptyTrash: (vaultPath: string) =>
    ipcRenderer.invoke('fs:emptyTrash', vaultPath),
  permanentDeleteTrash: (trashPath: string) =>
    ipcRenderer.invoke('fs:permanentDeleteTrash', trashPath),
  createDailyNote: (vaultPath: string, date: string, template: string) =>
    ipcRenderer.invoke('fs:createDailyNote', vaultPath, date, template),
  onExternalFileChange: (callback: (event: { type: string; path: string }) => void) => {
    const handler = (_event: any, data: { type: string; path: string }) => callback(data);
    ipcRenderer.on('fs:external-change', handler);
    return () => { ipcRenderer.removeListener('fs:external-change', handler); };
  },
  exportPdf: () => ipcRenderer.invoke('fs:exportPdf'),
  syncGit: (vaultPath: string) => ipcRenderer.invoke('fs:syncGit', vaultPath)
});
