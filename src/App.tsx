import { Sidebar } from './components/Sidebar';
import { MarkdownEditor } from './components/editors/MarkdownEditor';
import { TasksEditor } from './components/editors/TasksEditor';
import { BoardEditor } from './components/editors/BoardEditor';
import { useWorkspace } from './store';
import { Layers } from 'lucide-react';

export default function App() {
  const { files, activeFileId, updateFileContent, addFile, deleteFile, setActiveFileId, theme, setTheme } = useWorkspace();

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--accent)] selection:text-white">
      {/* Sidebar Area */}
      <Sidebar 
        files={files}
        activeFileId={activeFileId}
        onSelect={setActiveFileId}
        onAdd={addFile}
        onDelete={deleteFile}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 p-4 md:p-8 overflow-hidden">
          {activeFile ? (
            <>
              {activeFile.type === 'md' && <MarkdownEditor key={activeFile.id} file={activeFile} onChange={(c) => updateFileContent(activeFile.id, c)} />}
              {activeFile.type === 'Tasks' && <TasksEditor key={activeFile.id} file={activeFile} onChange={(c) => updateFileContent(activeFile.id, c)} />}
              {activeFile.type === 'Board' && <BoardEditor key={activeFile.id} file={activeFile} onChange={(c) => updateFileContent(activeFile.id, c)} />}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-20 h-20 mb-6 rounded-3xl bg-[var(--bg-glass)] border border-[var(--border-glass)] shadow-[var(--shadow-glass)] flex items-center justify-center text-[var(--accent)] backdrop-blur-xl">
                <Layers size={36} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Precision Workspace</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                Select a file from the sidebar or create a new one to start working.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

