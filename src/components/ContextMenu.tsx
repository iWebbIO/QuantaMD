import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust position if menu goes off screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;
      
      if (x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 10;
      }
      
      if (y + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 10;
      }
      
      setPosition({ x: newX, y: newY });
    }
  }, [x, y, items.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Use capturing phase for outside click so it triggers before other click handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);
    
    // Also close on scroll to prevent detached menus
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (!items || items.length === 0) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      onContextMenu={e => { e.preventDefault(); onClose(); }}
    >
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[180px] py-1.5 bg-[var(--bg-sidebar)] backdrop-blur-2xl border border-[var(--border-glass-strong)] rounded-xl shadow-2xl animate-fade-in pointer-events-auto"
        style={{ 
          top: position.y, 
          left: position.x,
          transformOrigin: 'top left'
        }}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      >
        {items.map((item, idx) => {
          if (item.separator) {
            return <div key={`sep-${idx}`} className="h-px bg-[var(--border-glass-strong)] my-1.5 mx-2 opacity-50" />;
          }
          
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                item.action();
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-left transition-colors",
                item.danger 
                  ? "text-red-500 hover:bg-red-500 hover:text-white" 
                  : "text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-white group"
              )}
            >
              {item.icon && (
                <span className={cn(
                  "flex-shrink-0 opacity-70 transition-opacity",
                  item.danger ? "group-hover:opacity-100 group-hover:text-white" : "group-hover:opacity-100 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null);

  const showMenu = (e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const hideMenu = () => setContextMenu(null);

  const ContextMenuComponent = () => {
    if (!contextMenu) return null;
    return (
      <ContextMenu 
        x={contextMenu.x} 
        y={contextMenu.y} 
        items={contextMenu.items} 
        onClose={hideMenu} 
      />
    );
  };

  return { showMenu, hideMenu, ContextMenuComponent, isShowing: !!contextMenu };
}
