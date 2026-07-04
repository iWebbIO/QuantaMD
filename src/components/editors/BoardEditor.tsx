import { useState, useEffect } from 'react';
import { WorkspaceFile, BoardItem, BoardItemType } from '../../types';
import { ExternalLink, Hash, Link as LinkIcon, StickyNote, Github, Plus, X, Grid, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useContextMenu, ContextMenuItem } from '../ContextMenu';
import { parseBoard, serializeBoard } from '../../lib/markdown-parser';

interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
}

const TYPE_ICONS: Record<BoardItemType, any> = {
  memo: StickyNote,
  link: LinkIcon,
  repo: Github
};

export function BoardEditor({ file, onChange }: Props) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<BoardItem | null>(null);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const { showMenu, ContextMenuComponent } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, item: BoardItem) => {
    e.preventDefault();
    e.stopPropagation();
    showMenu(e, [
      { id: 'edit', label: 'Edit Content', icon: <Edit2 size={14} />, action: () => startEditing(item) },
      { id: 'delete', label: 'Delete Item', icon: <Trash2 size={14} />, action: () => {
          if (confirm('Are you sure you want to delete this item?')) deleteItem(item.id);
        }, danger: true 
      }
    ]);
  };

  useEffect(() => {
    try {
      if (file.content.trim().startsWith('[') || file.content.trim().startsWith('{')) {
        setItems(JSON.parse(file.content || '[]'));
      } else {
        setItems(parseBoard(file.content || ''));
      }
    } catch (e) {
      setItems([]);
    }
  }, [file.content]);

  const saveItems = (newItems: BoardItem[]) => {
    setItems(newItems);
    onChange(serializeBoard(newItems));
  };

  const addItem = (type: BoardItemType) => {
    const newItem: BoardItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: 'New ' + type,
      content: type === 'memo' ? 'Write something...' : undefined,
      url: type !== 'memo' ? 'https://' : undefined,
      tags: []
    };
    saveItems([newItem, ...items]);
    startEditing(newItem);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  // Drag and drop for reordering
  const handleDragStart = (e: React.DragEvent, item: BoardItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetItem: BoardItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // Simple reorder logic: swap position
    const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
    const targetIndex = items.findIndex(i => i.id === targetItem.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newItems = [...items];
      newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      // We don't save immediately on every hover to avoid jumping, we just update local state visually
      setItems(newItems);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      onChange(serializeBoard(items)); // Persist the new order
      setDraggedItem(null);
    }
  };

  const startEditing = (item: BoardItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content || '');
    setEditUrl(item.url || '');
  };

  const saveEditing = () => {
    if (!editingId) return;
    const newItems = items.map(item => {
      if (item.id === editingId) {
        return {
          ...item,
          title: editTitle,
          content: item.type === 'memo' ? editContent : undefined,
          url: item.type !== 'memo' ? editUrl : undefined
        };
      }
      return item;
    });
    saveItems(newItems);
    setEditingId(null);
  };

  const renderItem = (item: BoardItem) => {
    const Icon = TYPE_ICONS[item.type];
    const isEditing = editingId === item.id;
    const isDragging = draggedItem?.id === item.id;

    if (isEditing) {
      return (
        <div key={item.id} className="relative group bg-[var(--bg-glass)] backdrop-blur-[var(--backdrop-blur)] border border-[var(--accent)] rounded-2xl p-5 break-inside-avoid shadow-lg animate-fade-in flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Icon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.type}</span>
          </div>
          <input
            autoFocus
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && item.type !== 'memo' && saveEditing()}
            className="text-base font-bold bg-transparent outline-none text-[var(--text-main)] w-full border-b border-[var(--border-glass)] pb-1"
            placeholder="Title"
          />
          {item.type === 'memo' ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onBlur={saveEditing}
              className="text-sm bg-transparent outline-none text-[var(--text-muted)] w-full resize-none min-h-[100px]"
              placeholder="Content..."
            />
          ) : (
            <input
              type="text"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveEditing()}
              onBlur={saveEditing}
              className="text-xs bg-transparent outline-none text-[var(--accent)] w-full font-mono"
              placeholder="https://..."
            />
          )}
          <button onClick={saveEditing} className="mt-2 text-xs bg-[var(--accent)] text-white py-1 rounded-lg">Save</button>
        </div>
      );
    }

    return (
      <div 
        key={item.id} 
        draggable
        onDragStart={e => handleDragStart(e, item)}
        onDragOver={e => handleDragOver(e, item)}
        onDrop={handleDrop}
        onDoubleClick={() => startEditing(item)}
        onContextMenu={(e) => handleContextMenu(e, item)}
        className={cn(
          "relative group bg-[var(--bg-glass)] backdrop-blur-[var(--backdrop-blur)] border border-[var(--border-glass-strong)] rounded-2xl p-5 break-inside-avoid shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 scale-95"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Icon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.type}</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-[var(--text-main)] mb-2 leading-tight">
          {item.title}
        </h3>

        {item.type === 'memo' && item.content && (
          <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap mb-4 leading-relaxed line-clamp-6">
            {item.content}
          </p>
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] bg-[var(--accent-light)] px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity mb-4 break-all"
          >
            {item.url.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
          </a>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => (
              <span key={tag} className="tag-pill">
                <Hash size={10} /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 z-10 sticky top-0 bg-transparent">
        <div className="flex flex-col">
          <input
            type="text"
            className="text-3xl font-bold bg-transparent outline-none text-[var(--text-main)] w-full placeholder:text-[var(--text-muted)] drop-shadow-sm"
            value={file.name}
            readOnly
          />
          <span className="text-xs text-[var(--text-muted)] font-medium mt-1">
            Double-click or right-click a card to edit. Drag to reorder.
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-glass)] p-1.5 rounded-xl shadow-sm">
          {(Object.keys(TYPE_ICONS) as BoardItemType[]).map(type => {
            const Icon = TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => addItem(type)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white transition-all capitalize"
              >
                <Plus size={14} /> {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 no-scrollbar">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {items.map(item => renderItem(item))}
        </div>
        {items.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--text-muted)] border-2 border-dashed border-[var(--border-glass)] rounded-2xl opacity-50">
            <Grid size={32} className="mb-4" />
            <p className="text-sm font-medium">Board is empty. Add a memo, link, or repo above.</p>
          </div>
        )}
      </div>
      <ContextMenuComponent />
    </div>
  );
}
