import { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { TrashEntry } from '../types';
import { cn } from '../lib/utils';

interface Props {
  vaultPath: string | null;
  isElectron: boolean;
  onRestore: (entry: TrashEntry) => void;
  onPermanentDelete: (trashPath: string) => void;
  onEmptyTrash: () => void;
}

function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

function truncatePath(path: string, maxLen = 30): string {
  if (path.length <= maxLen) return path;
  const parts = path.split(/[\\/]/);
  if (parts.length <= 2) return '…' + path.slice(-maxLen);
  return parts[0] + '/…/' + parts.slice(-2).join('/');
}

export function TrashPanel({ vaultPath, isElectron, onRestore, onPermanentDelete, onEmptyTrash }: Props) {
  const [entries, setEntries] = useState<TrashEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const loadTrash = useCallback(async () => {
    if (!isElectron || !window.electronAPI || !vaultPath) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    try {
      const list = await window.electronAPI.listTrash(vaultPath);
      // Sort newest first
      list.sort((a, b) => b.deletedAt - a.deletedAt);
      setEntries(list);
    } catch (err) {
      console.error('Failed to load trash:', err);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, vaultPath]);

  // Load on mount and when vaultPath changes
  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (entry: TrashEntry) => {
    onRestore(entry);
    // Optimistically remove from list
    setEntries(prev => prev.filter(e => e.trashPath !== entry.trashPath));
  };

  const handlePermanentDelete = (trashPath: string) => {
    if (confirm('Permanently delete this file? This cannot be undone.')) {
      onPermanentDelete(trashPath);
      setEntries(prev => prev.filter(e => e.trashPath !== trashPath));
    }
  };

  const handleEmptyTrash = () => {
    if (confirmEmpty) {
      onEmptyTrash();
      setEntries([]);
      setConfirmEmpty(false);
    } else {
      setConfirmEmpty(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmEmpty(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-glass)]">
        <div className="flex items-center gap-2">
          <Trash2 size={14} className="text-[var(--text-muted)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Trash
          </span>
          {entries.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-medium">
              {entries.length}
            </span>
          )}
        </div>

        {entries.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all",
              confirmEmpty
                ? "bg-red-500 text-white"
                : "text-red-500 hover:bg-red-500/10"
            )}
          >
            <AlertTriangle size={11} />
            <span>{confirmEmpty ? 'Confirm Empty' : 'Empty Trash'}</span>
          </button>
        )}
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
            <span className="text-[11px]">Loading…</span>
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] py-8">
            <Trash2 size={24} className="mb-3 opacity-30" />
            <span className="text-[11px]">Trash is empty</span>
          </div>
        )}

        {entries.map(entry => (
          <div
            key={entry.trashPath}
            className="group bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-2.5 hover:bg-[var(--bg-glass-hover)] transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                  {entry.fileName}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5" title={entry.originalPath}>
                  {truncatePath(entry.originalPath)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-1">
                  <Clock size={9} />
                  <span>{relativeTime(entry.deletedAt)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => handleRestore(entry)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--accent)] transition-all"
                  title="Restore"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => handlePermanentDelete(entry.trashPath)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                  title="Permanent Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
