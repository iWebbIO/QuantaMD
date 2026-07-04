import { useState, useEffect } from 'react';
import { Minus, Square, X, FolderKanban } from 'lucide-react';

interface Props {
  vaultPath: string | null;
  activeFileName: string | null;
}

export function TitleBar({ vaultPath, activeFileName }: Props) {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;
    
    // Check initial maximized state
    window.electronAPI.isMaximized().then(setIsMaximized);

    // Periodically sync maximized state on resize
    const checkState = () => {
      if (window.electronAPI) {
        window.electronAPI.isMaximized().then(setIsMaximized);
      }
    };

    window.addEventListener('resize', checkState);
    return () => window.removeEventListener('resize', checkState);
  }, [isElectron]);

  if (!isElectron) return null;

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => {
    window.electronAPI?.maximize();
    window.electronAPI?.isMaximized().then(setIsMaximized);
  };
  const handleClose = () => window.electronAPI?.close();

  // Get display name for vault
  const vaultName = vaultPath ? vaultPath.substring(vaultPath.lastIndexOf('\\') + 1) : null;

  return (
    <div className="h-10 w-full flex items-center justify-between bg-[var(--bg-sidebar)] border-b border-[var(--border-glass-strong)] select-none select-none -webkit-app-region-drag relative z-50">
      {/* App Branding */}
      <div className="flex items-center gap-2 px-3 text-[var(--text-muted)] text-xs font-semibold">
        <FolderKanban size={15} className="text-[var(--accent)]" />
        <span className="tracking-wide">QuantaMD</span>
      </div>

      {/* Current File / Path Status */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)] max-w-[40%] truncate">
        {vaultName ? (
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-[var(--text-main)] font-semibold">{vaultName}</span>
            {activeFileName && (
              <>
                <span className="opacity-50">/</span>
                <span className="text-[var(--text-main)] truncate">{activeFileName}</span>
              </>
            )}
          </span>
        ) : (
          <span>No Vault Open</span>
        )}
      </div>

      {/* Custom Window Controls */}
      <div className="flex h-full -webkit-app-region-no-drag">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-11 h-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-11 h-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square size={10} />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-11 h-full hover:bg-red-500 hover:text-white text-[var(--text-muted)] transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
