export type Theme = 'light' | 'dark' | 'amoled';
export type FileType = 'Tasks' | 'md' | 'Board';

// File Entry for explorer tree
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  type?: 'md' | 'Tasks' | 'Board' | 'folder';
  children?: FileEntry[];
}

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      openDirectory: () => Promise<{ path: string; files: FileEntry[] } | null>;
      readDirectory: (dirPath: string) => Promise<FileEntry[]>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      createFile: (parentPath: string, name: string, type: 'md' | 'Tasks' | 'Board') => Promise<string>;
      createDirectory: (parentPath: string, name: string) => Promise<string>;
      deleteFile: (filePath: string) => Promise<boolean>;
      deleteDirectory: (dirPath: string) => Promise<boolean>;
      renameEntry: (oldPath: string, newPath: string) => Promise<boolean>;
      showInExplorer: (filePath: string) => Promise<boolean>;
    };
  }
}

export interface WorkspaceFile {
  id: string; // will be file.path in Electron
  name: string;
  type: FileType;
  content: string;
  createdAt: number;
  updatedAt: number;
  path: string; // absolute path to the local file
}

// For .tasks files
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
}

// For .board files
export type BoardItemType = 'memo' | 'link' | 'repo';
export interface BoardItem {
  id: string;
  type: BoardItemType;
  title: string;
  content?: string;
  url?: string;
  tags?: string[];
}

// Electron settings
export interface AppSettings {
  geminiApiKey: string;
  defaultVaultPath: string;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
}

// Tab for editor workspace
export interface WorkspaceTab {
  fileId: string; // path of the file
  name: string;
  type: FileType;
}

