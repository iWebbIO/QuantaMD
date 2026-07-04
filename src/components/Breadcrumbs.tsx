import { useMemo } from 'react';
import { ChevronRight, FolderOpen, FileText, CheckSquare, Grid } from 'lucide-react';
import { FileType } from '../types';

interface Props {
  vaultPath: string | null;
  activeFilePath: string | null;
  activeFileType: FileType | null;
  activeFileName: string | null;
}

export function Breadcrumbs({ vaultPath, activeFilePath, activeFileType, activeFileName }: Props) {
  const segments = useMemo(() => {
    if (!vaultPath || !activeFilePath) return [];

    const vaultName = vaultPath.substring(vaultPath.lastIndexOf('\\') + 1);
    
    // Get relative path from vault
    let relativePath = activeFilePath;
    if (activeFilePath.startsWith(vaultPath)) {
      relativePath = activeFilePath.substring(vaultPath.length + 1);
    }

    const parts = relativePath.split('\\').filter(Boolean);
    const result: { label: string; isFile: boolean; path: string }[] = [
      { label: vaultName, isFile: false, path: vaultPath }
    ];

    let currentPath = vaultPath;
    for (let i = 0; i < parts.length; i++) {
      currentPath += '\\' + parts[i];
      const isLast = i === parts.length - 1;
      const label = isLast && activeFileName ? activeFileName : parts[i].replace(/\.(md|tasks|board)$/, '');
      result.push({ label, isFile: isLast, path: currentPath });
    }

    return result;
  }, [vaultPath, activeFilePath, activeFileName]);

  if (segments.length === 0) return null;

  const getIcon = () => {
    if (activeFileType === 'md') return <FileText size={11} className="text-[var(--accent)]" />;
    if (activeFileType === 'Tasks') return <CheckSquare size={11} className="text-[var(--accent)]" />;
    if (activeFileType === 'Board') return <Grid size={11} className="text-[var(--accent)]" />;
    return null;
  };

  return (
    <div className="breadcrumbs border-b border-[var(--border-glass)]">
      {segments.map((seg, idx) => (
        <span key={seg.path} className="flex items-center gap-1">
          {idx > 0 && (
            <ChevronRight size={10} className="breadcrumb-separator" />
          )}
          <span className="breadcrumb-item flex items-center gap-1">
            {idx === 0 && <FolderOpen size={11} />}
            {seg.isFile && getIcon()}
            <span className={seg.isFile ? 'font-medium text-[var(--text-main)]' : ''}>
              {seg.label}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
