import { useState, useEffect, useRef } from 'react';
import { Search, FileText, CheckSquare, Grid, Command, FolderPlus, FilePlus, Settings, Hash, Link as LinkIcon, Calendar, ArrowRight, Star } from 'lucide-react';
import { FileEntry, FileType } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filesTree: FileEntry[];
  onSelectFile: (path: string, type: FileType, name: string) => void;
  onAddFile: () => void;
  onAddFolder: () => void;
  onOpenSettings: () => void;
  // New v1.0 commands
  onToggleVim: () => void;
  onToggleFavorites: () => void;
  onOpenSearchPanel: () => void;
  onToggleBacklinks: () => void;
  onToggleOutline: () => void;
  onToggleAi: () => void;
}

export function CommandPalette({ 
  isOpen, 
  onClose, 
  filesTree, 
  onSelectFile, 
  onAddFile, 
  onAddFolder, 
  onOpenSettings,
  onToggleVim,
  onToggleFavorites,
  onOpenSearchPanel,
  onToggleBacklinks,
  onToggleOutline,
  onToggleAi
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten file tree for search
  const allFiles: { path: string; name: string; type: FileType }[] = [];
  const traverse = (entries: FileEntry[]) => {
    for (const entry of entries) {
      if (entry.isDirectory && entry.children) {
        traverse(entry.children);
      } else if (!entry.isDirectory && entry.type && entry.type !== 'folder') {
        allFiles.push({ path: entry.path, name: entry.name, type: entry.type as FileType });
      }
    }
  };
  traverse(filesTree);

  // Define static commands
  const commands = [
    { id: 'new-file', name: 'Create New File', icon: <FilePlus size={14} />, action: onAddFile, category: 'File' },
    { id: 'new-folder', name: 'Create New Folder', icon: <FolderPlus size={14} />, action: onAddFolder, category: 'File' },
    { id: 'search-panel', name: 'Search Vault Text (Ctrl+Shift+F)', icon: <Search size={14} />, action: onOpenSearchPanel, category: 'Navigation' },
    { id: 'toggle-favorites', name: 'Toggle Active File Favorite', icon: <Star size={14} />, action: onToggleFavorites, category: 'File' },
    { id: 'toggle-outline', name: 'Toggle Outline Panel', icon: <Hash size={14} />, action: onToggleOutline, category: 'View' },
    { id: 'toggle-backlinks', name: 'Toggle Backlinks Panel', icon: <LinkIcon size={14} />, action: onToggleBacklinks, category: 'View' },
    { id: 'toggle-ai', name: 'Toggle AI Copilot', icon: <Command size={14} />, action: onToggleAi, category: 'View' },
    { id: 'toggle-vim', name: 'Toggle Vim Mode', icon: <Command size={14} />, action: onToggleVim, category: 'Editor' },
    { id: 'settings', name: 'Open Settings', icon: <Settings size={14} />, action: onOpenSettings, category: 'App' }
  ];

  const filteredCommands = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const filteredFiles = allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  const totalItems = filteredCommands.length + filteredFiles.length;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredCommands.length) {
        filteredCommands[selectedIndex].action();
        onClose();
      } else {
        const file = filteredFiles[selectedIndex - filteredCommands.length];
        onSelectFile(file.path, file.type, file.name);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-[600px] bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-in-top"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-glass)]">
          <Search size={18} className="text-[var(--accent)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-main)] text-lg placeholder:text-[var(--text-muted)]"
            placeholder="Search files or run commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-[10px] font-semibold text-[var(--text-muted)]">
            ESC to close
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {filteredCommands.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Commands</div>
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                    selectedIndex === idx ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-glass)] text-[var(--text-main)]"
                  )}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => { cmd.action(); onClose(); }}
                >
                  <div className={cn("p-1.5 rounded-lg", selectedIndex === idx ? "bg-white/20" : "bg-[var(--accent-light)] text-[var(--accent)]")}>
                    {cmd.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cmd.name}</div>
                    <div className={cn("text-[10px]", selectedIndex === idx ? "text-white/70" : "text-[var(--text-muted)]")}>{cmd.category}</div>
                  </div>
                  {selectedIndex === idx && <ArrowRight size={14} className="opacity-70" />}
                </div>
              ))}
            </div>
          )}

          {filteredFiles.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Files</div>
              {filteredFiles.map((file, idx) => {
                const globalIdx = filteredCommands.length + idx;
                const isSelected = selectedIndex === globalIdx;
                
                let Icon = FileText;
                if (file.type === 'Tasks') Icon = CheckSquare;
                if (file.type === 'Board') Icon = Grid;

                return (
                  <div
                    key={file.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors",
                      isSelected ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-glass)] text-[var(--text-main)]"
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    onClick={() => { onSelectFile(file.path, file.type, file.name); onClose(); }}
                  >
                    <Icon size={14} className={isSelected ? "text-white opacity-80" : "text-[var(--text-muted)]"} />
                    <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                    <span className={cn("text-xs truncate max-w-[200px]", isSelected ? "text-white/60" : "text-[var(--text-muted)]")}>
                      {file.path.split('\\').slice(-2, -1)[0] || 'root'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-8 text-center text-[var(--text-muted)]">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

