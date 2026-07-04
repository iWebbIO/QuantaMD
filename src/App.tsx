import { useState, useEffect } from 'react';
import { useWorkspace } from './store';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { AiAssistant } from './components/AiAssistant';
import { GraphView } from './components/GraphView';
import { MarkdownEditor } from './components/editors/MarkdownEditor';
import { TasksEditor } from './components/editors/TasksEditor';
import { BoardEditor } from './components/editors/BoardEditor';

import { Layers, Sparkles, X, Settings, FileText, CheckSquare, Grid, Plus, Keyboard } from 'lucide-react';
import { FileType } from './types';

export default function App() {
  const {
    isElectron,
    vaultPath,
    filesTree,
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    cachedFiles,
    activeFile,
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
    showFileInExplorer
  } = useWorkspace();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(true);

  // Setup global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P / Cmd+P for Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Ctrl+Comma for Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open file helper
  const handleOpenFile = (path: string, type: FileType, name: string) => {
    setShowGraph(false);
    openFile(path, type, name);
  };

  const getTabIcon = (type: FileType) => {
    if (type === 'md') return <FileText size={12} className="text-[var(--accent)]" />;
    if (type === 'Tasks') return <CheckSquare size={12} className="text-[var(--accent)]" />;
    return <Grid size={12} className="text-[var(--accent)]" />;
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--accent)] selection:text-white">
      {/* Frameless TitleBar Wrapper */}
      <TitleBar vaultPath={vaultPath} activeFileName={activeFile ? activeFile.name : null} />

      {/* Main App Workspace Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isElectron={isElectron}
          vaultPath={vaultPath}
          filesTree={filesTree}
          activeFileId={activeFile ? activeFile.path : null}
          onSelectFile={handleOpenFile}
          onAddFile={addFile}
          onAddDirectory={addDirectory}
          onDeleteEntry={deleteEntry}
          onRenameEntry={renameEntry}
          theme={theme}
          setTheme={setTheme}
          onSelectVault={selectVault}
          onCloseVault={closeVault}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleGraph={() => {
            setShowGraph(prev => !prev);
            setActiveTabId(''); // deselect active tab
          }}
          showGraph={showGraph}
          onShowInExplorer={showFileInExplorer}
        />

        {/* Editor or Graph view panel */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {vaultPath ? (
            <>
              {/* Tab Header bar */}
              <div className="h-11 w-full bg-[var(--bg-sidebar)] border-b border-[var(--border-glass-strong)] flex items-center justify-between px-4 select-none">
                <div className="flex items-center gap-1.5 overflow-x-auto flex-1 h-full py-1 pr-4 no-scrollbar">
                  {tabs.map(tab => {
                    const isTabActive = activeTabId === tab.fileId && !showGraph;
                    return (
                      <div
                        key={tab.fileId}
                        onClick={() => {
                          setShowGraph(false);
                          setActiveTabId(tab.fileId);
                        }}
                        className={`group flex items-center gap-2 px-3.5 h-full rounded-xl text-xs font-semibold cursor-pointer transition-all border border-transparent ${
                          isTabActive
                            ? 'bg-[var(--bg-glass)] border-[var(--border-glass)] text-[var(--text-main)] shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {getTabIcon(tab.type)}
                        <span className="truncate max-w-[120px]">{tab.name}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            closeTab(tab.fileId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/15 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  
                  {tabs.length === 0 && !showGraph && (
                    <span className="text-[10px] text-[var(--text-muted)] font-medium italic">
                      No files open
                    </span>
                  )}
                </div>

                {/* Right utility buttons on tab bar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAiOpen(prev => !prev)}
                    className={`p-1.5 rounded-lg border border-[var(--border-glass)] hover:bg-black/5 dark:hover:bg-white/10 transition-all ${
                      isAiOpen ? 'text-[var(--accent)] bg-[var(--accent-light)]' : 'text-[var(--text-muted)]'
                    }`}
                    title="Toggle AI Copilot"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 relative overflow-hidden">
                {showGraph ? (
                  <GraphView
                    files={filesTree}
                    cachedFiles={cachedFiles}
                    onOpenFile={handleOpenFile}
                  />
                ) : activeFile ? (
                  <div className="absolute inset-0 p-6 md:p-8 overflow-y-auto">
                    {activeFile.type === 'md' && (
                      <MarkdownEditor
                        key={activeFile.id}
                        file={activeFile}
                        onChange={c => updateFileContent(activeFile.id, c)}
                      />
                    )}
                    {activeFile.type === 'Tasks' && (
                      <TasksEditor
                        key={activeFile.id}
                        file={activeFile}
                        onChange={c => updateFileContent(activeFile.id, c)}
                      />
                    )}
                    {activeFile.type === 'Board' && (
                      <BoardEditor
                        key={activeFile.id}
                        file={activeFile}
                        onChange={c => updateFileContent(activeFile.id, c)}
                      />
                    )}
                  </div>
                ) : (
                  /* Dashboard view */
                  <div className="h-full w-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-6">
                    <div className="w-16 h-16 mb-6 rounded-3xl bg-[var(--bg-glass)] border border-[var(--border-glass)] shadow-[var(--shadow-glass)] flex items-center justify-center text-[var(--accent)] backdrop-blur-xl">
                      <Layers size={30} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome to QuantaMD</h2>
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-6">
                      An open-source Obsidian-inspired desktop environment with local filesystem syncing and inline AI document copilots.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => addFile('New Note', 'md')}
                        className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-sidebar)] hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-glass)] rounded-2xl transition-all cursor-pointer"
                      >
                        <Plus size={16} className="text-[var(--accent)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)]">New Note</span>
                      </button>
                      <button
                        onClick={() => setShowGraph(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-sidebar)] hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-glass)] rounded-2xl transition-all cursor-pointer"
                      >
                        <Layers size={16} className="text-[var(--accent)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)]">Graph View</span>
                      </button>
                    </div>

                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-[var(--bg-sidebar)] border border-[var(--border-glass)] rounded-full text-[10px] text-[var(--text-muted)] font-semibold">
                      <Keyboard size={12} />
                      <span>Press Ctrl + P to search and run commands</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Choose vault landing page */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto px-6">
              <div className="w-20 h-20 mb-6 rounded-3xl bg-[var(--bg-glass)] border border-[var(--border-glass)] shadow-[var(--shadow-glass)] flex items-center justify-center text-[var(--accent)] backdrop-blur-xl">
                <Layers size={36} strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">QuantaMD Workspace</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                To begin, select a local folder on your computer to open as your vault directory.
              </p>
              <button
                onClick={selectVault}
                className="px-6 py-3 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 rounded-2xl text-sm font-bold shadow-lg shadow-[var(--accent-light)] transition-all flex items-center gap-2"
              >
                Choose Local Folder
              </button>
            </div>
          )}
        </div>

        {/* Right Collapsible AI Panel */}
        {vaultPath && isAiOpen && (
          <AiAssistant
            activeFile={activeFile}
            geminiApiKey={settings.geminiApiKey}
          />
        )}
      </div>

      {/* Global Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        saveSettings={saveAppSettings}
        selectVault={selectVault}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        files={filesTree}
        onOpenFile={handleOpenFile}
        onAddFile={addFile}
        onSetTheme={setTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleGraph={() => {
          setShowGraph(true);
          setActiveTabId('');
        }}
      />
    </div>
  );
}
