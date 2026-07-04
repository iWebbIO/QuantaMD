import { useState, useEffect } from 'react';
import { Minus, Square, X, FolderKanban, Search, ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  vaultPath: string | null;
  activeFileName: string | null;
  onOpenSearch?: () => void;
}

export function TitleBar({ vaultPath, activeFileName, onOpenSearch }: Props) {
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
    <div className="h-[35px] w-full flex items-center justify-between bg-[var(--bg-sidebar)] border-b border-[var(--border-glass-strong)] select-none -webkit-app-region-drag relative z-50 text-[13px]">
      
      {/* Left: App Branding & Menu */}
      <div className="flex items-center h-full">
        <div className="flex items-center justify-center w-[42px] h-full text-[#007acc] ml-1">
          <FolderKanban size={16} />
        </div>
        
        <div className="flex items-center h-full text-[#cccccc] font-medium -webkit-app-region-no-drag">
          {['File', 'Edit', 'Selection', 'View', 'Go', 'Help'].map(item => (
            <button key={item} className="px-2.5 h-[26px] hover:bg-white/10 rounded-md mx-0.5 transition-colors text-[13px] flex items-center justify-center cursor-default">
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Navigation & Search */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center h-full max-w-[500px] w-full px-4 -webkit-app-region-no-drag">
        <div className="flex items-center gap-1 mr-3 text-[var(--text-muted)]">
          <button className="p-1 hover:bg-white/10 rounded-md transition-colors"><ArrowLeft size={16} /></button>
          <button className="p-1 hover:bg-white/10 rounded-md transition-colors"><ArrowRight size={16} /></button>
        </div>
        
        <button 
          onClick={onOpenSearch}
          className="flex-1 flex items-center justify-center gap-2 h-[24px] bg-[#2d2d2d]/80 hover:bg-[#3c3c3c] border border-white/10 rounded-md text-[#cccccc] transition-colors max-w-[400px]"
        >
          <Search size={14} />
          <span className="text-xs">{vaultName ? `Search ${vaultName}` : 'Search'}</span>
        </button>
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
