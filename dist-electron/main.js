var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var fs = __toESM(require("fs"), 1);
var mainWindow = null;
var SETTINGS_PATH = path.join(import_electron.app.getPath("userData"), "settings.json");
var DEFAULT_SETTINGS = {
  geminiApiKey: "",
  defaultVaultPath: "",
  theme: "dark",
  fontFamily: "system-ui",
  fontSize: 14
};
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return DEFAULT_SETTINGS;
}
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    // frameless window
    backgroundColor: "#1c1c1e",
    // match dark theme initially
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron.app.quit();
});
import_electron.ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});
import_electron.ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
import_electron.ipcMain.on("window:close", () => {
  mainWindow?.close();
});
import_electron.ipcMain.handle("window:isMaximized", () => {
  return mainWindow?.isMaximized() || false;
});
import_electron.ipcMain.handle("settings:get", () => {
  return loadSettings();
});
import_electron.ipcMain.handle("settings:save", (event, settings) => {
  saveSettings(settings);
  return true;
});
function scanDir(dirPath) {
  const result = [];
  try {
    const list = fs.readdirSync(dirPath);
    for (const item of list) {
      if (item.startsWith(".") || item === "node_modules") continue;
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      const isDirectory = stat.isDirectory();
      let type = void 0;
      if (isDirectory) {
        type = "folder";
      } else if (item.endsWith(".md")) {
        type = "md";
      } else if (item.endsWith(".tasks")) {
        type = "Tasks";
      } else if (item.endsWith(".board")) {
        type = "Board";
      } else {
        continue;
      }
      const entry = {
        name: isDirectory ? item : item.replace(/\.(md|tasks|board)$/, ""),
        path: fullPath,
        isDirectory,
        type
      };
      if (isDirectory) {
        entry.children = scanDir(fullPath);
      }
      result.push(entry);
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}
import_electron.ipcMain.handle("fs:openDirectory", async () => {
  if (!mainWindow) return null;
  const result = await import_electron.dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const dirPath = result.filePaths[0];
  const files = scanDir(dirPath);
  return { path: dirPath, files };
});
import_electron.ipcMain.handle("fs:readDirectory", (event, dirPath) => {
  return scanDir(dirPath);
});
import_electron.ipcMain.handle("fs:readFile", (event, filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:writeFile", (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:createFile", (event, parentPath, name, type) => {
  try {
    const ext = type === "md" ? ".md" : type === "Tasks" ? ".tasks" : ".board";
    const cleanName = name.endsWith(ext) ? name : name + ext;
    const filePath = path.join(parentPath, cleanName);
    let content = "";
    if (type === "md") {
      content = `# ${name}

`;
    } else if (type === "Tasks") {
      content = "[]";
    } else if (type === "Board") {
      content = "[]";
    }
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  } catch (error) {
    console.error(`Failed to create file:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:createDirectory", (event, parentPath, name) => {
  try {
    const dirPath = path.join(parentPath, name);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  } catch (error) {
    console.error(`Failed to create directory:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:deleteFile", (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:deleteDirectory", (event, dirPath) => {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Failed to delete directory ${dirPath}:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:renameEntry", (event, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error(`Failed to rename ${oldPath} to ${newPath}:`, error);
    throw error;
  }
});
import_electron.ipcMain.handle("fs:showInExplorer", (event, filePath) => {
  try {
    const { shell } = require("electron");
    shell.showItemInFolder(filePath);
    return true;
  } catch (error) {
    console.error("Failed to show in explorer:", error);
    return false;
  }
});
//# sourceMappingURL=main.js.map
