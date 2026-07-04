import { useMemo, useState } from 'react';
import { Link2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { FileType } from '../types';
import { cn } from '../lib/utils';

interface Props {
  activeFile: { name: string; path: string } | null;
  cachedFiles: Record<string, { content: string; name: string; type: FileType; path: string }>;
  onOpenFile: (path: string, type: FileType, name: string) => void;
}

interface Backlink {
  filePath: string;
  fileName: string;
  fileType: FileType;
  contexts: { lineNumber: number; lineContent: string; matchStart: number; matchEnd: number }[];
}

export function BacklinksPanel({ activeFile, cachedFiles, onOpenFile }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const backlinks = useMemo(() => {
    if (!activeFile) return [];

    // Strip file extension from name for matching
    const baseName = activeFile.name.replace(/\.[^.]+$/, '');
    // Escape special regex chars in the name
    const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\[\\[${escaped}(\\|[^\\]]*)?\\]\\]`, 'g');

    const results: Backlink[] = [];

    for (const [, file] of Object.entries(cachedFiles)) {
      // Don't include self-references
      if (file.path === activeFile.path) continue;

      const lines = file.content.split('\n');
      const contexts: Backlink['contexts'] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          contexts.push({
            lineNumber: i + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }

      if (contexts.length > 0) {
        results.push({
          filePath: file.path,
          fileName: file.name,
          fileType: file.type,
          contexts,
        });
      }
    }

    // Sort by file name
    results.sort((a, b) => a.fileName.localeCompare(b.fileName));
    return results;
  }, [activeFile, cachedFiles]);

  const totalCount = useMemo(
    () => backlinks.reduce((sum, bl) => sum + bl.contexts.length, 0),
    [backlinks]
  );

  const renderContext = (ctx: { lineContent: string; matchStart: number; matchEnd: number }) => {
    const { lineContent, matchStart, matchEnd } = ctx;
    const before = lineContent.slice(Math.max(0, matchStart - 30), matchStart);
    const match = lineContent.slice(matchStart, matchEnd);
    const after = lineContent.slice(matchEnd, matchEnd + 30);
    return (
      <span className="text-[11px] leading-relaxed">
        {matchStart > 30 && <span className="text-[var(--text-muted)]">…</span>}
        <span className="text-[var(--text-muted)]">{before}</span>
        <span className="bg-[var(--accent-light)] text-[var(--accent)] font-semibold rounded px-0.5">{match}</span>
        <span className="text-[var(--text-muted)]">{after}</span>
        {matchEnd + 30 < lineContent.length && <span className="text-[var(--text-muted)]">…</span>}
      </span>
    );
  };

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] p-4">
        <Link2 size={20} className="mb-2 opacity-30" />
        <span className="text-[10px]">Select a file to see backlinks</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between p-3 border-b border-[var(--border-glass)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          )}
          <Link2 size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Backlinks
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-medium">
          {totalCount}
        </span>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {backlinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-[var(--text-muted)] py-8">
              <Link2 size={24} className="mb-3 opacity-30" />
              <span className="text-[11px] leading-relaxed">
                No backlinks found.<br />
                Link to this note with{' '}
                <span className="font-mono text-[var(--accent)]">[[{activeFile.name.replace(/\.[^.]+$/, '')}]]</span>
              </span>
            </div>
          ) : (
            backlinks.map(bl => (
              <div
                key={bl.filePath}
                className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl overflow-hidden"
              >
                {/* File link header */}
                <button
                  onClick={() => onOpenFile(bl.filePath, bl.fileType, bl.fileName)}
                  className="w-full flex items-center gap-2 px-3 py-2 border-b border-[var(--border-glass)] hover:bg-[var(--bg-glass-hover)] transition-colors text-left"
                >
                  <FileText size={12} className="text-[var(--accent)] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-[var(--text-main)] truncate">
                    {bl.fileName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto flex-shrink-0">
                    {bl.contexts.length}
                  </span>
                </button>

                {/* Context snippets */}
                <div className="divide-y divide-[var(--border-glass)]">
                  {bl.contexts.map((ctx, idx) => (
                    <div
                      key={`${bl.filePath}-${ctx.lineNumber}-${idx}`}
                      className="px-3 py-2 flex items-start gap-2"
                    >
                      <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 flex-shrink-0 w-5 text-right">
                        {ctx.lineNumber}
                      </span>
                      <div className="min-w-0 truncate">
                        {renderContext(ctx)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
