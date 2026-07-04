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
  showInExplorer: (filePath) => import_electron.ipcRenderer.invoke("fs:showInExplorer", filePath)
});
//# sourceMappingURL=preload.cjs.map
