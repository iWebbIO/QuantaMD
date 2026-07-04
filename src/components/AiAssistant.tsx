import { useState, useRef, useEffect } from 'react';
import { WorkspaceFile } from '../types';
import { Sparkles, Send, Loader2, BookOpen, CheckSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Props {
  activeFile: WorkspaceFile | null;
  geminiApiKey: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function AiAssistant({ activeFile, geminiApiKey }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'prompts'>('prompts');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getGeminiClient = () => {
    if (!geminiApiKey) {
      throw new Error('Missing Gemini API Key. Please configure it in Settings.');
    }
    return new GoogleGenAI({ apiKey: geminiApiKey });
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend && !customPrompt) return;

    setError(null);
    setIsLoading(true);

    if (!customPrompt) {
      setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
      setInput('');
    }

    try {
      const ai = getGeminiClient();
      
      // Inject note context if present
      let context = '';
      if (activeFile) {
        context = `Context from current note "${activeFile.name}" (${activeFile.type} editor):\n\`\`\`\n${activeFile.content}\n\`\`\`\n\n`;
      }

      const prompt = `${context}User Request: ${textToSend}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = response.text || 'No response generated.';
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      if (customPrompt) {
        // Switch tab to chat to show results
        setActiveTab('chat');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating response.');
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickAction = (action: 'summarize' | 'tasks' | 'improve') => {
    if (!activeFile) {
      setError('Please select a file to analyze.');
      return;
    }

    let prompt = '';
    if (action === 'summarize') {
      prompt = 'Please summarize the key highlights and takeaways of this note concisely.';
    } else if (action === 'tasks') {
      prompt = 'Please extract all actionable items and tasks from this note and format them as a checklist.';
    } else if (action === 'improve') {
      prompt = 'Please proofread this note. Identify grammar errors, style issues, and write a polished version with improved clarity.';
    }

    // Add user message to history
    setMessages(prev => [...prev, { role: 'user', text: `Run Action: ${action.toUpperCase()}` }]);
    handleSend(prompt);
  };

  return (
    <div className="w-80 h-full flex flex-col bg-[var(--bg-sidebar)] border-l border-[var(--border-glass-strong)] select-none">
      {/* Title */}
      <div className="p-4 border-b border-[var(--border-glass)] flex items-center gap-2 text-[var(--accent)] font-semibold">
        <Sparkles size={16} />
        <h2 className="text-sm font-bold tracking-tight">AI Copilot</h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/5 dark:bg-white/5 border-b border-[var(--border-glass)] p-1">
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'prompts' ? 'bg-white dark:bg-white/10 shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-white/10 shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          Chat Assistant
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {!geminiApiKey && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500 text-xs leading-relaxed">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Gemini API Key Required</p>
              <p>Configure your Gemini API key in the App Settings to unlock summaries, task extractions, and document chat features.</p>
            </div>
          </div>
        )}

        {activeTab === 'prompts' ? (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Run preset actions instantly on the contents of the currently opened file.
            </p>
            
            <div className="grid gap-2">
              <button
                disabled={isLoading || !activeFile}
                onClick={() => runQuickAction('summarize')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-glass)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 text-left transition-all group"
              >
                <BookOpen size={16} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Summarize Document</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Condense key bullet points and ideas</p>
                </div>
              </button>

              <button
                disabled={isLoading || !activeFile}
                onClick={() => runQuickAction('tasks')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-glass)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 text-left transition-all group"
              >
                <CheckSquare size={16} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Extract Actions</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Find items and generate checkboxes</p>
                </div>
              </button>

              <button
                disabled={isLoading || !activeFile}
                onClick={() => runQuickAction('improve')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-glass)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 text-left transition-all group"
              >
                <RefreshCw size={16} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Polish Writing</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Correct grammar and style errors</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-end space-y-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <Sparkles size={24} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">Ask Copilot</p>
                <p className="text-[10px] leading-relaxed mt-1">
                  Ask questions about the current document or have it compose new content.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[var(--accent)] text-white ml-auto rounded-tr-none'
                        : 'bg-[var(--bg-glass)] border border-[var(--border-glass)] text-[var(--text-main)] rounded-tl-none'
                    }`}
                  >
                    <span className="font-bold mb-1 opacity-70">
                      {msg.role === 'user' ? 'You' : 'Gemini'}
                    </span>
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-2xl">
                    {error}
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input controls */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-[var(--border-glass)] bg-[var(--bg-sidebar)]">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-1 items-center"
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading || !geminiApiKey}
              className="flex-1 bg-transparent border-none outline-none py-1.5 px-3 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !geminiApiKey}
              className="p-1.5 bg-[var(--accent)] hover:scale-105 disabled:scale-100 text-white rounded-lg disabled:opacity-50 transition-all flex items-center justify-center"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
