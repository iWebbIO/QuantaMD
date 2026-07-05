import { useState, useEffect } from 'react';
import { Minus, Square, X, FolderKanban, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { Dropdown, DropdownItem } from './ui/Dropdown';
import { useWorkspace } from '../store';

interface Props {
  onOpenSearch?: () => void;
}

export function TitleBar({ onOpenSearch }: Props) {
  const [isMaximized, setIsMaximized] = useState(false);
  
  const {
    isElectron,
    vaultPath,
    activeFile,
    addFile,
    closeTab,
    activeTabId,
    settings,
    saveAppSettings,
    updateFileContent
  } = useWorkspace();

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;
    
    window.electronAPI.isMaximized().then(setIsMaximized);

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

  const vaultName = vaultPath ? vaultPath.substring(vaultPath.lastIndexOf('\\') + 1) : null;

  const fileItems: DropdownItem[] = [
    { label: 'New File', shortcut: 'Ctrl+N', onClick: () => vaultPath && addFile('Untitled', 'md') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Save', shortcut: 'Ctrl+S', onClick: () => {
      if (activeFile) updateFileContent(activeFile.id, activeFile.content);
    }},
    { label: 'Export to PDF...', onClick: async () => {
      if (window.electronAPI?.exportPdf) {
        await window.electronAPI.exportPdf();
      }
    }},
    { divider: true, label: '', onClick: () => {} },
    { label: 'Close Tab', shortcut: 'Ctrl+W', onClick: () => activeTabId && closeTab(activeTabId) },
    { label: 'Exit', onClick: handleClose }
  ];

  const editItems: DropdownItem[] = [
    { label: 'Undo', shortcut: 'Ctrl+Z', onClick: () => document.execCommand('undo') },
    { label: 'Redo', shortcut: 'Ctrl+Y', onClick: () => document.execCommand('redo') },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Cut', shortcut: 'Ctrl+X', onClick: () => document.execCommand('cut') },
    { label: 'Copy', shortcut: 'Ctrl+C', onClick: () => document.execCommand('copy') },
    { label: 'Paste', shortcut: 'Ctrl+V', onClick: () => document.execCommand('paste') }
  ];

  const viewItems: DropdownItem[] = [
    { label: 'Source View', onClick: () => saveAppSettings({ editorViewMode: 'source' }) },
    { label: 'Split View', onClick: () => saveAppSettings({ editorViewMode: 'split' }) },
    { label: 'Preview Only', onClick: () => saveAppSettings({ editorViewMode: 'preview' }) },
    { divider: true, label: '', onClick: () => {} },
    { label: 'Toggle Fullscreen', shortcut: 'F11', onClick: handleMaximize },
  ];

  return (
    <div className="h-[35px] w-full flex items-center justify-between bg-[var(--bg-sidebar)] border-b border-[var(--border-glass-strong)] select-none -webkit-app-region-drag relative z-50 text-[13px]">
      
      {/* Left: App Branding & Menu */}
      <div className="flex items-center h-full">
        <div className="flex items-center justify-center w-[42px] h-full text-[#007acc] ml-1">
          <FolderKanban size={16} />
        </div>
        
        <div className="flex items-center h-full text-[#cccccc] font-medium -webkit-app-region-no-drag">
          <Dropdown trigger={<span className="px-2.5 py-1 hover:bg-white/10 rounded-md mx-0.5 transition-colors">File</span>} items={fileItems} />
          <Dropdown trigger={<span className="px-2.5 py-1 hover:bg-white/10 rounded-md mx-0.5 transition-colors">Edit</span>} items={editItems} />
          <Dropdown trigger={<span className="px-2.5 py-1 hover:bg-white/10 rounded-md mx-0.5 transition-colors">View</span>} items={viewItems} />
          <Dropdown trigger={<span className="px-2.5 py-1 hover:bg-white/10 rounded-md mx-0.5 transition-colors">Help</span>} items={[{ label: 'About QuantaMD', onClick: () => alert('QuantaMD v1.0') }]} />
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
        <button onClick={handleMinimize} className="flex items-center justify-center w-11 h-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <Minus size={14} />
        </button>
        <button onClick={handleMaximize} className="flex items-center justify-center w-11 h-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <Square size={10} />
        </button>
        <button onClick={handleClose} className="flex items-center justify-center w-11 h-full hover:bg-red-500 hover:text-white text-[var(--text-muted)] transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
