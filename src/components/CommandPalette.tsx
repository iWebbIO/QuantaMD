import { useState, useEffect, useRef } from 'react';
import { Search, FileText, CheckSquare, Grid, Settings, Moon, Sun, Layers, Terminal } from 'lucide-react';
import { FileEntry, FileType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  files: FileEntry[];
  onOpenFile: (path: string, type: FileType, name: string) => void;
  onAddFile: (name: string, type: FileType) => void;
  onSetTheme: (theme: any) => void;
  onOpenSettings: () => void;
  onToggleGraph: () => void;
}

interface PaletteCommand {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  files,
  onOpenFile,
  onAddFile,
  onSetTheme,
  onOpenSettings,
  onToggleGraph
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Flat list of files helper
  const getFlatFiles = (list: FileEntry[]): { name: string; path: string; type: FileType }[] => {
    let result: { name: string; path: string; type: FileType }[] = [];
    list.forEach(item => {
      if (item.isDirectory && item.children) {
        result = [...result, ...getFlatFiles(item.children)];
      } else if (item.type && item.type !== 'folder') {
        result.push({
          name: item.name,
          path: item.path,
          type: item.type as FileType
        });
      }
    });
    return result;
  };

  const flatFiles = getFlatFiles(files);

  // Define global commands
  const commands: PaletteCommand[] = [
    {
      id: 'cmd-new-md',
      title: 'Create new Markdown Note',
      subtitle: 'Create a blank text page',
      icon: <FileText size={16} className="text-[var(--accent)]" />,
      action: () => onAddFile('New Note', 'md')
    },
    {
      id: 'cmd-new-tasks',
      title: 'Create new Tasks Board',
      subtitle: 'Setup a task status board',
      icon: <CheckSquare size={16} className="text-[var(--accent)]" />,
      action: () => onAddFile('Tasks List', 'Tasks')
    },
    {
      id: 'cmd-new-board',
      title: 'Create new Kanban Board',
      subtitle: 'Setup a card inspiration board',
      icon: <Grid size={16} className="text-[var(--accent)]" />,
      action: () => onAddFile('Board Grid', 'Board')
    },
    {
      id: 'cmd-theme-light',
      title: 'Switch to Light Theme',
      subtitle: 'Change interface colors to light',
      icon: <Sun size={16} className="text-amber-500" />,
      action: () => onSetTheme('light')
    },
    {
      id: 'cmd-theme-dark',
      title: 'Switch to Dark Theme',
      subtitle: 'Change interface colors to dark',
      icon: <Moon size={16} className="text-indigo-400" />,
      action: () => onSetTheme('dark')
    },
    {
      id: 'cmd-theme-amoled',
      title: 'Switch to AMOLED Theme',
      subtitle: 'Change interface colors to pure black',
      icon: <Terminal size={16} className="text-gray-400" />,
      action: () => onSetTheme('amoled')
    },
    {
      id: 'cmd-toggle-graph',
      title: 'Toggle Graph View',
      subtitle: 'Open network visualization of links',
      icon: <Layers size={16} className="text-[var(--accent)]" />,
      action: () => onToggleGraph()
    },
    {
      id: 'cmd-settings',
      title: 'Open App Settings',
      subtitle: 'Configure fonts and Gemini API key',
      icon: <Settings size={16} className="text-[var(--text-muted)]" />,
      action: () => onOpenSettings()
    }
  ];

  // Filter commands and files based on query
  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    (c.subtitle && c.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredFiles = flatFiles.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults = filteredCommands.length + filteredFiles.length;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keys (up, down, enter, escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerSelected();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalResults]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        const parent = resultsRef.current;
        const activeTop = activeEl.offsetTop;
        const activeHeight = activeEl.offsetHeight;
        const parentScrollTop = parent.scrollTop;
        const parentHeight = parent.clientHeight;

        if (activeTop < parentScrollTop) {
          parent.scrollTop = activeTop;
        } else if (activeTop + activeHeight > parentScrollTop + parentHeight) {
          parent.scrollTop = activeTop + activeHeight - parentHeight;
        }
      }
    }
  }, [selectedIndex]);

  const triggerSelected = () => {
    if (selectedIndex < filteredCommands.length) {
      filteredCommands[selectedIndex].action();
    } else {
      const fileIdx = selectedIndex - filteredCommands.length;
      const file = filteredFiles[fileIdx];
      onOpenFile(file.path, file.type, file.name);
    }
    onClose();
  };

  const getFileIcon = (type: FileType) => {
    if (type === 'md') return <FileText size={16} className="text-[var(--accent)]" />;
    if (type === 'Tasks') return <CheckSquare size={16} className="text-[var(--accent)]" />;
    return <Grid size={16} className="text-[var(--accent)]" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-[600px] max-h-[450px] bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-glass)]">
          <Search size={18} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or file name..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[var(--text-muted)]"
          />
          <span className="text-[10px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--text-muted)] font-semibold">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div 
          ref={resultsRef}
          className="flex-1 overflow-y-auto p-2 space-y-0.5"
        >
          {totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] font-medium">
              No commands or files matching query
            </div>
          ) : (
            <>
              {/* Commands */}
              {filteredCommands.map((cmd, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => { setSelectedIndex(idx); triggerSelected(); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5'}`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{cmd.title}</h4>
                      {cmd.subtitle && (
                        <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                        Run
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Files */}
              {filteredFiles.map((file, idx) => {
                const realIdx = idx + filteredCommands.length;
                const isActive = realIdx === selectedIndex;
                return (
                  <div
                    key={file.path}
                    onClick={() => { setSelectedIndex(realIdx); triggerSelected(); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5'}`}>
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{file.name}</h4>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                        File: {file.path}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${isActive ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10 text-[var(--text-muted)]'}`}>
                      {file.type}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
