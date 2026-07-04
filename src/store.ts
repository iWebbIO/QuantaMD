import { useState, useEffect, useCallback } from 'react';
import { WorkspaceFile, Theme, FileEntry, WorkspaceTab, AppSettings, FileType, TrashEntry, SearchResult } from './types';

const STORAGE_KEY = 'precision-workspace-files';
const THEME_KEY = 'precision-workspace-theme';
const FAVORITES_KEY = 'precision-workspace-favorites';

const INITIAL_FILES: WorkspaceFile[] = [
  {
    id: 'f1',
    name: 'Welcome',
    type: 'md',
    content: '# Welcome to QuantaMD\n\nThis is a glassmorphism-styled environment.\n\n- Beautiful typography\n- Three precision themes\n- Multiple file types',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    path: 'welcome.md'
  },
  {
    id: 'f2',
    name: 'Project Roadmap',
    type: 'Tasks',
    content: `# Project Roadmap\n\n- [x] Design System\n  Setup glassmorphism UI\n- [ ] Kanban Board\n  Implement drag & drop tasks\n- [ ] Markdown Support\n  Add GFM support`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    path: 'roadmap.tasks.md'
  },
  {
    id: 'f3',
    name: 'Inspiration Board',
    type: 'Board',
    content: `## Links\n- [Apple Design](https://developer.apple.com/design/) #ui #inspiration\n- [TailwindCSS](https://github.com/tailwindlabs/tailwindcss) #css\n\n## Ideas\n- Use glass panels everywhere for depth.`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    path: 'board.board.md'
  }
];

export function useWorkspace() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [filesTree, setFilesTree] = useState<FileEntry[]>([]);
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cachedFiles, setCachedFiles] = useState<Record<string, WorkspaceFile>>({});
  
  const [theme, setThemeState] = useState<Theme>('dark');
  const [settings, setSettings] = useState<AppSettings>({
    aiEnabled: true,
    aiProvider: 'ollama',
    aiEndpoint: 'http://localhost:11434/v1',
    aiModel: '',
    aiApiKey: '',
    defaultVaultPath: '',
    theme: 'dark',
    fontFamily: 'system-ui',
    fontSize: 14,
    accentColor: '210 100% 50%',
    vimMode: false,
    dailyNoteTemplate: '# {{date}}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n',
    editorLineNumbers: true,
    editorWordWrap: true,
    editorTabSize: 2,
    startupBehavior: 'last-vault',
    exportDirectory: '',
    exportTemplatePdf: 'default',
    exportTemplateHtml: 'default'
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>([]);

  // Trash
  const [trashEntries, setTrashEntries] = useState<TrashEntry[]>([]);

  // Load configuration & initial files
  useEffect(() => {
    async function init() {
      if (isElectron && window.electronAPI) {
        try {
          const appSettings = await window.electronAPI.getSettings();
          // Merge with defaults for new fields
          const mergedSettings: AppSettings = {
            aiEnabled: appSettings.aiEnabled ?? true,
            aiProvider: appSettings.aiProvider || 'ollama',
            aiEndpoint: appSettings.aiEndpoint || 'http://localhost:11434/v1',
            aiModel: appSettings.aiModel || '',
            aiApiKey: appSettings.aiApiKey || '',
            defaultVaultPath: appSettings.defaultVaultPath || '',
            theme: appSettings.theme || 'dark',
            fontFamily: appSettings.fontFamily || 'system-ui',
            fontSize: appSettings.fontSize || 14,
            accentColor: appSettings.accentColor || '210 100% 50%',
            vimMode: appSettings.vimMode || false,
            dailyNoteTemplate: appSettings.dailyNoteTemplate || '# {{date}}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n',
            editorLineNumbers: appSettings.editorLineNumbers ?? true,
            editorWordWrap: appSettings.editorWordWrap ?? true,
            editorTabSize: appSettings.editorTabSize || 2,
            startupBehavior: appSettings.startupBehavior || 'last-vault',
            exportDirectory: appSettings.exportDirectory || '',
            exportTemplatePdf: appSettings.exportTemplatePdf || 'default',
            exportTemplateHtml: appSettings.exportTemplateHtml || 'default'
          };
          setSettings(mergedSettings);
          setThemeState(mergedSettings.theme as Theme);
          
          if (mergedSettings.defaultVaultPath && mergedSettings.startupBehavior !== 'empty') {
            setVaultPath(mergedSettings.defaultVaultPath);
            const list = await window.electronAPI.readDirectory(mergedSettings.defaultVaultPath);
            setFilesTree(list);
          }
        } catch (e) {
          console.error('Failed to load Electron settings', e);
        }
      } else {
        // Web fallback
        const savedFiles = localStorage.getItem(STORAGE_KEY);
        const initialMap: Record<string, WorkspaceFile> = {};
        if (savedFiles) {
          try {
            const files = JSON.parse(savedFiles) as WorkspaceFile[];
            files.forEach(f => { initialMap[f.id] = f; });
          } catch (e) {
            INITIAL_FILES.forEach(f => { initialMap[f.id] = f; });
          }
        } else {
          INITIAL_FILES.forEach(f => { initialMap[f.id] = f; });
        }
        setCachedFiles(initialMap);

        const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
        if (savedTheme && ['light', 'dark', 'amoled'].includes(savedTheme)) {
          setThemeState(savedTheme);
        }
      }

      // Load favorites
      try {
        const savedFavorites = localStorage.getItem(FAVORITES_KEY);
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch {}

      setIsLoaded(true);
    }
    init();
  }, [isElectron]);

  // Apply accent color to CSS variables
  useEffect(() => {
    if (!isLoaded) return;
    const hsl = settings.accentColor || '210 100% 50%';
    document.documentElement.style.setProperty('--accent-hsl', hsl);
    document.documentElement.style.setProperty('--accent', `hsl(${hsl})`);
    document.documentElement.style.setProperty('--accent-light', `hsl(${hsl} / 0.15)`);
  }, [settings.accentColor, isLoaded]);

  // Sync theme to root class
  useEffect(() => {
    if (!isLoaded) return;
    document.documentElement.className = theme === 'light' ? '' : `theme-${theme}`;
  }, [theme, isLoaded]);

  // Save web fallback changes to LocalStorage
  useEffect(() => {
    if (!isElectron && isLoaded) {
      const fileList = Object.values(cachedFiles);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fileList));
    }
  }, [cachedFiles, isElectron, isLoaded]);

  // Save favorites to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  // File watcher - listen for external changes
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.onExternalFileChange) return;

    const unsubscribe = window.electronAPI.onExternalFileChange((event) => {
      console.log('External file change:', event);
      // Refresh tree on any change
      refreshTree();

      // If an open file was changed externally, reload its content
      if (event.type === 'change' && cachedFiles[event.path]) {
        (async () => {
          try {
            if (window.electronAPI) {
              const content = await window.electronAPI.readFile(event.path);
              setCachedFiles(prev => {
                const file = prev[event.path];
                if (!file) return prev;
                return {
                  ...prev,
                  [event.path]: { ...file, content, updatedAt: Date.now() }
                };
              });
            }
          } catch (e) {
            console.error('Failed to reload externally changed file', e);
          }
        })();
      }
    });

    return unsubscribe;
  }, [isElectron, cachedFiles]);

  // Scan file explorer tree helper
  const refreshTree = useCallback(async () => {
    if (isElectron && window.electronAPI && vaultPath) {
      const list = await window.electronAPI.readDirectory(vaultPath);
      setFilesTree(list);
    }
  }, [isElectron, vaultPath]);

  // Open a directory vault
  const selectVault = useCallback(async () => {
    if (isElectron && window.electronAPI) {
      const result = await window.electronAPI.openDirectory();
      if (result) {
        setVaultPath(result.path);
        setFilesTree(result.files);
        setTabs([]);
        setActiveTabId(null);
        setCachedFiles({});
        
        // Save as default vault path
        const newSettings = { ...settings, defaultVaultPath: result.path };
        setSettings(newSettings);
        await window.electronAPI.saveSettings(newSettings);
      }
    }
  }, [isElectron, settings]);

  const closeVault = useCallback(() => {
    setVaultPath(null);
    setFilesTree([]);
    setTabs([]);
    setActiveTabId(null);
    setCachedFiles({});
  }, []);

  // Update theme settings
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    if (isElectron && window.electronAPI) {
      const newSettings = { ...settings, theme: newTheme };
      setSettings(newSettings);
      await window.electronAPI.saveSettings(newSettings);
    } else {
      localStorage.setItem(THEME_KEY, newTheme);
    }
  }, [isElectron, settings]);

  // Save Settings wrapper
  const saveAppSettings = useCallback(async (updatedSettings: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    if (isElectron && window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    }
  }, [isElectron, settings]);

  // Load a file's content
  const loadFileContent = useCallback(async (pathStr: string, fileType: FileType, fileName: string): Promise<WorkspaceFile> => {
    if (cachedFiles[pathStr]) {
      return cachedFiles[pathStr];
    }

    let content = '';
    if (isElectron && window.electronAPI) {
      content = await window.electronAPI.readFile(pathStr);
    } else {
      // In web fallback, it should already be cached, but create if missing
      content = fileType === 'md' ? `# ${fileName}` : '[]';
    }

    const loadedFile: WorkspaceFile = {
      id: pathStr,
      name: fileName,
      type: fileType,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      path: pathStr
    };

    setCachedFiles(prev => ({ ...prev, [pathStr]: loadedFile }));
    return loadedFile;
  }, [cachedFiles, isElectron]);

  // Switch active tab and open file
  const openFile = useCallback(async (pathStr: string, fileType: FileType, fileName: string) => {
    await loadFileContent(pathStr, fileType, fileName);

    setTabs(prev => {
      if (prev.some(t => t.fileId === pathStr)) return prev;
      return [...prev, { fileId: pathStr, name: fileName, type: fileType }];
    });

    setActiveTabId(pathStr);
  }, [loadFileContent]);

  // Close tab
  const closeTab = useCallback((pathStr: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.fileId !== pathStr);
      if (activeTabId === pathStr) {
        if (filtered.length > 0) {
          // Switch to adjacent tab
          const index = prev.findIndex(t => t.fileId === pathStr);
          const nextActiveIndex = Math.min(index, filtered.length - 1);
          setActiveTabId(filtered[nextActiveIndex].fileId);
        } else {
          setActiveTabId(null);
        }
      }
      return filtered;
    });
  }, [activeTabId]);

  // Set active tab directly
  const selectTab = useCallback((pathStr: string) => {
    if (tabs.some(t => t.fileId === pathStr)) {
      setActiveTabId(pathStr);
    }
  }, [tabs]);

  // Move tab (drag reorder)
  const moveTab = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
  }, []);

  // Save file content
  const updateFileContent = useCallback(async (pathStr: string, newContent: string) => {
    setCachedFiles(prev => {
      const file = prev[pathStr];
      if (!file) return prev;
      return {
        ...prev,
        [pathStr]: { ...file, content: newContent, updatedAt: Date.now() }
      };
    });

    if (isElectron && window.electronAPI) {
      await window.electronAPI.writeFile(pathStr, newContent);
    }
  }, [isElectron]);

  // Add a new file
  const addFile = useCallback(async (name: string, type: FileType, parentDirPath?: string) => {
    const folder = parentDirPath || vaultPath;
    if (!folder) return;

    if (isElectron && window.electronAPI) {
      try {
        const filePath = await window.electronAPI.createFile(folder, name, type);
        await refreshTree();
        // Automatically open the file
        await openFile(filePath, type, name);
      } catch (err) {
        console.error('Failed to create file', err);
      }
    } else {
      // Web fallback
      const id = Math.random().toString(36).substring(2, 9);
      const newFile: WorkspaceFile = {
        id,
        name,
        type,
        content: type === 'md' ? '# ' + name : '[]',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        path: id
      };
      setCachedFiles(prev => ({ ...prev, [id]: newFile }));
      openFile(id, type, name);
    }
  }, [isElectron, vaultPath, refreshTree, openFile]);

  // Add a new directory folder
  const addDirectory = useCallback(async (name: string, parentDirPath?: string) => {
    const folder = parentDirPath || vaultPath;
    if (!folder || !isElectron || !window.electronAPI) return;

    try {
      await window.electronAPI.createDirectory(folder, name);
      await refreshTree();
    } catch (err) {
      console.error('Failed to create directory', err);
    }
  }, [isElectron, vaultPath, refreshTree]);

  // Delete a file or folder (soft delete to trash)
  const deleteEntry = useCallback(async (pathStr: string, isDirectory: boolean) => {
    if (isElectron && window.electronAPI && window.electronAPI.moveToTrash) {
      try {
        await window.electronAPI.moveToTrash(pathStr, isDirectory);
        if (!isDirectory) {
          closeTab(pathStr);
          // Remove from cached files
          setCachedFiles(prev => {
            const updated = { ...prev };
            delete updated[pathStr];
            return updated;
          });
        }
        await refreshTree();
        // Refresh trash list
        await refreshTrash();
      } catch (err) {
        console.error('Failed to move to trash', err);
      }
    } else if (isElectron && window.electronAPI) {
      // Fallback to hard delete if moveToTrash not available
      try {
        if (isDirectory) {
          await window.electronAPI.deleteDirectory(pathStr);
        } else {
          await window.electronAPI.deleteFile(pathStr);
          closeTab(pathStr);
        }
        await refreshTree();
      } catch (err) {
        console.error('Failed to delete path', err);
      }
    } else {
      // Web fallback
      setCachedFiles(prev => {
        const updated = { ...prev };
        delete updated[pathStr];
        return updated;
      });
      closeTab(pathStr);
    }
  }, [isElectron, closeTab, refreshTree]);

  // Rename a file or directory
  const renameEntry = useCallback(async (oldPathStr: string, newPathStr: string, isDirectory: boolean) => {
    if (isElectron && window.electronAPI) {
      try {
        await window.electronAPI.renameEntry(oldPathStr, newPathStr);
        await refreshTree();

        // Update cached files if a file was renamed
        if (!isDirectory) {
          const newName = newPathStr.substring(newPathStr.lastIndexOf('\\') + 1).replace(/\.(md|tasks|board)$/, '');
          const ext = newPathStr.substring(newPathStr.lastIndexOf('.'));
          const type: FileType = ext === '.md' ? 'md' : ext === '.tasks' ? 'Tasks' : 'Board';

          setCachedFiles(prev => {
            const updated = { ...prev };
            if (updated[oldPathStr]) {
              updated[newPathStr] = {
                ...updated[oldPathStr],
                id: newPathStr,
                name: newName,
                path: newPathStr
              };
              delete updated[oldPathStr];
            }
            return updated;
          });

          // Update tabs
          setTabs(prev => prev.map(t => t.fileId === oldPathStr ? { ...t, fileId: newPathStr, name: newName } : t));
          if (activeTabId === oldPathStr) {
            setActiveTabId(newPathStr);
          }

          // Update favorites
          setFavorites(prev => prev.map(f => f === oldPathStr ? newPathStr : f));
        }
      } catch (err) {
        console.error('Failed to rename path', err);
      }
    }
  }, [isElectron, activeTabId, refreshTree]);

  const showFileInExplorer = useCallback((pathStr: string) => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.showInExplorer(pathStr);
    }
  }, [isElectron]);

  // Favorites management
  const toggleFavorite = useCallback((pathStr: string) => {
    setFavorites(prev => {
      if (prev.includes(pathStr)) {
        return prev.filter(f => f !== pathStr);
      }
      return [...prev, pathStr];
    });
  }, []);

  const isFavorite = useCallback((pathStr: string) => {
    return favorites.includes(pathStr);
  }, [favorites]);

  // Trash management
  const refreshTrash = useCallback(async () => {
    if (isElectron && window.electronAPI?.listTrash && vaultPath) {
      try {
        const entries = await window.electronAPI.listTrash(vaultPath);
        setTrashEntries(entries);
      } catch (e) {
        console.error('Failed to list trash', e);
      }
    }
  }, [isElectron, vaultPath]);

  const restoreFromTrash = useCallback(async (entry: TrashEntry) => {
    if (isElectron && window.electronAPI?.restoreFromTrash) {
      try {
        await window.electronAPI.restoreFromTrash(entry);
        await refreshTrash();
        await refreshTree();
      } catch (e) {
        console.error('Failed to restore from trash', e);
      }
    }
  }, [isElectron, refreshTrash, refreshTree]);

  const permanentDeleteTrash = useCallback(async (trashPath: string) => {
    if (isElectron && window.electronAPI?.permanentDeleteTrash) {
      try {
        await window.electronAPI.permanentDeleteTrash(trashPath);
        await refreshTrash();
      } catch (e) {
        console.error('Failed to permanently delete', e);
      }
    }
  }, [isElectron, refreshTrash]);

  const emptyTrash = useCallback(async () => {
    if (isElectron && window.electronAPI?.emptyTrash && vaultPath) {
      try {
        await window.electronAPI.emptyTrash(vaultPath);
        setTrashEntries([]);
      } catch (e) {
        console.error('Failed to empty trash', e);
      }
    }
  }, [isElectron, vaultPath]);

  // Load trash on vault open
  useEffect(() => {
    if (vaultPath && isLoaded) {
      refreshTrash();
    }
  }, [vaultPath, isLoaded, refreshTrash]);

  // Full-text search
  const searchVault = useCallback(async (query: string, options: { regex?: boolean; caseSensitive?: boolean } = {}): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    if (isElectron && window.electronAPI?.searchFiles && vaultPath) {
      try {
        return await window.electronAPI.searchFiles(vaultPath, query, options);
      } catch (e) {
        console.error('Search failed', e);
        return [];
      }
    } else {
      // Web fallback: search cached files
      const results: SearchResult[] = [];
      const files = Object.values(cachedFiles);
      
      for (const file of files) {
        if (file.type !== 'md') continue;
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let matchIndex = -1;
          
          if (options.regex) {
            try {
              const re = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
              const match = re.exec(line);
              if (match) matchIndex = match.index;
            } catch {}
          } else {
            const searchIn = options.caseSensitive ? line : line.toLowerCase();
            const searchFor = options.caseSensitive ? query : query.toLowerCase();
            matchIndex = searchIn.indexOf(searchFor);
          }

          if (matchIndex >= 0) {
            results.push({
              filePath: file.path,
              fileName: file.name,
              fileType: file.type,
              lineNumber: i + 1,
              lineContent: line,
              matchStart: matchIndex,
              matchEnd: matchIndex + query.length
            });
            if (results.length >= 200) return results;
          }
        }
      }
      return results;
    }
  }, [isElectron, vaultPath, cachedFiles]);

  // Daily notes
  const openDailyNote = useCallback(async (date: string) => {
    if (!vaultPath) return;

    if (isElectron && window.electronAPI?.createDailyNote) {
      try {
        const filePath = await window.electronAPI.createDailyNote(
          vaultPath, 
          date, 
          settings.dailyNoteTemplate
        );
        await refreshTree();
        const name = date;
        await openFile(filePath, 'md', name);
      } catch (e) {
        console.error('Failed to create daily note', e);
      }
    } else {
      // Web fallback: create in-memory
      const id = `daily-${date}`;
      if (!cachedFiles[id]) {
        const template = settings.dailyNoteTemplate
          .replace(/\{\{date\}\}/g, date)
          .replace(/\{\{day\}\}/g, new Date(date).toLocaleDateString('en-US', { weekday: 'long' }))
          .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());

        const newFile: WorkspaceFile = {
          id,
          name: date,
          type: 'md',
          content: template,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          path: id
        };
        setCachedFiles(prev => ({ ...prev, [id]: newFile }));
      }
      openFile(id, 'md', date);
    }
  }, [vaultPath, isElectron, settings.dailyNoteTemplate, refreshTree, openFile, cachedFiles]);

  // Get list of existing daily note dates
  const getDailyNoteDates = useCallback((): string[] => {
    const dates: string[] = [];
    const scanForDailyNotes = (entries: FileEntry[]) => {
      for (const entry of entries) {
        if (entry.isDirectory && entry.children) {
          if (entry.name === 'daily') {
            for (const child of entry.children) {
              if (!child.isDirectory && child.type === 'md') {
                // Extract date from filename (YYYY-MM-DD)
                const match = child.name.match(/^(\d{4}-\d{2}-\d{2})$/);
                if (match) dates.push(match[1]);
              }
            }
          } else {
            scanForDailyNotes(entry.children);
          }
        }
      }
    };
    scanForDailyNotes(filesTree);
    return dates;
  }, [filesTree]);

  return {
    isElectron,
    vaultPath,
    filesTree,
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId: selectTab,
    cachedFiles,
    activeFile: activeTabId ? cachedFiles[activeTabId] : null,
    updateFileContent,
    addFile,
    addDirectory,
    deleteEntry,
    renameEntry,
    theme,
    setTheme,
    settings,
    saveAppSettings,
    selectVault,
    closeVault,
    openFile,
    closeTab,
    moveTab,
    showFileInExplorer,
    // New v1.0
    favorites,
    toggleFavorite,
    isFavorite,
    trashEntries,
    restoreFromTrash,
    permanentDeleteTrash,
    emptyTrash,
    refreshTrash,
    searchVault,
    openDailyNote,
    getDailyNoteDates,
    refreshTree
  };
}
