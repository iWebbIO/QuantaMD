import { useState } from 'react';
import { 
  Plus, FolderPlus, FileText, CheckSquare, Grid, Trash2, Edit2, 
  Folder, FolderOpen, ChevronDown, ChevronRight, Settings, 
  Layers, LogOut, Search, ExternalLink, Star, StarOff,
  Calendar, Hash, Files, RotateCcw, HelpCircle, ChevronsUpDown
} from 'lucide-react';
import { FileEntry, FileType, Theme, TrashEntry } from '../types';
import { CalendarWidget } from './CalendarWidget';
import { TagsPanel } from './TagsPanel';
import { TrashPanel } from './TrashPanel';
import { cn } from '../lib/utils';
import { useContextMenu, ContextMenuItem } from './ContextMenu';
type SidebarMode = 'files' | 'search' | 'calendar' | 'tags' | 'trash';

interface Props {
  isElectron: boolean;
  vaultPath: string | null;
  filesTree: FileEntry[];
  activeFileId: string | null;
  onSelectFile: (path: string, type: FileType, name: string) => void;
  onAddFile: (name: string, type: FileType, parentPath?: string) => void;
  onAddDirectory: (name: string, parentPath?: string) => void;
  onDeleteEntry: (path: string, isDirectory: boolean) => void;
  onRenameEntry: (oldPath: string, newPath: string, isDirectory: boolean) => void;
  onSelectVault: () => void;
  onCloseVault: () => void;
  onOpenSettings: () => void;
  onToggleGraph: () => void;
  showGraph: boolean;
  onShowInExplorer: (path: string) => void;
  // New v1.0 props
  favorites: string[];
  onToggleFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  cachedFiles: Record<string, { content: string; name: string; type: FileType; path: string }>;
  onOpenSearch: () => void;
  // Daily notes
  onOpenDailyNote: (date: string) => void;
  existingDailyNotes: string[];
  // Trash
  trashEntries: TrashEntry[];
  onRestoreFromTrash: (entry: TrashEntry) => void;
  onPermanentDeleteTrash: (trashPath: string) => void;
  onEmptyTrash: () => void;
  // Tags
  onTagClick: (tag: string) => void;
}

const TYPE_ICONS = {
  md: <FileText size={14} />,
  Tasks: <CheckSquare size={14} />,
  Board: <Grid size={14} />
};

export function Sidebar({
  isElectron,
  vaultPath,
  filesTree,
  activeFileId,
  onSelectFile,
  onAddFile,
  onAddDirectory,
  onDeleteEntry,
  onRenameEntry,
  onSelectVault,
  onCloseVault,
  onOpenSettings,
  onToggleGraph,
  showGraph,
  onShowInExplorer,
  favorites,
  onToggleFavorite,
  isFavorite,
  cachedFiles,
  onOpenSearch,
  onOpenDailyNote,
  existingDailyNotes,
  trashEntries,
  onRestoreFromTrash,
  onPermanentDeleteTrash,
  onEmptyTrash,
  onTagClick
}: Props) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('files');
  
  // Drag and drop state
  const [draggedNode, setDraggedNode] = useState<FileEntry | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  
  // Adding items helper state
  const [addingToFolder, setAddingToFolder] = useState<{ path: string; type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newFileType, setNewFileType] = useState<FileType>('md');
  const { showMenu, ContextMenuComponent } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, node: FileEntry) => {
    const items: ContextMenuItem[] = [];

    if (node.isDirectory) {
      items.push({ id: 'new-file', label: 'New File', icon: <Plus size={14} />, action: () => handleStartAdd(e as any, node.path, 'file') });
      items.push({ id: 'new-folder', label: 'New Folder', icon: <FolderPlus size={14} />, action: () => handleStartAdd(e as any, node.path, 'folder') });
      items.push({ id: 'sep1', label: '', separator: true, action: () => {} });
    } else {
      if (isFavorite(node.path)) {
        items.push({ id: 'unfav', label: 'Remove from Favorites', icon: <StarOff size={14} />, action: () => onToggleFavorite(node.path) });
      } else {
        items.push({ id: 'fav', label: 'Add to Favorites', icon: <Star size={14} />, action: () => onToggleFavorite(node.path) });
      }
      items.push({ id: 'reveal', label: 'Reveal in Explorer', icon: <ExternalLink size={14} />, action: () => onShowInExplorer(node.path) });
      items.push({ id: 'sep1', label: '', separator: true, action: () => {} });
    }

    items.push({ id: 'rename', label: 'Rename', icon: <Edit2 size={14} />, action: () => handleStartRename(e as any, node) });
    items.push({ id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, action: () => {
      if (confirm(`Are you sure you want to delete ${node.name}?`)) {
        onDeleteEntry(node.path, node.isDirectory);
      }
    }, danger: true });

    showMenu(e, items);
  };
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleStartRename = (e: React.MouseEvent, entry: FileEntry) => {
    e.stopPropagation();
    setEditingPath(entry.path);
    setEditName(entry.name);
  };

  const handleFinishRename = (entry: FileEntry) => {
    if (editName.trim() && editName !== entry.name) {
      const parentDir = entry.path.substring(0, entry.path.lastIndexOf('\\'));
      let newPath = '';
      if (entry.isDirectory) {
        newPath = parentDir + '\\' + editName.trim();
      } else {
        const ext = entry.path.substring(entry.path.lastIndexOf('.'));
        newPath = parentDir + '\\' + editName.trim() + ext;
      }
      onRenameEntry(entry.path, newPath, entry.isDirectory);
    }
    setEditingPath(null);
  };

  const handleStartAdd = (e: React.MouseEvent, path: string, type: 'file' | 'folder') => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [path]: true }));
    setAddingToFolder({ path, type });
    setNewItemName('');
    setNewFileType('md');
  };

  const handleFinishAdd = () => {
    if (newItemName.trim() && addingToFolder) {
      if (addingToFolder.type === 'file') {
        onAddFile(newItemName.trim(), newFileType, addingToFolder.path);
      } else {
        onAddDirectory(newItemName.trim(), addingToFolder.path);
      }
    }
    setAddingToFolder(null);
  };

  // Flatten file tree to get favorites data
  const getFlatFile = (path: string): FileEntry | null => {
    const search = (entries: FileEntry[]): FileEntry | null => {
      for (const entry of entries) {
        if (entry.path === path) return entry;
        if (entry.isDirectory && entry.children) {
          const found = search(entry.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(filesTree);
  };

  // Render a single file or folder node recursively
  const renderNode = (node: FileEntry, depth = 0) => {
    const isExpanded = !!expandedFolders[node.path];
    const isEditing = editingPath === node.path;
    const isActive = activeFileId === node.path;
    
    const isAddingHere = addingToFolder?.path === node.path;

    return (
      <div key={node.path} className="flex flex-col">
        {/* Row element */}
        <div
          draggable={true}
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedNode(node);
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedNode && draggedNode.path !== node.path && node.isDirectory) {
              setDragOverNodeId(node.path);
            }
          }}
          onDragLeave={() => {
            if (dragOverNodeId === node.path) {
              setDragOverNodeId(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverNodeId(null);
            if (draggedNode && draggedNode.path !== node.path && node.isDirectory) {
              const parentDir = node.path;
              let newPath = '';
              if (draggedNode.isDirectory) {
                newPath = parentDir + (parentDir.includes('\\') ? '\\' : '/') + draggedNode.name;
              } else {
                const ext = draggedNode.path.substring(draggedNode.path.lastIndexOf('.'));
                newPath = parentDir + (parentDir.includes('\\') ? '\\' : '/') + draggedNode.name + (draggedNode.name.endsWith(ext) ? '' : ext);
              }
              onRenameEntry(draggedNode.path, newPath, draggedNode.isDirectory);
            }
            setDraggedNode(null);
          }}
          className={cn(
            "group flex items-center justify-between py-1.5 pr-2 rounded-xl text-xs font-medium cursor-pointer transition-all select-none hover:bg-black/5 dark:hover:bg-white/5",
            isActive && "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 shadow-sm",
            dragOverNodeId === node.path && "bg-black/10 dark:bg-white/10 outline-dashed outline-1 outline-[var(--accent)]"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          onClick={() => {
            if (node.isDirectory) {
              toggleFolder(node.path);
            } else {
              onSelectFile(node.path, node.type as FileType, node.name);
            }
          }}
        >
          <div className="flex items-center gap-2 truncate flex-1 mr-2">
            {node.isDirectory ? (
              <span className="opacity-70 flex-shrink-0">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span className={cn("opacity-70 flex-shrink-0", !isActive && "text-[var(--accent)]")}>
                {TYPE_ICONS[node.type as FileType] || <FileText size={14} />}
              </span>
            )}

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleFinishRename(node)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFinishRename(node);
                  if (e.key === 'Escape') setEditingPath(null);
                }}
                onClick={e => e.stopPropagation()}
                className="bg-transparent border-b border-[var(--accent)] outline-none text-xs w-full py-0 px-0.5 text-[var(--text-main)]"
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

        </div>

        {/* Input for adding a child under this folder */}
        {isExpanded && isAddingHere && addingToFolder && (
          <div 
            className="flex flex-col bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-2.5 my-1 mx-2"
            style={{ marginLeft: `${(depth + 1) * 12}px` }}
          >
            <input
              type="text"
              autoFocus
              placeholder={addingToFolder.type === 'file' ? 'File name...' : 'Folder name...'}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFinishAdd()}
              className="bg-transparent text-xs mb-2 outline-none border-b border-[var(--border-glass)] pb-1 placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
            />
            {addingToFolder.type === 'file' && (
              <div className="flex gap-1 mb-2">
                {(['md', 'Tasks', 'Board'] as FileType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setNewFileType(t)}
                    className={cn(
                      "flex-1 p-1 rounded flex justify-center text-[10px] transition-all",
                      newFileType === t ? "bg-[var(--accent)] text-white" : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]"
                    )}
                    title={t}
                  >
                    {TYPE_ICONS[t]}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end text-[10px] font-semibold">
              <button onClick={() => setAddingToFolder(null)} className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]">Cancel</button>
              <button onClick={handleFinishAdd} className="px-2.5 py-1 rounded bg-[var(--accent)] text-white">Create</button>
            </div>
          </div>
        )}

        {/* Render child subnodes */}
        {node.isDirectory && isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // State to support adding new files at root
  const [isAddingAtRoot, setIsAddingAtRoot] = useState<{ type: 'file' | 'folder' } | null>(null);

  const handleFinishRootAdd = () => {
    if (newItemName.trim() && isAddingAtRoot && vaultPath) {
      if (isAddingAtRoot.type === 'file') {
        onAddFile(newItemName.trim(), newFileType, vaultPath);
      } else {
        onAddDirectory(newItemName.trim(), vaultPath);
      }
    }
    setIsAddingAtRoot(null);
  };

  const handleRootAddClick = (type: 'file' | 'folder') => {
    setIsAddingAtRoot({ type });
    setNewItemName('');
    setNewFileType('md');
  };

  const renderFavorites = () => {
    if (favorites.length === 0) return null;
    
    return (
      <div className="mb-3 pb-3 border-b border-[var(--border-glass)]">
        <div className="flex items-center gap-1.5 px-1 mb-2">
          <Star size={11} className="text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Favorites</span>
        </div>
        {favorites.map(favPath => {
          const entry = getFlatFile(favPath);
          if (!entry || entry.isDirectory) return null;
          const isActive = activeFileId === favPath;
          
          return (
            <div
              key={favPath}
              onClick={() => onSelectFile(entry.path, entry.type as FileType, entry.name)}
              className={cn(
                "group flex items-center gap-2 py-1.5 px-2 rounded-xl text-xs font-medium cursor-pointer transition-all select-none hover:bg-black/5 dark:hover:bg-white/5",
                isActive && "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 shadow-sm"
              )}
            >
              <span className={cn("opacity-70 flex-shrink-0", !isActive && "text-[var(--accent)]")}>
                {TYPE_ICONS[entry.type as FileType] || <FileText size={14} />}
              </span>
              <span className="truncate">{entry.name}</span>
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite(favPath); }}
                className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                <Star size={10} className="fill-current text-amber-500" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const vaultName = vaultPath ? vaultPath.split('\\').pop() || vaultPath.split('/').pop() || 'Main Vault' : 'No Vault';

  return (
    <div className="flex h-full border-r border-[var(--border-glass-strong)] transition-colors duration-300 select-none bg-[var(--bg-sidebar)]">
      {/* Activity Bar (Ribbon) */}
      <div className="w-12 h-full flex flex-col items-center py-3 border-r border-[var(--border-glass)] backdrop-blur-[var(--backdrop-blur)] gap-2 flex-shrink-0 bg-black/5 dark:bg-white/5">
        {vaultPath && ([
          { mode: 'files' as SidebarMode, icon: <Files size={18} />, title: 'Files' },
          { mode: 'search' as SidebarMode, icon: <Search size={18} />, title: 'Search', action: onOpenSearch },
          { mode: 'tags' as SidebarMode, icon: <Hash size={18} />, title: 'Tags' },
          { mode: 'calendar' as SidebarMode, icon: <Calendar size={18} />, title: 'Calendar' },
          { mode: 'trash' as SidebarMode, icon: <Trash2 size={18} />, title: 'Trash' },
        ]).map(item => (
          <button
            key={item.mode}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                setSidebarMode(item.mode);
              }
            }}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              sidebarMode === item.mode && !item.action
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10"
            )}
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
        
        <div className="flex-1" />
        
        {/* Bottom Ribbon Utilities */}
        {vaultPath && (
          <button
            onClick={onToggleGraph}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              showGraph ? "text-[var(--accent)] bg-[var(--accent-light)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10"
            )}
            title="Toggle Graph Network"
          >
            <Layers size={18} />
          </button>
        )}
      </div>

      {/* Content Panel */}
      <div className="w-64 h-full flex flex-col backdrop-blur-[var(--backdrop-blur)]">

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {vaultPath ? (
          <>
            {/* FILES MODE */}
            {sidebarMode === 'files' && (
              <>
                {/* Favorites Section */}
                {renderFavorites()}

                {/* Root add buttons */}
                <div className="flex justify-between items-center mb-2 px-1 text-[var(--text-muted)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Files</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleRootAddClick('file')} 
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                      title="Add File at Root"
                    >
                      <Plus size={12} />
                    </button>
                    <button 
                      onClick={() => handleRootAddClick('folder')} 
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                      title="Add Folder at Root"
                    >
                      <FolderPlus size={12} />
                    </button>
                  </div>
                </div>

                {/* Root Add Form */}
                {isAddingAtRoot && (
                  <div className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-2.5 my-1 mx-1 flex flex-col">
                    <input
                      type="text"
                      autoFocus
                      placeholder={isAddingAtRoot.type === 'file' ? 'File name...' : 'Folder name...'}
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleFinishRootAdd()}
                      className="bg-transparent text-xs mb-2 outline-none border-b border-[var(--border-glass)] pb-1 placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
                    />
                    {isAddingAtRoot.type === 'file' && (
                      <div className="flex gap-1 mb-2">
                        {(['md', 'Tasks', 'Board'] as FileType[]).map(t => (
                          <button
                            key={t}
                            onClick={() => setNewFileType(t)}
                            className={cn(
                              "flex-1 p-1 rounded flex justify-center text-[10px] transition-all",
                              newFileType === t ? "bg-[var(--accent)] text-white" : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]"
                            )}
                            title={t}
                          >
                            {TYPE_ICONS[t]}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end text-[10px] font-semibold">
                      <button onClick={() => setIsAddingAtRoot(null)} className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)]">Cancel</button>
                      <button onClick={handleFinishRootAdd} className="px-2.5 py-1 rounded bg-[var(--accent)] text-white">Create</button>
                    </div>
                  </div>
                )}

                {/* Recursively render nodes */}
                {filesTree.length === 0 ? (
                  <div className="py-6 text-center text-[10px] text-[var(--text-muted)] italic">
                    Vault is empty
                  </div>
                ) : (
                  filesTree.map(node => renderNode(node))
                )}
              </>
            )}

            {/* CALENDAR MODE */}
            {sidebarMode === 'calendar' && (
              <div className="space-y-3">
                <CalendarWidget
                  vaultPath={vaultPath}
                  onOpenDailyNote={onOpenDailyNote}
                  existingDailyNotes={existingDailyNotes}
                />
              </div>
            )}

            {/* TAGS MODE */}
            {sidebarMode === 'tags' && (
              <TagsPanel
                cachedFiles={cachedFiles}
                onTagClick={onTagClick}
              />
            )}

            {/* TRASH MODE */}
            {sidebarMode === 'trash' && (
              <TrashPanel
                vaultPath={vaultPath}
                isElectron={isElectron}
                onRestore={onRestoreFromTrash}
                onPermanentDelete={onPermanentDeleteTrash}
                onEmptyTrash={onEmptyTrash}
              />
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-muted)]">
            <Folder size={20} className="mb-2 opacity-30" />
            <span className="text-[10px]">No Vault Selected</span>
          </div>
        )}
      </div>

      {/* Bottom Action Bar (Vault Selector) */}
      <div className="mt-auto flex items-center justify-between p-3 border-t border-[var(--border-glass)] bg-black/5 dark:bg-white/5 relative">
        {vaultPath ? (
          <>
            <button
              onClick={(e) => {
                // simple custom menu context call
                const items = [
                  { id: 'manage', label: 'Manage vaults...', icon: <FolderOpen size={14} />, action: onSelectVault },
                  { id: 'sep1', label: '', separator: true, action: () => {} },
                  { id: 'close', label: 'Close Vault', icon: <LogOut size={14} />, action: onCloseVault }
                ];
                showMenu(e, items);
              }}
              className="flex items-center justify-between w-40 px-3 py-1.5 rounded-lg bg-[var(--bg-glass)] hover:bg-[var(--border-glass)] border border-[var(--border-glass)] transition-colors"
            >
              <span className="text-xs font-semibold text-[var(--text-main)] truncate mr-2">{vaultName}</span>
              <ChevronsUpDown size={14} className="text-[var(--text-muted)] flex-shrink-0" />
            </button>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Help">
                <HelpCircle size={16} />
              </button>
              <button onClick={onOpenSettings} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Settings">
                <Settings size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              onClick={onSelectVault}
              className="flex items-center gap-2 py-1.5 px-4 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-sm w-full justify-center"
            >
              <FolderOpen size={14} /> Open Vault
            </button>
          </div>
        )}
      </div>
      
      {/* End Content Panel */}
      </div>
      <ContextMenuComponent />
    </div>
  );
}
