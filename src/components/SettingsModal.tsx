import { AppSettings, Theme } from '../types';
import { X, Key, FolderOpen, Sliders, Palette, Keyboard, FileText, SunMoon, Bot, RefreshCw, Type, AlignLeft, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeSelector } from './ThemeSelector';
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  saveSettings: (settings: Partial<AppSettings>) => void;
  selectVault: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
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

export function SettingsModal({ isOpen, onClose, settings, saveSettings, selectVault, theme, setTheme }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'ai' | 'export'>('general');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  useEffect(() => {
    if (isOpen && settings.aiEnabled && settings.aiEndpoint) {
      fetchModels();
    }
  }, [isOpen, settings.aiEnabled, settings.aiEndpoint, settings.aiApiKey]);

  const fetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch(`${settings.aiEndpoint}/models`, {
        headers: settings.aiApiKey ? { 'Authorization': `Bearer ${settings.aiApiKey}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableModels(data.data.map((m: any) => m.id));
        if (data.data.length > 0 && !settings.aiModel) {
          saveSettings({ aiModel: data.data[0].id });
        }
      } else {
        setAvailableModels([]);
      }
    } catch (e) {
      console.error('Failed to fetch models', e);
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
    >
      <div 
        className="w-[700px] h-[85vh] max-h-[700px] flex border border-[var(--border-glass-strong)] backdrop-blur-xl rounded-2xl shadow-2xl animate-slide-in-top text-[var(--text-main)] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-modal)' }}
      >
        
        {/* Sidebar */}
        <div className="w-[200px] bg-black/5 dark:bg-white/5 border-r border-[var(--border-glass)] flex flex-col p-4">
          <div className="flex items-center gap-2 mb-8 px-2">
            <Sliders size={20} className="text-[var(--accent)]" />
            <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'general' ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
              )}
            >
              <Sliders size={16} /> General
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'editor' ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
              )}
            >
              <Type size={16} /> Editor
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'ai' ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
              )}
            >
              <Bot size={16} /> AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'export' ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-main)]"
              )}
            >
              <Download size={16} /> Export
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-10"
          >
            <X size={16} />
          </button>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-md mx-auto space-y-8">
              
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-4">General Settings</h3>
                    {/* Default Vault Path */}
                    <div className="space-y-2 mb-6">
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
                    
                    {/* Startup Behavior */}
                    <div className="space-y-2 mb-6">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        <SunMoon size={14} /> Startup Behavior
                      </label>
                      <select
                        value={settings.startupBehavior || 'last-vault'}
                        onChange={e => saveSettings({ startupBehavior: e.target.value as 'last-vault' | 'empty' })}
                        className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
                      >
                        <option value="last-vault" className="bg-[var(--bg-sidebar)]">Open last vault</option>
                        <option value="empty" className="bg-[var(--bg-sidebar)]">Start empty</option>
                      </select>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-3 mb-6">
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

                    {/* Theme */}
                    <div className="space-y-3 mb-6">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        <SunMoon size={14} /> Application Theme
                      </label>
                      <ThemeSelector theme={theme} setTheme={setTheme} />
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
                </>
              )}

              {/* EDITOR TAB */}
              {activeTab === 'editor' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-4">Editor Configuration</h3>
                    
                    {/* Typography configuration */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
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

                    {/* Tab Size */}
                    <div className="space-y-2 mb-6">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Tab Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="8"
                        step="2"
                        value={settings.editorTabSize ?? 2}
                        onChange={e => saveSettings({ editorTabSize: parseInt(e.target.value) || 2 })}
                        className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                      {/* Line Numbers Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--accent-light)] text-[var(--accent)] rounded-lg">
                            <AlignLeft size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Line Numbers</h4>
                            <p className="text-[11px] text-[var(--text-muted)]">Show line numbers in editor</p>
                          </div>
                        </div>
                        <button
                          onClick={() => saveSettings({ editorLineNumbers: !settings.editorLineNumbers })}
                          className={cn(
                            "relative w-10 h-6 rounded-full transition-colors duration-200",
                            settings.editorLineNumbers ? "bg-[var(--accent)]" : "bg-[var(--border-glass-strong)]"
                          )}
                        >
                          <span className={cn("absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", settings.editorLineNumbers ? "translate-x-[18px]" : "translate-x-0.5")} />
                        </button>
                      </div>

                      {/* Word Wrap Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--accent-light)] text-[var(--accent)] rounded-lg">
                            <Type size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Word Wrap</h4>
                            <p className="text-[11px] text-[var(--text-muted)]">Wrap long lines to fit window</p>
                          </div>
                        </div>
                        <button
                          onClick={() => saveSettings({ editorWordWrap: !settings.editorWordWrap })}
                          className={cn(
                            "relative w-10 h-6 rounded-full transition-colors duration-200",
                            settings.editorWordWrap ? "bg-[var(--accent)]" : "bg-[var(--border-glass-strong)]"
                          )}
                        >
                          <span className={cn("absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", settings.editorWordWrap ? "translate-x-[18px]" : "translate-x-0.5")} />
                        </button>
                      </div>

                      {/* Vim Mode Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[var(--accent-light)] text-[var(--accent)] rounded-lg">
                            <Keyboard size={16} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Vim Keybindings</h4>
                            <p className="text-[11px] text-[var(--text-muted)]">Enable Vim-style editing</p>
                          </div>
                        </div>
                        <button
                          onClick={() => saveSettings({ vimMode: !settings.vimMode })}
                          className={cn(
                            "relative w-10 h-6 rounded-full transition-colors duration-200",
                            settings.vimMode ? "bg-[var(--accent)]" : "bg-[var(--border-glass-strong)]"
                          )}
                        >
                          <span className={cn("absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", settings.vimMode ? "translate-x-[18px]" : "translate-x-0.5")} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* AI TAB */}
              {activeTab === 'ai' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-4">AI Assistant</h3>
                    <div className="space-y-4 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4 border-b border-[var(--border-glass)] pb-4">
                        <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold">
                          <Bot size={18} className="text-[var(--accent)]" />
                          <span>Enable AI Copilot</span>
                        </div>
                        <button
                          onClick={() => saveSettings({ aiEnabled: !settings.aiEnabled })}
                          className={cn(
                            "relative w-10 h-6 rounded-full transition-colors duration-200",
                            settings.aiEnabled ? "bg-[var(--accent)]" : "bg-[var(--border-glass-strong)]"
                          )}
                        >
                          <span className={cn("absolute left-0 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", settings.aiEnabled ? "translate-x-[18px]" : "translate-x-0.5")} />
                        </button>
                      </div>
                      
                      {settings.aiEnabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Provider</label>
                              <select
                                value={settings.aiProvider}
                                onChange={e => {
                                  const provider = e.target.value as any;
                                  let endpoint = settings.aiEndpoint;
                                  if (provider === 'ollama') endpoint = 'http://localhost:11434/v1';
                                  else if (provider === 'lmstudio') endpoint = 'http://localhost:1234/v1';
                                  else if (provider === 'openai') endpoint = 'https://api.openai.com/v1';
                                  saveSettings({ aiProvider: provider, aiEndpoint: endpoint });
                                }}
                                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                              >
                                <option value="ollama">Ollama (Local)</option>
                                <option value="lmstudio">LM Studio (Local)</option>
                                <option value="openai">OpenAI</option>
                                <option value="custom">Custom (OpenAI Compatible)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">API Key</label>
                              <input
                                type="password"
                                value={settings.aiApiKey}
                                onChange={e => saveSettings({ aiApiKey: e.target.value })}
                                placeholder="Optional for local"
                                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Endpoint URL</label>
                            <input
                              type="text"
                              value={settings.aiEndpoint}
                              onChange={e => saveSettings({ aiEndpoint: e.target.value })}
                              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Model</label>
                              <button onClick={fetchModels} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                <RefreshCw size={12} className={isFetchingModels ? "animate-spin" : ""} />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={settings.aiModel}
                                onChange={e => saveSettings({ aiModel: e.target.value })}
                                className="flex-1 bg-[var(--bg-sidebar)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                              >
                                <option value="">Select a model...</option>
                                {availableModels.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* EXPORT TAB */}
              {activeTab === 'export' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold mb-4">Export Preferences</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <FolderOpen size={14} /> Default Export Directory
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={settings.exportDirectory || ''}
                            onChange={(e) => saveSettings({ exportDirectory: e.target.value })}
                            placeholder="Same as current file"
                            className="flex-1 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-4 py-2 text-sm outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <FileText size={14} /> PDF Export Template
                        </label>
                        <select
                          value={settings.exportTemplatePdf || 'default'}
                          onChange={e => saveSettings({ exportTemplatePdf: e.target.value })}
                          className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
                        >
                          <option value="default" className="bg-[var(--bg-sidebar)]">Default (Light)</option>
                          <option value="academic" className="bg-[var(--bg-sidebar)]">Academic (Serif)</option>
                          <option value="modern" className="bg-[var(--bg-sidebar)]">Modern (Sans-Serif)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <FileText size={14} /> HTML Export Template
                        </label>
                        <select
                          value={settings.exportTemplateHtml || 'default'}
                          onChange={e => saveSettings({ exportTemplateHtml: e.target.value })}
                          className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
                        >
                          <option value="default" className="bg-[var(--bg-sidebar)]">Default Theme</option>
                          <option value="dark" className="bg-[var(--bg-sidebar)]">Dark Theme (Standalone)</option>
                          <option value="minimal" className="bg-[var(--bg-sidebar)]">Minimal (No CSS)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
