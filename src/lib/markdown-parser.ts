import { TaskItem, TaskStatus, BoardItem, BoardItemType } from '../types';

export function parseTasks(content: string): TaskItem[] {
  const lines = content.split('\n');
  const tasks: TaskItem[] = [];
  let currentTask: TaskItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^-\s*\[( |x|\/)\]\s*(.*)/i);
    
    if (match) {
      const char = match[1].toLowerCase();
      let status: TaskStatus = 'todo';
      if (char === 'x') status = 'done';
      else if (char === '/') status = 'in-progress';

      currentTask = {
        id: `t_${Date.now()}_${i}`,
        title: match[2].trim(),
        status,
        priority: 'none'
      };
      tasks.push(currentTask);
    } else if (currentTask && line.startsWith('  ')) {
      // Indented lines are descriptions
      const descLine = line.trim();
      if (descLine) {
        currentTask.description = currentTask.description ? currentTask.description + '\n' + descLine : descLine;
      }
    }
  }

  return tasks;
}

export function serializeTasks(tasks: TaskItem[], title: string = 'Tasks'): string {
  let output = `# ${title}\n\n`;
  for (const t of tasks) {
    const char = t.status === 'done' ? 'x' : t.status === 'in-progress' ? '/' : ' ';
    output += `- [${char}] ${t.title}\n`;
    if (t.description) {
      const descLines = t.description.split('\n');
      for (const dl of descLines) {
        output += `  ${dl}\n`;
      }
    }
  }
  return output.trim();
}

export function parseBoard(content: string): BoardItem[] {
  const lines = content.split('\n');
  const items: BoardItem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match list items
    const match = line.match(/^-\s+(.*)/);
    if (match) {
      const text = match[1];
      const item: BoardItem = {
        id: `b_${Date.now()}_${i}`,
        type: 'memo',
        title: text,
      };

      // Extract tags
      const tagRegex = /#([\w-]+)/g;
      const tags: string[] = [];
      let m;
      while ((m = tagRegex.exec(text)) !== null) {
        tags.push(m[1]);
      }
      if (tags.length > 0) {
        item.tags = tags;
        item.title = item.title.replace(tagRegex, '').trim();
      }

      // Extract markdown links
      const linkMatch = item.title.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        item.title = item.title.replace(linkMatch[0], linkMatch[1]).trim();
        item.url = linkMatch[2];
        item.type = 'link';
        if (item.url.includes('github.com')) {
          item.type = 'repo';
        }
      }

      items.push(item);
    }
  }
  return items;
}

export function serializeBoard(items: BoardItem[]): string {
  let output = `## Board Items\n\n`;
  for (const item of items) {
    let line = `- `;
    let title = item.title;
    if (item.url) {
      title = `[${title}](${item.url})`;
    }
    line += title;
    if (item.tags && item.tags.length > 0) {
      line += ' ' + item.tags.map(t => `#${t}`).join(' ');
    }
    output += line + '\n';
  }
  return output;
}
