import { Plus, FileText, CheckSquare, Grid, Trash2 } from 'lucide-react';
import { WorkspaceFile, FileType } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { Theme } from '../types';

interface Props {
  files: WorkspaceFile[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string, type: FileType) => void;
  onDelete: (id: string) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const TYPE_ICONS = {
  md: <FileText size={16} />,
  Tasks: <CheckSquare size={16} />,
  Board: <Grid size={16} />
};

export function Sidebar({ files, activeFileId, onSelect, onAdd, onDelete, theme, setTheme }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FileType>('md');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), newType);
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-64 h-full flex flex-col bg-[var(--bg-sidebar)] backdrop-blur-[var(--backdrop-blur)] border-r border-[var(--border-glass-strong)] transition-colors duration-300">
      <div className="p-4 pt-8">
        <h1 className="text-sm font-semibold tracking-wide uppercase text-[var(--text-muted)] mb-6">Workspace</h1>
        
        <div className="space-y-1">
          {files.map(file => (
            <div
              key={file.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                activeFileId === file.id 
                  ? "bg-[var(--accent)] text-white shadow-md" 
                  : "text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10"
              )}
              onClick={() => onSelect(file.id)}
            >
              <div className="flex items-center gap-3 truncate">
                <span className={cn("opacity-70", activeFileId === file.id ? "text-white" : "text-[var(--accent)]")}>
                  {TYPE_ICONS[file.type]}
                </span>
                <span className="truncate">{file.name}</span>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/20 dark:hover:bg-white/20",
                  activeFileId === file.id ? "text-white" : "text-red-500"
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 px-4">
        {isAdding ? (
          <div className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-3 shadow-[var(--shadow-sm)]">
            <input 
              type="text"
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="File name..."
              className="w-full bg-transparent text-sm mb-3 outline-none placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
            />
            <div className="flex gap-2 mb-3">
              {(['md', 'Tasks', 'Board'] as FileType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={cn(
                    "flex-1 p-1.5 rounded-lg flex justify-center transition-all",
                    newType === t ? "bg-[var(--accent)] text-white" : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]"
                  )}
                  title={t}
                >
                  {TYPE_ICONS[t]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg bg-[var(--text-main)] text-[var(--bg-base)]">Create</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200"
          >
            <Plus size={16} />
            <span>New File</span>
          </button>
        )}
      </div>

      <div className="mt-auto p-4 mb-4">
        <ThemeSelector theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}
