import { useState, useEffect, useCallback } from 'react';
import { WorkspaceFile, Theme } from './types';

const STORAGE_KEY = 'precision-workspace-files';
const THEME_KEY = 'precision-workspace-theme';

const INITIAL_FILES: WorkspaceFile[] = [
  {
    id: 'f1',
    name: 'Welcome',
    type: 'md',
    content: '# Welcome to Precision Workspace\n\nThis is a glassmorphism-styled environment.\n\n- Beautiful typography\n- Three precision themes\n- Multiple file types',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'f2',
    name: 'Project Roadmap',
    type: 'Tasks',
    content: JSON.stringify([
      { id: 't1', title: 'Design System', description: 'Setup glassmorphism UI', status: 'done' },
      { id: 't2', title: 'Kanban Board', description: 'Implement drag & drop tasks', status: 'in-progress' },
      { id: 't3', title: 'Markdown Support', description: 'Add GFM support', status: 'todo' },
    ]),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'f3',
    name: 'Inspiration Board',
    type: 'Board',
    content: JSON.stringify([
      { id: 'b1', type: 'link', title: 'Apple Design', url: 'https://developer.apple.com/design/', tags: ['ui', 'inspiration'] },
      { id: 'b2', type: 'memo', title: 'App Idea', content: 'Use glass panels everywhere for depth.' },
      { id: 'b3', type: 'repo', title: 'TailwindCSS', url: 'https://github.com/tailwindlabs/tailwindcss', tags: ['css'] },
    ]),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export function useWorkspace() {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        setFiles(INITIAL_FILES);
      }
    } else {
      setFiles(INITIAL_FILES);
    }

    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    if (savedTheme && ['light', 'dark', 'amoled'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, [files, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.className = theme === 'light' ? '' : `theme-${theme}`;
  }, [theme, isLoaded]);

  const updateFileContent = useCallback((id: string, newContent: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content: newContent, updatedAt: Date.now() } : f));
  }, []);

  const addFile = useCallback((name: string, type: WorkspaceFile['type']) => {
    const newFile: WorkspaceFile = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      type,
      content: type === 'md' ? '# ' + name : '[]',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  }, [activeFileId]);

  return {
    files,
    activeFileId,
    setActiveFileId,
    updateFileContent,
    addFile,
    deleteFile,
    theme,
    setTheme
  };
}
