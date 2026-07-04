import { useMemo, useState } from 'react';
import { List, Hash, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  content: string;
  onScrollToHeading: (line: number) => void;
}

interface Heading {
  level: number;  // 1-6
  text: string;
  line: number;   // 1-indexed line number
}

export function OutlinePanel({ content, onScrollToHeading }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeHeadingLine, setActiveHeadingLine] = useState<number | null>(null);

  const headings = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const result: Heading[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track fenced code blocks to skip headings inside them
      if (line.trimStart().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        result.push({
          level: match[1].length,
          text: match[2].replace(/[*_`~]/g, '').trim(), // Strip inline markdown
          line: i + 1,
        });
      }
    }

    return result;
  }, [content]);

  // Find the min level to normalize indentation
  const minLevel = useMemo(
    () => (headings.length > 0 ? Math.min(...headings.map(h => h.level)) : 1),
    [headings]
  );

  const handleClick = (line: number) => {
    setActiveHeadingLine(line);
    onScrollToHeading(line);
  };

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
          <List size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Outline
          </span>
        </div>
        {headings.length > 0 && (
          <span className="text-[10px] text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md font-medium">
            {headings.length}
          </span>
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {headings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] py-8">
              <List size={24} className="mb-3 opacity-30" />
              <span className="text-[11px]">No headings found</span>
            </div>
          ) : (
            headings.map((heading, idx) => {
              const indent = (heading.level - minLevel) * 12;
              const isActive = activeHeadingLine === heading.line;

              return (
                <button
                  key={`${heading.line}-${idx}`}
                  onClick={() => handleClick(heading.line)}
                  className={cn(
                    "w-full text-left flex items-center gap-2 py-1.5 pr-2 rounded-lg transition-all",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  style={{ paddingLeft: `${indent + 8}px` }}
                >
                  <Hash
                    size={10}
                    className={cn(
                      "flex-shrink-0",
                      isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate",
                      heading.level === 1
                        ? "text-xs font-semibold"
                        : heading.level === 2
                          ? "text-[11px] font-medium"
                          : "text-[11px] font-normal"
                    )}
                  >
                    {heading.text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
