import { useState, useEffect } from 'react';
import { WorkspaceFile, TaskItem, TaskStatus, TaskPriority, SubTask } from '../../types';
import { Plus, GripVertical, CheckCircle2, Clock, ListTodo, AlertCircle, X, CheckSquare, Calendar, AlignLeft, Flag, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useContextMenu, ContextMenuItem } from '../ContextMenu';
import { parseTasks, serializeTasks } from '../../lib/markdown-parser';

interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string; icon: any }[] = [
  { id: 'todo', title: 'To Do', icon: ListTodo },
  { id: 'in-progress', title: 'In Progress', icon: Clock },
  { id: 'done', title: 'Done', icon: CheckCircle2 }
];

const PRIORITIES: { id: TaskPriority; label: string; colorClass: string }[] = [
  { id: 'high', label: 'High', colorClass: 'priority-high' },
  { id: 'medium', label: 'Medium', colorClass: 'priority-medium' },
  { id: 'low', label: 'Low', colorClass: 'priority-low' },
  { id: 'none', label: 'None', colorClass: 'priority-none' },
];

export function TasksEditor({ file, onChange }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  
  // Detail Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const { showMenu, ContextMenuComponent } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent, task: TaskItem) => {
    e.preventDefault();
    e.stopPropagation();
    showMenu(e, [
      { id: 'edit', label: 'Edit Task Details', icon: <Edit2 size={14} />, action: () => setEditingTask(task) },
      { id: 'delete', label: 'Delete Task', icon: <Trash2 size={14} />, action: () => {
          if (confirm('Are you sure you want to delete this task?')) deleteTask(task.id);
        }, danger: true 
      }
    ]);
  };

  useEffect(() => {
    try {
      if (file.content.trim().startsWith('[') || file.content.trim().startsWith('{')) {
        const parsed = JSON.parse(file.content || '[]');
        const upgradedTasks = parsed.map((t: any) => ({
          id: t.id,
          title: t.title || 'Untitled Task',
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'none',
          dueDate: t.dueDate || undefined,
          subtasks: t.subtasks || []
        }));
        setTasks(upgradedTasks);
      } else {
        const parsed = parseTasks(file.content || '');
        setTasks(parsed);
      }
    } catch (e) {
      setTasks([]);
    }
  }, [file.content]);

  const saveTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    const titleMatch = file.content.match(/^# (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : file.name.replace('.md', '').replace('.tasks', '');
    onChange(serializeTasks(newTasks, title));
  };

  const addTask = (status: TaskStatus) => {
    const newTask: TaskItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Task',
      description: '',
      status,
      priority: 'none',
      subtasks: []
    };
    saveTasks([...tasks, newTask]);
    setEditingTask(newTask); // Open modal immediately
  };

  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask) return;

    if (draggedTask.status !== status) {
      const newTasks = tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status } : t
      );
      saveTasks(newTasks);
    }
    setDraggedTask(null);
  };

  const updateTask = (updatedTask: TaskItem) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    saveTasks(newTasks);
    if (editingTask && editingTask.id === updatedTask.id) {
      setEditingTask(updatedTask);
    }
  };

  const deleteTask = (taskId: string) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
    setEditingTask(null);
  };

  const renderCard = (task: TaskItem) => {
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    
    let dueClass = '';
    let dueLabel = '';
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueLabel = `Due: ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      
      if (due < today && task.status !== 'done') {
        dueClass = 'due-overdue';
      } else if (due.getTime() === today.getTime() && task.status !== 'done') {
        dueClass = 'due-today';
      } else {
        dueClass = 'due-upcoming';
      }
    }

    const priorityObj = PRIORITIES.find(p => p.id === task.priority);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDoubleClick={() => setEditingTask(task)}
        onContextMenu={(e) => handleContextMenu(e, task)}
        className={cn(
          "group flex flex-col gap-2 p-3 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl cursor-grab active:cursor-grabbing hover:bg-[var(--bg-glass-hover)] hover:-translate-y-0.5 hover:shadow-lg transition-all animate-fade-in",
          priorityObj?.colorClass,
          draggedTask?.id === task.id && "opacity-50"
        )}
      >
        <div className="flex items-start gap-2">
          <GripVertical size={14} className="text-[var(--border-glass-strong)] mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <h4 className={cn("text-sm font-semibold text-[var(--text-main)] truncate", task.status === 'done' && "line-through opacity-70")}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Badges row */}
        {(task.dueDate || totalSubtasks > 0) && (
          <div className="flex items-center gap-3 pl-6 text-[10px] font-medium">
            {task.dueDate && (
              <span className={cn("flex items-center gap-1", dueClass)}>
                <Calendar size={10} /> {dueLabel}
              </span>
            )}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <CheckSquare size={10} /> {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
        )}
        
        {/* Progress bar for subtasks */}
        {totalSubtasks > 0 && task.status !== 'done' && (
          <div className="ml-6 mt-1 subtask-progress">
            <div 
              className="subtask-progress-fill" 
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderModal = () => {
    if (!editingTask) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-8" onClick={() => setEditingTask(null)}>
        <div 
          className="w-full max-w-2xl bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl shadow-2xl animate-slide-in-top flex flex-col max-h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-glass)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {COLUMNS.find(c => c.id === editingTask.status)?.icon({ size: 14 })}
              <span>{COLUMNS.find(c => c.id === editingTask.status)?.title} Task</span>
            </div>
            <button onClick={() => setEditingTask(null)} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)]">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex flex-col gap-6">
            {/* Title */}
            <input
              type="text"
              value={editingTask.title}
              onChange={e => updateTask({ ...editingTask, title: e.target.value })}
              className="text-2xl font-bold bg-transparent outline-none text-[var(--text-main)] w-full placeholder:text-[var(--text-muted)]"
              placeholder="Task Title..."
            />

            <div className="grid grid-cols-2 gap-6">
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Flag size={12} /> Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => updateTask({ ...editingTask, priority: p.id })}
                      className={cn(
                        "flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all",
                        editingTask.priority === p.id 
                          ? `bg-[var(--accent)] text-white border-transparent shadow-sm` 
                          : `bg-transparent border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--text-muted)]`
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar size={12} /> Due Date
                </label>
                <input
                  type="date"
                  value={editingTask.dueDate || ''}
                  onChange={e => updateTask({ ...editingTask, dueDate: e.target.value || undefined })}
                  className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <AlignLeft size={12} /> Description
              </label>
              <textarea
                value={editingTask.description || ''}
                onChange={e => updateTask({ ...editingTask, description: e.target.value })}
                placeholder="Add more details..."
                rows={4}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <CheckSquare size={12} /> Subtasks
              </label>
              <div className="space-y-2">
                {editingTask.subtasks?.map(st => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={e => {
                        const newSubtasks = editingTask.subtasks?.map(s => s.id === st.id ? { ...s, completed: e.target.checked } : s);
                        updateTask({ ...editingTask, subtasks: newSubtasks });
                      }}
                      className="cm-md-checkbox m-0"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={e => {
                        const newSubtasks = editingTask.subtasks?.map(s => s.id === st.id ? { ...s, title: e.target.value } : s);
                        updateTask({ ...editingTask, subtasks: newSubtasks });
                      }}
                      className={cn(
                        "flex-1 bg-transparent outline-none text-sm transition-all",
                        st.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-main)]"
                      )}
                    />
                    <button 
                      onClick={() => updateTask({ ...editingTask, subtasks: editingTask.subtasks?.filter(s => s.id !== st.id) })}
                      className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 pt-1">
                  <Plus size={16} className="text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Add subtask..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const title = e.currentTarget.value.trim();
                        e.currentTarget.value = '';
                        const newSubtask: SubTask = { id: Math.random().toString(36).substring(2), title, completed: false };
                        updateTask({ ...editingTask, subtasks: [...(editingTask.subtasks || []), newSubtask] });
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border-glass)] flex justify-between items-center bg-black/5 dark:bg-white/5">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this task?')) deleteTask(editingTask.id);
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Delete Task
            </button>
            <button
              onClick={() => setEditingTask(null)}
              className="px-5 py-2 bg-[var(--text-main)] text-[var(--bg-base)] rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-6 mb-2">
        <div className="flex flex-col">
          <input
            type="text"
            className="text-3xl font-bold bg-transparent outline-none text-[var(--text-main)] w-full placeholder:text-[var(--text-muted)]"
            value={file.name}
            readOnly
          />
          <span className="text-xs text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2">
            <AlertCircle size={12} /> Drag tasks to move, double-click or right-click to edit/delete
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto px-8 pb-8 flex gap-6">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          const Icon = column.icon;
          
          return (
            <div 
              key={column.id}
              className={cn(
                "flex-1 min-w-[280px] max-w-[400px] flex flex-col bg-[var(--bg-sidebar)] backdrop-blur-[var(--backdrop-blur)] border rounded-2xl transition-colors duration-300",
                dragOverCol === column.id ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border-glass-strong)]"
              )}
              onDragOver={e => handleDragOver(e, column.id)}
              onDrop={e => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-glass)]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-bold text-sm tracking-wide text-[var(--text-main)]">
                    {column.title}
                  </h3>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-semibold text-[var(--text-muted)]">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => addTask(column.id)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {columnTasks.map(task => renderCard(task))}
                {columnTasks.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-[10px] text-[var(--text-muted)] font-medium italic border-2 border-dashed border-[var(--border-glass)] rounded-xl opacity-50">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {renderModal()}
      <ContextMenuComponent />
    </div>
  );
}
