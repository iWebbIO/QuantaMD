import { useMemo } from 'react';
import { WorkspaceFile } from '../types';
import { FileText, CheckSquare, Grid, Clock, Type, AlignLeft, Hash } from 'lucide-react';

interface Props {
  activeFile: WorkspaceFile | null;
  vimMode: boolean;
}

export function StatusBar({ activeFile, vimMode }: Props) {
  const stats = useMemo(() => {
    if (!activeFile || activeFile.type !== 'md') return null;

    const content = activeFile.content || '';
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    const lines = content.split('\n').length;
    const readingTime = Math.max(1, Math.ceil(words / 200)); // 200 WPM average

    return { words, chars, lines, readingTime };
  }, [activeFile]);

  const fileTypeLabel = activeFile?.type === 'md' ? 'Markdown' : activeFile?.type === 'Tasks' ? 'Task Board' : activeFile?.type === 'Board' ? 'Pin Board' : '';
  const fileTypeIcon = activeFile?.type === 'md' ? <FileText size={11} /> : activeFile?.type === 'Tasks' ? <CheckSquare size={11} /> : activeFile?.type === 'Board' ? <Grid size={11} /> : null;

  const lastSaved = activeFile ? new Date(activeFile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="status-bar">
      {activeFile && (
        <>
          {/* File type */}
          <div className="status-item">
            {fileTypeIcon}
            <span>{fileTypeLabel}</span>
          </div>

          {/* Word count & reading time (markdown only) */}
          {stats && (
            <>
              <div className="status-item">
                <Type size={11} />
                <span>{stats.words.toLocaleString()} words</span>
              </div>

              <div className="status-item">
                <Hash size={11} />
                <span>{stats.chars.toLocaleString()} chars</span>
              </div>

              <div className="status-item">
                <AlignLeft size={11} />
                <span>{stats.lines} lines</span>
              </div>

              <div className="status-item">
                <Clock size={11} />
                <span>{stats.readingTime} min read</span>
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Vim mode indicator */}
          {vimMode && (
            <div className="status-item">
              <span className="px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)] text-[10px] font-bold">VIM</span>
            </div>
          )}

          {/* Last saved */}
          {lastSaved && (
            <div className="status-item">
              <Clock size={11} />
              <span>Saved {lastSaved}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
