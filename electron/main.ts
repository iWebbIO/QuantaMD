import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

let mainWindow: BrowserWindow | null = null;
let watcher: any = null;

// Settings path in user data folder
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

// Interface for settings
interface AppSettings {
  geminiApiKey: string;
  defaultVaultPath: string;
  theme: string;
  fontFamily: string;
  fontSize: number;
  accentColor: string;
  vimMode: boolean;
  dailyNoteTemplate: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  defaultVaultPath: '',
  theme: 'dark',
  fontFamily: 'system-ui',
  fontSize: 14,
  accentColor: '210 100% 50%',
  vimMode: false,
  dailyNoteTemplate: '# {{date}}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n'
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
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
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
    stopWatcher();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopWatcher();
  if (process.platform !== 'darwin') app.quit();
});

// File Watcher
let watcherDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function startWatcher(dirPath: string) {
  stopWatcher();
  watcher = chokidar.watch(dirPath, {
    ignoreInitial: true,
    ignored: [/(^|[\\/])\../, /node_modules/],
    persistent: true
  });

  const sendChange = (eventType: string, filePath: string) => {
    if (watcherDebounceTimer) clearTimeout(watcherDebounceTimer);
    watcherDebounceTimer = setTimeout(() => {
      mainWindow?.webContents.send('fs:external-change', { type: eventType, path: filePath });
    }, 300);
  };

  watcher
    .on('add', (fp: string) => sendChange('add', fp))
    .on('change', (fp: string) => sendChange('change', fp))
    .on('unlink', (fp: string) => sendChange('unlink', fp))
    .on('addDir', (fp: string) => sendChange('addDir', fp))
    .on('unlinkDir', (fp: string) => sendChange('unlinkDir', fp));
}

function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (watcherDebounceTimer) {
    clearTimeout(watcherDebounceTimer);
    watcherDebounceTimer = null;
  }
}

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
      if (item.startsWith('.') || item === 'node_modules' || item === '.trash' || item === '.quantamd') continue;
      
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
  stopWatcher();
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const dirPath = result.filePaths[0];
  const files = scanDir(dirPath);
  startWatcher(dirPath);
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
    shell.showItemInFolder(filePath);
    return true;
  } catch (error) {
    console.error('Failed to show in explorer:', error);
    return false;
  }
});

// File Watcher IPC Handlers
ipcMain.handle('fs:startWatcher', (event, dirPath: string) => {
  startWatcher(dirPath);
  return true;
});

ipcMain.handle('fs:stopWatcher', () => {
  stopWatcher();
  return true;
});

// Full-text Search IPC Handler
ipcMain.handle('fs:searchFiles', async (event, vaultPath: string, query: string, options: { regex?: boolean; caseSensitive?: boolean }) => {
  interface SearchResult {
    filePath: string;
    fileName: string;
    fileType: string;
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
  }

  const results: SearchResult[] = [];
  const MAX_RESULTS = 200;
  const supportedExtensions = ['.md', '.tasks', '.board'];

  function getFileType(ext: string): string {
    if (ext === '.md') return 'md';
    if (ext === '.tasks') return 'Tasks';
    if (ext === '.board') return 'Board';
    return 'md';
  }

  function searchInDir(dirPath: string) {
    if (results.length >= MAX_RESULTS) return;
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (results.length >= MAX_RESULTS) return;
        if (item.startsWith('.') || item === 'node_modules' || item === '.trash') continue;

        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          searchInDir(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (!supportedExtensions.includes(ext)) continue;

          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            let searchPattern: RegExp;
            if (options.regex) {
              try {
                searchPattern = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
              } catch {
                // Invalid regex, treat as literal
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                searchPattern = new RegExp(escaped, options.caseSensitive ? 'g' : 'gi');
              }
            } else {
              const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              searchPattern = new RegExp(escaped, options.caseSensitive ? 'g' : 'gi');
            }

            for (let i = 0; i < lines.length; i++) {
              if (results.length >= MAX_RESULTS) break;
              const line = lines[i];
              searchPattern.lastIndex = 0;
              const match = searchPattern.exec(line);
              if (match) {
                results.push({
                  filePath: fullPath,
                  fileName: item.replace(/\.(md|tasks|board)$/, ''),
                  fileType: getFileType(ext),
                  lineNumber: i + 1,
                  lineContent: line,
                  matchStart: match.index,
                  matchEnd: match.index + match[0].length
                });
              }
            }
          } catch (readErr) {
            console.error(`Failed to read file for search: ${fullPath}`, readErr);
          }
        }
      }
    } catch (dirErr) {
      console.error(`Failed to search directory: ${dirPath}`, dirErr);
    }
  }

  searchInDir(vaultPath);
  return results;
});

// Trash System IPC Handlers
ipcMain.handle('fs:moveToTrash', async (event, filePath: string, isDirectory: boolean) => {
  try {
    const vaultRoot = findVaultRoot(filePath);
    const trashDir = path.join(vaultRoot, '.trash');
    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }

    const baseName = path.basename(filePath);
    const timestamp = Date.now();
    const uniqueName = `${timestamp}_${baseName}`;
    const trashPath = path.join(trashDir, uniqueName);

    fs.renameSync(filePath, trashPath);

    const metaPath = path.join(trashDir, `${uniqueName}.meta.json`);
    const meta = {
      originalPath: filePath,
      deletedAt: timestamp,
      isDirectory,
      fileName: baseName
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    return true;
  } catch (error) {
    console.error('Failed to move to trash:', error);
    throw error;
  }
});

ipcMain.handle('fs:restoreFromTrash', async (event, trashEntry: { originalPath: string; trashPath: string }) => {
  try {
    const parentDir = path.dirname(trashEntry.originalPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.renameSync(trashEntry.trashPath, trashEntry.originalPath);

    const metaPath = trashEntry.trashPath + '.meta.json';
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }

    return true;
  } catch (error) {
    console.error('Failed to restore from trash:', error);
    throw error;
  }
});

ipcMain.handle('fs:listTrash', async (event, vaultPath: string) => {
  try {
    const trashDir = path.join(vaultPath, '.trash');
    if (!fs.existsSync(trashDir)) {
      return [];
    }

    const items = fs.readdirSync(trashDir);
    const entries: any[] = [];

    for (const item of items) {
      if (!item.endsWith('.meta.json')) continue;
      try {
        const metaPath = path.join(trashDir, item);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const trashFileName = item.replace('.meta.json', '');
        entries.push({
          ...meta,
          trashPath: path.join(trashDir, trashFileName)
        });
      } catch (err) {
        console.error(`Failed to parse trash meta: ${item}`, err);
      }
    }

    return entries;
  } catch (error) {
    console.error('Failed to list trash:', error);
    return [];
  }
});

ipcMain.handle('fs:emptyTrash', async (event, vaultPath: string) => {
  try {
    const trashDir = path.join(vaultPath, '.trash');
    if (fs.existsSync(trashDir)) {
      fs.rmSync(trashDir, { recursive: true, force: true });
      fs.mkdirSync(trashDir, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to empty trash:', error);
    throw error;
  }
});

ipcMain.handle('fs:permanentDeleteTrash', async (event, trashPath: string) => {
  try {
    const stat = fs.statSync(trashPath);
    if (stat.isDirectory()) {
      fs.rmSync(trashPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(trashPath);
    }

    const metaPath = trashPath + '.meta.json';
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }

    return true;
  } catch (error) {
    console.error('Failed to permanently delete trash entry:', error);
    throw error;
  }
});

// Daily Notes IPC Handler
ipcMain.handle('fs:createDailyNote', async (event, vaultPath: string, date: string, template: string) => {
  try {
    const dailyDir = path.join(vaultPath, 'daily');
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir, { recursive: true });
    }

    const filePath = path.join(dailyDir, `${date}.md`);

    // If file already exists, return its path without overwriting
    if (fs.existsSync(filePath)) {
      return filePath;
    }

    // Apply template substitution
    const dateObj = new Date(date + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dateObj.getDay()];
    const currentTime = new Date().toLocaleTimeString();

    let content = template
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{day\}\}/g, dayName)
      .replace(/\{\{time\}\}/g, currentTime);

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  } catch (error) {
    console.error('Failed to create daily note:', error);
    throw error;
  }
});

// Helper: find vault root by walking up from a file path
// Looks for the nearest directory that contains a .quantamd folder or is the stored vault path
function findVaultRoot(filePath: string): string {
  let dir = path.dirname(filePath);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.quantamd'))) {
      return dir;
    }
    // Check if .trash already exists at this level (vault root indicator)
    if (fs.existsSync(path.join(dir, '.trash'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Fallback: use the settings defaultVaultPath or the immediate parent
  const settings = loadSettings();
  if (settings.defaultVaultPath) {
    return settings.defaultVaultPath;
  }
  return path.dirname(filePath);
}
