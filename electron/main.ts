import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Settings path in user data folder
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

// Interface for settings
interface AppSettings {
  geminiApiKey: string;
  defaultVaultPath: string;
  theme: string;
  fontFamily: string;
  fontSize: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  defaultVaultPath: '',
  theme: 'dark',
  fontFamily: 'system-ui',
  fontSize: 14
};

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // frameless window
    backgroundColor: '#1c1c1e', // match dark theme initially
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Control IPC Handlers
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() || false;
});

// Settings IPC Handlers
ipcMain.handle('settings:get', () => {
  return loadSettings();
});

ipcMain.handle('settings:save', (event, settings: AppSettings) => {
  saveSettings(settings);
  return true;
});

// File system interfaces
interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  type?: 'md' | 'Tasks' | 'Board' | 'folder';
  children?: FileEntry[];
}

// Recursively reads directory
function scanDir(dirPath: string): FileEntry[] {
  const result: FileEntry[] = [];
  try {
    const list = fs.readdirSync(dirPath);
    for (const item of list) {
      // Ignore hidden files and node_modules
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      const isDirectory = stat.isDirectory();
      
      let type: FileEntry['type'] = undefined;
      if (isDirectory) {
        type = 'folder';
      } else if (item.endsWith('.md')) {
        type = 'md';
      } else if (item.endsWith('.tasks')) {
        type = 'Tasks';
      } else if (item.endsWith('.board')) {
        type = 'Board';
      } else {
        // Skip other files for now (or treat them as plain text/skip)
        continue;
      }

      const entry: FileEntry = {
        name: isDirectory ? item : item.replace(/\.(md|tasks|board)$/, ''),
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
  
  // Sort folders first, then files alphabetically
  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

// File Explorer IPC Handlers
ipcMain.handle('fs:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const dirPath = result.filePaths[0];
  const files = scanDir(dirPath);
  return { path: dirPath, files };
});

ipcMain.handle('fs:readDirectory', (event, dirPath: string) => {
  return scanDir(dirPath);
});

ipcMain.handle('fs:readFile', (event, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', (event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error);
    throw error;
  }
});

ipcMain.handle('fs:createFile', (event, parentPath: string, name: string, type: 'md' | 'Tasks' | 'Board') => {
  try {
    const ext = type === 'md' ? '.md' : type === 'Tasks' ? '.tasks' : '.board';
    const cleanName = name.endsWith(ext) ? name : name + ext;
    const filePath = path.join(parentPath, cleanName);
    
    // Initial content
    let content = '';
    if (type === 'md') {
      content = `# ${name}\n\n`;
    } else if (type === 'Tasks') {
      content = '[]';
    } else if (type === 'Board') {
      content = '[]';
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  } catch (error) {
    console.error(`Failed to create file:`, error);
    throw error;
  }
});

ipcMain.handle('fs:createDirectory', (event, parentPath: string, name: string) => {
  try {
    const dirPath = path.join(parentPath, name);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  } catch (error) {
    console.error(`Failed to create directory:`, error);
    throw error;
  }
});

ipcMain.handle('fs:deleteFile', (event, filePath: string) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
});

ipcMain.handle('fs:deleteDirectory', (event, dirPath: string) => {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Failed to delete directory ${dirPath}:`, error);
    throw error;
  }
});

ipcMain.handle('fs:renameEntry', (event, oldPath: string, newPath: string) => {
  try {
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (error) {
    console.error(`Failed to rename ${oldPath} to ${newPath}:`, error);
    throw error;
  }
});

ipcMain.handle('fs:showInExplorer', (event, filePath: string) => {
  try {
    const { shell } = require('electron');
    shell.showItemInFolder(filePath);
    return true;
  } catch (error) {
    console.error('Failed to show in explorer:', error);
    return false;
  }
});
