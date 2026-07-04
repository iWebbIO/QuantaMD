import { AppSettings, Theme } from '../types';
import { X, Key, FolderOpen, Sliders } from 'lucide-react';

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

export function SettingsModal({ isOpen, onClose, settings, saveSettings, selectVault }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[500px] bg-[var(--bg-sidebar)] border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-[var(--text-main)]">
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
                className="px-4 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
              >
                Browse
              </button>
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
