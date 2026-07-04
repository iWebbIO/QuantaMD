import { useState, useEffect } from 'react';
import { WorkspaceFile, BoardItem, BoardItemType } from '../../types';
import { generateId, cn } from '../../lib/utils';
import { Plus, Link as LinkIcon, FileText, Github, Trash2, ExternalLink } from 'lucide-react';

interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
}

export function BoardEditor({ file, onChange }: Props) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemType, setNewItemType] = useState<BoardItemType>('memo');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemTags, setNewItemTags] = useState('');

  useEffect(() => {
    try {
      setItems(JSON.parse(file.content) || []);
    } catch {
      setItems([]);
    }
  }, [file.content]);

  const save = (newItems: BoardItem[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    
    const item: BoardItem = {
      id: generateId(),
      type: newItemType,
      title: newItemTitle.trim(),
      url: (newItemType === 'link' || newItemType === 'repo') ? newItemUrl.trim() : undefined,
      content: newItemType === 'memo' ? newItemContent.trim() : undefined,
      tags: newItemTags.split(',').map(t => t.trim()).filter(Boolean)
    };

    save([item, ...items]);
    setIsAdding(false);
    setNewItemTitle('');
    setNewItemUrl('');
    setNewItemContent('');
    setNewItemTags('');
  };

  const deleteItem = (id: string) => {
    save(items.filter(i => i.id !== id));
  };

  const renderIcon = (type: BoardItemType) => {
    switch (type) {
      case 'memo': return <FileText size={18} />;
      case 'link': return <LinkIcon size={18} />;
      case 'repo': return <Github size={18} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{file.name}</h1>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-sm)] border border-[var(--border-glass)] backdrop-blur-md",
            isAdding ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-glass)] hover:bg-[var(--bg-glass-hover)] text-[var(--text-main)]"
          )}
        >
          <Plus size={16} className={cn("transition-transform", isAdding ? "rotate-45" : "")} /> 
          {isAdding ? "Cancel" : "Add Card"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {isAdding && (
          <div className="mb-6 bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl p-6 shadow-[var(--shadow-glass)] animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl">
            <div className="flex gap-4 mb-4">
              {(['memo', 'link', 'repo'] as BoardItemType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewItemType(t)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                    newItemType === t 
                      ? "bg-[var(--accent)] text-white shadow-md" 
                      : "bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-glass)]"
                  )}
                >
                  {renderIcon(t)} {t}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newItemTitle}
                onChange={e => setNewItemTitle(e.target.value)}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
              
              {newItemType === 'memo' ? (
                <textarea
                  placeholder="Note content..."
                  value={newItemContent}
                  onChange={e => setNewItemContent(e.target.value)}
                  className="w-full h-24 resize-none bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                />
              ) : (
                <input
                  type="url"
                  placeholder="URL (https://...)"
                  value={newItemUrl}
                  onChange={e => setNewItemUrl(e.target.value)}
                  className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                />
              )}

              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newItemTags}
                onChange={e => setNewItemTags(e.target.value)}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleAdd}
                  disabled={!newItemTitle.trim()}
                  className="px-6 py-2 bg-[var(--text-main)] text-[var(--bg-base)] rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Save Card
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {items.map(item => (
            <div 
              key={item.id}
              className="break-inside-avoid bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-glass)] rounded-2xl p-5 shadow-[var(--shadow-glass)] group hover:shadow-lg transition-all duration-300 relative"
            >
              <button 
                onClick={() => deleteItem(item.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={14} />
              </button>
              
              <div className="flex items-center gap-3 mb-3 text-[var(--text-main)]">
                <div className="p-2 bg-[var(--accent-light)] text-[var(--accent)] rounded-xl">
                  {renderIcon(item.type)}
                </div>
                <h3 className="font-semibold text-lg leading-tight pr-6">{item.title}</h3>
              </div>

              {item.type === 'memo' && item.content && (
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {item.content}
                </p>
              )}

              {(item.type === 'link' || item.type === 'repo') && item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--accent)] text-sm font-medium hover:underline mb-4"
                >
                  Visit Link <ExternalLink size={14} />
                </a>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[var(--border-glass-strong)]">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border-glass)] text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
