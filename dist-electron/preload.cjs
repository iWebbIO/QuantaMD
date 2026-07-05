// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Window Control APIs
  minimize: () => import_electron.ipcRenderer.send("window:minimize"),
  maximize: () => import_electron.ipcRenderer.send("window:maximize"),
  close: () => import_electron.ipcRenderer.send("window:close"),
  isMaximized: () => import_electron.ipcRenderer.invoke("window:isMaximized"),
  // Settings APIs
  getSettings: () => import_electron.ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => import_electron.ipcRenderer.invoke("settings:save", settings),
  // File System APIs
  openDirectory: () => import_electron.ipcRenderer.invoke("fs:openDirectory"),
  readDirectory: (dirPath) => import_electron.ipcRenderer.invoke("fs:readDirectory", dirPath),
  readFile: (filePath) => import_electron.ipcRenderer.invoke("fs:readFile", filePath),
  writeFile: (filePath, content) => import_electron.ipcRenderer.invoke("fs:writeFile", filePath, content),
  createFile: (parentPath, name, type) => import_electron.ipcRenderer.invoke("fs:createFile", parentPath, name, type),
  createDirectory: (parentPath, name) => import_electron.ipcRenderer.invoke("fs:createDirectory", parentPath, name),
  deleteFile: (filePath) => import_electron.ipcRenderer.invoke("fs:deleteFile", filePath),
  deleteDirectory: (dirPath) => import_electron.ipcRenderer.invoke("fs:deleteDirectory", dirPath),
  renameEntry: (oldPath, newPath) => import_electron.ipcRenderer.invoke("fs:renameEntry", oldPath, newPath),
  showInExplorer: (filePath) => import_electron.ipcRenderer.invoke("fs:showInExplorer", filePath),
  // New v1.0 APIs
  searchFiles: (vaultPath, query, options) => import_electron.ipcRenderer.invoke("fs:searchFiles", vaultPath, query, options),
  moveToTrash: (filePath, isDirectory) => import_electron.ipcRenderer.invoke("fs:moveToTrash", filePath, isDirectory),
  restoreFromTrash: (trashEntry) => import_electron.ipcRenderer.invoke("fs:restoreFromTrash", trashEntry),
  listTrash: (vaultPath) => import_electron.ipcRenderer.invoke("fs:listTrash", vaultPath),
  emptyTrash: (vaultPath) => import_electron.ipcRenderer.invoke("fs:emptyTrash", vaultPath),
  permanentDeleteTrash: (trashPath) => import_electron.ipcRenderer.invoke("fs:permanentDeleteTrash", trashPath),
  createDailyNote: (vaultPath, date, template) => import_electron.ipcRenderer.invoke("fs:createDailyNote", vaultPath, date, template),
  onExternalFileChange: (callback) => {
    const handler = (_event, data) => callback(data);
    import_electron.ipcRenderer.on("fs:external-change", handler);
    return () => {
      import_electron.ipcRenderer.removeListener("fs:external-change", handler);
    };
  },
  exportPdf: () => import_electron.ipcRenderer.invoke("fs:exportPdf"),
  syncGit: (vaultPath) => import_electron.ipcRenderer.invoke("fs:syncGit", vaultPath)
});
//# sourceMappingURL=preload.cjs.map
