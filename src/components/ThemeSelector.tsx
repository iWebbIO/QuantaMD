import { Moon, Sun, Monitor } from 'lucide-react';
import { Theme } from '../types';
import { cn } from '../lib/utils';

interface Props {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export function ThemeSelector({ theme, setTheme }: Props) {
  return (
    <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 border border-[var(--border-glass)]">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "p-1.5 rounded-full flex-1 flex justify-center items-center transition-all duration-300",
          theme === 'light' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
        )}
        title="Precision Light"
      >
        <Sun size={14} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "p-1.5 rounded-full flex-1 flex justify-center items-center transition-all duration-300",
          theme === 'dark' ? "bg-white/20 text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
        )}
        title="Precision Dark"
      >
        <Moon size={14} />
      </button>
      <button
        onClick={() => setTheme('amoled')}
        className={cn(
          "p-1.5 rounded-full flex-1 flex justify-center items-center transition-all duration-300",
          theme === 'amoled' ? "bg-black text-white shadow-sm ring-1 ring-white/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
        )}
        title="Precision AMOLED"
      >
        <Monitor size={14} />
      </button>
    </div>
  );
}
