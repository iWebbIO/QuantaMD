import { useMemo, useState } from 'react';
import { Hash, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  cachedFiles: Record<string, { content: string }>;
  onTagClick: (tag: string) => void;
}

type SortMode = 'alpha' | 'count';

export function TagsPanel({ cachedFiles, onTagClick }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('count');

  const tags = useMemo(() => {
    const tagMap = new Map<string, number>();
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;

    for (const [, file] of Object.entries(cachedFiles)) {
      let match: RegExpExecArray | null;
      tagRegex.lastIndex = 0;
      const content = file.content;
      while ((match = tagRegex.exec(content)) !== null) {
        const tag = match[1];
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }

    const entries = Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));

    if (sortMode === 'alpha') {
      entries.sort((a, b) => a.tag.localeCompare(b.tag));
    } else {
      entries.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    }

    return entries;
  }, [cachedFiles, sortMode]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-glass)]">
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tags
          </span>
          {tags.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-medium">
              {tags.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setSortMode(sortMode === 'alpha' ? 'count' : 'alpha')}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          title={sortMode === 'alpha' ? 'Sort by count' : 'Sort alphabetically'}
        >
          {sortMode === 'alpha' ? <SortAsc size={12} /> : <SortDesc size={12} />}
          <span>{sortMode === 'alpha' ? 'A-Z' : 'Count'}</span>
        </button>
      </div>

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto p-3">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] py-8">
            <Hash size={24} className="mb-3 opacity-30" />
            <span className="text-[11px] leading-relaxed">
              No tags found.<br />
              Use <span className="font-mono text-[var(--accent)]">#hashtags</span> in your notes.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                  "bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white",
                  "border border-transparent hover:border-[var(--accent)]"
                )}
              >
                <Hash size={10} />
                <span>{tag}</span>
                <span className="text-[9px] opacity-70 ml-0.5">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
