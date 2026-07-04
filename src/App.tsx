import { useState, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { MarkdownEditor } from './components/editors/MarkdownEditor';
import { TasksEditor } from './components/editors/TasksEditor';
import { BoardEditor } from './components/editors/BoardEditor';
import { AiAssistant } from './components/AiAssistant';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { SearchPanel } from './components/SearchPanel';
import { BacklinksPanel } from './components/BacklinksPanel';
import { OutlinePanel } from './components/OutlinePanel';
import { StatusBar } from './components/StatusBar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { GraphView } from './components/GraphView';
import { useWorkspace } from './store';
import { FileType } from './types';
import { X, Bot, Hash, Link as LinkIcon, Command, Search } from 'lucide-react';
import { cn } from './lib/utils';

type RightPanelMode = 'none' | 'ai' | 'outline' | 'backlinks';

function App() {
  const {
    isElectron,
    vaultPath,
    filesTree,
    tabs,
    activeTabId,
    activeFile,
    cachedFiles,
    updateFileContent,
    addFile,
    addDirectory,
    deleteEntry,
    renameEntry,
    theme,
    setTheme,
    settings,
    saveAppSettings,
    selectVault,
    closeVault,
    openFile,
    closeTab,
    moveTab,
    showFileInExplorer,
    favorites,
    toggleFavorite,
    isFavorite,
    trashEntries,
    restoreFromTrash,
    permanentDeleteTrash,
    emptyTrash,
    searchVault,
    openDailyNote,
    getDailyNoteDates,
    refreshTree
  } = useWorkspace();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  
  // New layout state
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('ai');

  // Drag and drop tabs state
  const [draggedTabIdx, setDraggedTabIdx] = useState<number | null>(null);
  
  // Editor ref for inserting text
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Ctrl+P or Cmd+P)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Toggle Search Panel (Ctrl+Shift+F)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowSearchPanel(true);
      }
      // Close tab (Ctrl+W)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        if (activeTabId) {
          e.preventDefault();
          closeTab(activeTabId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, closeTab]);

  const toggleRightPanel = (mode: RightPanelMode) => {
    setRightPanelMode(prev => prev === mode ? 'none' : mode);
  };

  const handleInsertContent = (content: string) => {
    if (activeFile && activeFile.type === 'md' && activeTabId) {
      // Very simple insertion: just append to content if we can't get the editor ref easily
      updateFileContent(activeTabId, activeFile.content + '\n' + content);
    }
  };

  const handleTabDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTabIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTabIdx !== null && draggedTabIdx !== index) {
      moveTab(draggedTabIdx, index);
    }
    setDraggedTabIdx(null);
  };

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden transition-colors duration-300", theme === 'light' ? 'bg-[#f5f5f7]' : theme === 'amoled' ? 'bg-black' : 'bg-[#1c1c1e]')}>
      {isElectron && <TitleBar vaultPath={vaultPath} activeFileName={activeFile?.name || null} onOpenSearch={() => setIsCommandPaletteOpen(true)} />}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar or Search Panel */}
        {showSearchPanel ? (
          <div className="w-80 flex-shrink-0 border-r border-[var(--border-glass-strong)] bg-[var(--bg-sidebar)] flex flex-col h-full">
            <div className="p-3 border-b border-[var(--border-glass)] flex justify-between items-center bg-black/5 dark:bg-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <Search size={14} /> Global Search
              </span>
              <button 
                onClick={() => setShowSearchPanel(false)}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <SearchPanel
                vaultPath={vaultPath}
                isElectron={isElectron}
                onOpenFile={(path, type, name) => {
                  openFile(path, type, name);
                  setShowSearchPanel(false);
                }}
                cachedFiles={cachedFiles}
              />
            </div>
          </div>
        ) : (
          <Sidebar
            isElectron={isElectron}
            vaultPath={vaultPath}
            filesTree={filesTree}
            activeFileId={activeTabId}
            onSelectFile={openFile}
            onAddFile={addFile}
            onAddDirectory={addDirectory}
            onDeleteEntry={deleteEntry}
            onRenameEntry={renameEntry}
            onSelectVault={selectVault}
            onCloseVault={closeVault}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleGraph={() => setShowGraph(!showGraph)}
            showGraph={showGraph}
            onShowInExplorer={showFileInExplorer}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            cachedFiles={cachedFiles}
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
            onOpenDailyNote={openDailyNote}
            existingDailyNotes={getDailyNoteDates()}
            trashEntries={trashEntries}
            onRestoreFromTrash={restoreFromTrash}
            onPermanentDeleteTrash={permanentDeleteTrash}
            onEmptyTrash={emptyTrash}
            onTagClick={(tag) => {
              // Open search panel with tag query
              // For simplicity, we just toggle command palette for now
              setIsCommandPaletteOpen(true); 
            }}
          />
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative z-0 min-w-0">
          {/* Tab Bar */}
          <div className="flex items-end bg-[var(--bg-sidebar)] border-b border-[var(--border-glass)] backdrop-blur-md overflow-x-auto no-scrollbar pl-2 pr-4 pt-1 h-9">
            {tabs.map((tab, idx) => (
              <div
                key={tab.fileId}
                draggable
                onDragStart={(e) => handleTabDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTabDrop(e, idx)}
                onClick={() => openFile(tab.fileId, tab.type, tab.name)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-1.5 min-w-[100px] max-w-[200px] border-r border-t border-l rounded-t-lg cursor-pointer transition-all select-none -mb-[1px] cursor-grab active:cursor-grabbing",
                  activeTabId === tab.fileId
                    ? "bg-[var(--bg-base)] border-[var(--border-glass-strong)] text-[var(--text-main)] font-semibold shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10"
                    : "bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-glass)] z-0"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", tab.type === 'md' ? 'bg-blue-500' : tab.type === 'Tasks' ? 'bg-green-500' : 'bg-orange-500')} />
                <span className="truncate flex-1 text-xs">{tab.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.fileId);
                  }}
                  className={cn(
                    "p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all",
                    activeTabId === tab.fileId && "opacity-100"
                  )}
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <div className="flex-1" />
            
            {/* Right Panel Toggles */}
            <div className="flex items-center gap-1 mb-1">
              {activeFile?.type === 'md' && (
                <button
                  onClick={() => toggleRightPanel('outline')}
                  className={cn("p-1 rounded transition-colors", rightPanelMode === 'outline' ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-glass)] text-[var(--text-muted)]")}
                  title="Toggle Outline"
                >
                  <Hash size={14} />
                </button>
              )}
              <button
                onClick={() => toggleRightPanel('backlinks')}
                className={cn("p-1 rounded transition-colors", rightPanelMode === 'backlinks' ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-glass)] text-[var(--text-muted)]")}
                title="Toggle Backlinks"
              >
                <LinkIcon size={14} />
              </button>
              <button
                onClick={() => toggleRightPanel('ai')}
                className={cn("p-1 rounded transition-colors", rightPanelMode === 'ai' ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-glass)] text-[var(--text-muted)]")}
                title="Toggle AI Copilot"
              >
                <Bot size={14} />
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <Breadcrumbs 
            vaultPath={vaultPath}
            activeFilePath={activeFile?.path || null}
            activeFileName={activeFile?.name || null}
            activeFileType={activeFile?.type || null}
          />

          {/* Editor Content */}
          <div className="flex-1 relative overflow-hidden bg-[var(--bg-base)]">
            {showGraph ? (
              <GraphView files={filesTree} cachedFiles={cachedFiles} onOpenFile={openFile} />
            ) : activeFile ? (
              activeFile.type === 'md' ? (
                  <MarkdownEditor 
                    file={activeFile} 
                    onChange={(val) => updateFileContent(activeTabId!, val)} 
                    theme={theme}
                    settings={settings}
                  />
              ) : activeFile.type === 'Tasks' ? (
                <TasksEditor 
                  file={activeFile} 
                  onChange={(val) => updateFileContent(activeTabId!, val)} 
                />
              ) : (
                <BoardEditor 
                  file={activeFile} 
                  onChange={(val) => updateFileContent(activeTabId!, val)} 
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                <Command size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium mb-2">Select a file or press <kbd className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded ml-1">Ctrl+P</kbd> to search</p>
              </div>
            )}
          </div>
          
          {/* Status Bar */}
          <StatusBar 
            activeFile={activeFile}
            vimMode={settings.vimMode}
          />
        </div>

        {/* Dynamic Right Panel */}
        {rightPanelMode !== 'none' && (
          <div className="w-80 flex-shrink-0 flex flex-col h-full z-10 bg-[var(--bg-sidebar)] border-l border-[var(--border-glass-strong)] shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
            {rightPanelMode === 'ai' && (
              <AiAssistant
                aiEnabled={settings.aiEnabled}
                aiEndpoint={settings.aiEndpoint}
                aiModel={settings.aiModel}
                aiApiKey={settings.aiApiKey}
                activeFileContent={activeFile?.content || ''}
                activeFileName={activeFile?.name || ''}
                onInsertContent={handleInsertContent}
              />
            )}
            
            {rightPanelMode === 'outline' && activeFile?.type === 'md' && (
              <OutlinePanel 
                content={activeFile.content}
                onScrollToHeading={(line) => {
                  // Scrolling implementation would ideally dispatch to CodeMirror View
                  console.log('Scroll to line', line);
                }}
              />
            )}
            
            {rightPanelMode === 'backlinks' && (
              <BacklinksPanel 
                activeFile={activeFile ? { name: activeFile.name, path: activeFile.path } : null}
                cachedFiles={cachedFiles}
                onOpenFile={openFile}
              />
            )}
          </div>
        )}
      </div>

      {/* Overlays */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        saveSettings={saveAppSettings}
        selectVault={selectVault}
        theme={theme}
        setTheme={setTheme}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        filesTree={filesTree}
        onSelectFile={openFile}
        onAddFile={() => {
          if (vaultPath) addFile('New File', 'md');
        }}
        onAddFolder={() => {
          if (vaultPath) addDirectory('New Folder');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleVim={() => saveAppSettings({ vimMode: !settings.vimMode })}
        onToggleFavorites={() => activeFile && toggleFavorite(activeFile.path)}
        onOpenSearchPanel={() => setShowSearchPanel(true)}
        onToggleBacklinks={() => toggleRightPanel('backlinks')}
        onToggleOutline={() => toggleRightPanel('outline')}
        onToggleAi={() => toggleRightPanel('ai')}
      />
    </div>
  );
}

export default App;
