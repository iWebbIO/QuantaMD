import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Type, Regex, FileText, Loader2, CaseSensitive, WholeWord } from 'lucide-react';
import { FileType, SearchResult } from '../types';
import { cn } from '../lib/utils';

interface Props {
  vaultPath: string | null;
  onOpenFile: (path: string, type: FileType, name: string) => void;
  isElectron: boolean;
  cachedFiles?: Record<string, { content: string; name: string; type: FileType; path: string }>;
}

export function SearchPanel({ vaultPath, onOpenFile, isElectron, cachedFiles }: Props) {
  const [query, setQuery] = useState('');
  const [regexMode, setRegexMode] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Web fallback search through cached files
  const searchCachedFiles = useCallback((searchQuery: string): SearchResult[] => {
    if (!cachedFiles || !searchQuery) return [];
    const matched: SearchResult[] = [];

    let pattern: RegExp;
    try {
      let patternStr = regexMode ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) patternStr = `\\b${patternStr}\\b`;
      pattern = new RegExp(patternStr, caseSensitive ? 'g' : 'gi');
    } catch {
      return [];
    }

    for (const [, file] of Object.entries(cachedFiles)) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(line)) !== null) {
          matched.push({
            filePath: file.path,
            fileName: file.name,
            fileType: file.type,
            lineNumber: i + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
          if (!regexMode) break;
        }
      }
    }
    return matched;
  }, [cachedFiles, regexMode, caseSensitive, wholeWord]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (isElectron && window.electronAPI && vaultPath) {
        const res = await window.electronAPI.searchFiles(vaultPath, searchQuery, {
          regex: regexMode,
          caseSensitive,
        });
        setResults(res);
      } else {
        const res = searchCachedFiles(searchQuery);
        setResults(res);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, vaultPath, regexMode, caseSensitive, searchCachedFiles]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, regexMode, caseSensitive, wholeWord, performSearch]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Group results by file
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const existing = map.get(r.filePath);
      if (existing) existing.push(r);
      else map.set(r.filePath, [r]);
    }
    return map;
  }, [results]);

  const renderHighlightedLine = (result: SearchResult) => {
    const { lineContent, matchStart, matchEnd } = result;
    const before = lineContent.slice(Math.max(0, matchStart - 40), matchStart);
    const match = lineContent.slice(matchStart, matchEnd);
    const after = lineContent.slice(matchEnd, matchEnd + 40);
    return (
      <span className="text-[11px] leading-relaxed">
        {matchStart > 40 && <span className="text-[var(--text-muted)]">…</span>}
        <span className="text-[var(--text-muted)]">{before}</span>
        <span className="bg-[var(--accent-light)] text-[var(--accent)] font-semibold rounded px-0.5">{match}</span>
        <span className="text-[var(--text-muted)]">{after}</span>
        {matchEnd + 40 < lineContent.length && <span className="text-[var(--text-muted)]">…</span>}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b border-[var(--border-glass)] space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-glass)] transition-all focus-within:border-[var(--accent)]/40">
          <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent outline-none text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] flex-1 min-w-0"
          />
          {isLoading && <Loader2 size={14} className="text-[var(--accent)] animate-spin flex-shrink-0" />}
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRegexMode(!regexMode)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
              regexMode
                ? "bg-[var(--accent)] text-white"
                : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
            title="Regex Mode"
          >
            <Regex size={11} />
            <span>Regex</span>
          </button>
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
              caseSensitive
                ? "bg-[var(--accent)] text-white"
                : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
            title="Case Sensitive"
          >
            <CaseSensitive size={11} />
            <span>Case</span>
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
              wholeWord
                ? "bg-[var(--accent)] text-white"
                : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
            title="Whole Word"
          >
            <WholeWord size={11} />
            <span>Word</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!hasSearched && !query && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] py-8">
            <Search size={24} className="mb-3 opacity-30" />
            <span className="text-[11px]">Type to search across your vault</span>
          </div>
        )}

        {hasSearched && !isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] py-8">
            <Search size={24} className="mb-3 opacity-30" />
            <span className="text-[11px]">No matches found</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="text-[10px] text-[var(--text-muted)] font-medium px-1 mb-1">
            {results.length} match{results.length !== 1 ? 'es' : ''} in {grouped.size} file{grouped.size !== 1 ? 's' : ''}
          </div>
        )}

        {Array.from(grouped.entries()).map(([filePath, fileResults]) => (
          <div key={filePath} className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl overflow-hidden">
            {/* File header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-glass)]">
              <FileText size={12} className="text-[var(--accent)] flex-shrink-0" />
              <span className="text-[11px] font-semibold text-[var(--text-main)] truncate">
                {fileResults[0].fileName}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] ml-auto flex-shrink-0">
                {fileResults.length}
              </span>
            </div>

            {/* Individual results */}
            <div className="divide-y divide-[var(--border-glass)]">
              {fileResults.map((result, idx) => (
                <button
                  key={`${result.filePath}-${result.lineNumber}-${idx}`}
                  onClick={() => onOpenFile(result.filePath, result.fileType, result.fileName)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--bg-glass-hover)] transition-colors flex items-start gap-2"
                >
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 flex-shrink-0 w-6 text-right">
                    {result.lineNumber}
                  </span>
                  <div className="min-w-0 truncate">
                    {renderHighlightedLine(result)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
