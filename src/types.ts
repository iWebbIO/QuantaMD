export type Theme = 'light' | 'dark' | 'amoled';
export type FileType = 'Tasks' | 'md' | 'Board';

export interface WorkspaceFile {
  id: string;
  name: string;
  type: FileType;
  content: string; // Used for md primarily, but can be a JSON string for Tasks and Board
  createdAt: number;
  updatedAt: number;
}

// For .Tasks files
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
}

// For .Board files
export type BoardItemType = 'memo' | 'link' | 'repo';
export interface BoardItem {
  id: string;
  type: BoardItemType;
  title: string;
  content?: string;
  url?: string;
  tags?: string[];
}
