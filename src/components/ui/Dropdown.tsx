import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface DropdownItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

export function Dropdown({ trigger, items, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn("cursor-pointer h-full flex items-center", className)}
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[220px] bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] shadow-xl rounded-md py-1 z-50 text-[13px] text-[var(--text-main)]"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`div-${index}`} className="my-1 border-b border-[var(--border-glass)]" />;
              }
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors",
                    item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--accent)] hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className={cn(
                      "text-[11px] opacity-60 ml-4",
                      "group-hover:text-white/80"
                    )}>
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
