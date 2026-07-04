import { useState, useEffect } from 'react';
import { WorkspaceFile, TaskItem, TaskStatus } from '../../types';
import { generateId, cn } from '../../lib/utils';
import { Plus, GripVertical } from 'lucide-react';

interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' }
];

export function TasksEditor({ file, onChange }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addingToCol, setAddingToCol] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    try {
      setTasks(JSON.parse(file.content) || []);
    } catch {
      setTasks([]);
    }
  }, [file.content]);

  const save = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    onChange(JSON.stringify(newTasks));
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDrop = (status: TaskStatus) => {
    if (!draggingId) return;
    save(tasks.map(t => t.id === draggingId ? { ...t, status } : t));
    setDraggingId(null);
  };

  const handleAdd = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) {
      setAddingToCol(null);
      return;
    }
    save([...tasks, { id: generateId(), title: newTaskTitle.trim(), status }]);
    setNewTaskTitle('');
    setAddingToCol(null);
  };

  const deleteTask = (id: string) => {
    save(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{file.name}</h1>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div 
            key={col.id} 
            className="flex-1 min-w-[300px] flex flex-col bg-[var(--bg-sidebar)] backdrop-blur-md rounded-2xl p-4 border border-[var(--border-glass)] shadow-[var(--shadow-glass)] transition-colors duration-300"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-semibold text-[var(--text-muted)] tracking-wide uppercase text-sm">
                {col.label}
              </h2>
              <span className="bg-[var(--border-glass-strong)] text-[var(--text-main)] text-xs py-1 px-2 rounded-full font-medium">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className={cn(
                    "group bg-[var(--bg-glass)] hover:bg-[var(--bg-glass-hover)] p-4 rounded-xl shadow-[var(--shadow-sm)] border border-[var(--border-glass)] cursor-grab active:cursor-grabbing transition-all",
                    draggingId === task.id ? "opacity-50" : "opacity-100"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical size={16} className="text-[var(--text-muted)] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{task.title}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {addingToCol === col.id ? (
                <div className="bg-[var(--bg-glass)] p-3 rounded-xl border border-[var(--accent)] shadow-sm">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAdd(col.id);
                      if (e.key === 'Escape') setAddingToCol(null);
                    }}
                    onBlur={() => handleAdd(col.id)}
                    placeholder="Task title..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>
              ) : (
                <button 
                  onClick={() => setAddingToCol(col.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border-glass-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <Plus size={16} /> Add Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
