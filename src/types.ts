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

// Search result from full-text search
export interface SearchResult {
  filePath: string;
  fileName: string;
  fileType: FileType;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

// Trash entry metadata
export interface TrashEntry {
  originalPath: string;
  trashPath: string;
  fileName: string;
  fileType?: FileType;
  deletedAt: number;
  isDirectory: boolean;
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
      // New v1.0 APIs
      searchFiles: (vaultPath: string, query: string, options: { regex?: boolean; caseSensitive?: boolean }) => Promise<SearchResult[]>;
      moveToTrash: (filePath: string, isDirectory: boolean) => Promise<boolean>;
      restoreFromTrash: (trashEntry: TrashEntry) => Promise<boolean>;
      listTrash: (vaultPath: string) => Promise<TrashEntry[]>;
      emptyTrash: (vaultPath: string) => Promise<boolean>;
      permanentDeleteTrash: (trashPath: string) => Promise<boolean>;
      createDailyNote: (vaultPath: string, date: string, template: string) => Promise<string>;
      onExternalFileChange: (callback: (event: { type: string; path: string }) => void) => () => void;
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
export type TaskPriority = 'none' | 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  subtasks?: SubTask[];
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
  aiEnabled: boolean;
  aiProvider: 'openai' | 'ollama' | 'lmstudio' | 'custom';
  aiEndpoint: string;
  aiModel: string;
  aiApiKey: string;
  defaultVaultPath: string;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  accentColor: string; // HSL string like "210 100% 50%"
  vimMode: boolean;
  dailyNoteTemplate: string;
  editorLineNumbers: boolean;
  editorWordWrap: boolean;
  editorTabSize: number;
}

// Tab for editor workspace
export interface WorkspaceTab {
  fileId: string; // path of the file
  name: string;
  type: FileType;
}
