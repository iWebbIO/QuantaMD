import { AppSettings, Theme } from '../types';
import { X, Key, FolderOpen, Sliders, Palette, Keyboard, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  saveSettings: (settings: Partial<AppSettings>) => void;
  selectVault: () => void;
}

const FONTS = [
  { id: 'system-ui', label: 'System Default' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'monospace', label: 'Monospace' }
];

const ACCENT_COLORS = [
  { id: '210 100% 50%', label: 'Blue', color: 'hsl(210, 100%, 50%)' },
  { id: '270 76% 60%', label: 'Purple', color: 'hsl(270, 76%, 60%)' },
  { id: '142 71% 45%', label: 'Green', color: 'hsl(142, 71%, 45%)' },
  { id: '25 95% 53%', label: 'Orange', color: 'hsl(25, 95%, 53%)' },
  { id: '0 84% 60%', label: 'Red', color: 'hsl(0, 84%, 60%)' },
  { id: '330 80% 60%', label: 'Pink', color: 'hsl(330, 80%, 60%)' },
  { id: '175 80% 40%', label: 'Teal', color: 'hsl(175, 80%, 40%)' },
  { id: '45 93% 47%', label: 'Amber', color: 'hsl(45, 93%, 47%)' },
];

export function SettingsModal({ isOpen, onClose, settings, saveSettings, selectVault }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[560px] max-h-[85vh] overflow-y-auto bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-slide-in-top text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-glass)]">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-[var(--accent)]" />
            <h2 className="text-xl font-bold tracking-tight">App Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Key size={14} /> Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter Gemini API Key..."
                value={settings.geminiApiKey}
                onChange={e => saveSettings({ geminiApiKey: e.target.value })}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              API key is stored locally on your device and used to power the inline document AI Copilot.
            </p>
          </div>

          {/* Default Vault Path */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FolderOpen size={14} /> Default Vault
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={settings.defaultVaultPath || 'No vault directory configured'}
                className="flex-1 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2 text-sm outline-none text-[var(--text-muted)] truncate"
              />
              <button
                onClick={selectVault}
                className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Palette size={14} /> Accent Color
            </label>
            <div className="flex gap-3 flex-wrap">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => saveSettings({ accentColor: c.id })}
                  className={cn(
                    "color-swatch",
                    settings.accentColor === c.id && "active"
                  )}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Typography configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Font Family
              </label>
              <select
                value={settings.fontFamily}
                onChange={e => saveSettings({ fontFamily: e.target.value })}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
              >
                {FONTS.map(f => (
                  <option key={f.id} value={f.id} className="bg-[var(--bg-sidebar)]">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Font Size (px)
              </label>
              <input
                type="number"
                min="10"
                max="24"
                value={settings.fontSize}
                onChange={e => saveSettings({ fontSize: parseInt(e.target.value) || 14 })}
                className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Vim Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent-light)] text-[var(--accent)] rounded-lg">
                <Keyboard size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Vim Keybindings</h4>
                <p className="text-[11px] text-[var(--text-muted)]">Enable Vim-style editing in the markdown editor</p>
              </div>
            </div>
            <button
              onClick={() => saveSettings({ vimMode: !settings.vimMode })}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors duration-200",
                settings.vimMode ? "bg-[var(--accent)]" : "bg-[var(--border-glass-strong)]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                  settings.vimMode ? "translate-x-4.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Daily Note Template */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FileText size={14} /> Daily Note Template
            </label>
            <textarea
              value={settings.dailyNoteTemplate}
              onChange={e => saveSettings({ dailyNoteTemplate: e.target.value })}
              rows={6}
              className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors font-mono resize-none"
              placeholder="# {{date}}&#10;&#10;## Notes"
            />
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Available variables: <code className="px-1 py-0.5 bg-[var(--border-glass-strong)] rounded text-[10px]">{'{{date}}'}</code> <code className="px-1 py-0.5 bg-[var(--border-glass-strong)] rounded text-[10px]">{'{{day}}'}</code> <code className="px-1 py-0.5 bg-[var(--border-glass-strong)] rounded text-[10px]">{'{{time}}'}</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-[var(--border-glass)]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--text-main)] text-[var(--bg-base)] rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
