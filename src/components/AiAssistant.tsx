import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, ListOrdered, FileText, Check, MessageSquare, PlayCircle, Trash2, ArrowDownToLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface Props {
  aiEnabled: boolean;
  aiEndpoint: string;
  aiModel: string;
  aiApiKey: string;
  activeFileContent: string;
  activeFileName: string;
  onInsertContent?: (content: string) => void;
}

const STORAGE_KEY = 'precision-workspace-chat-history';

export function AiAssistant({ aiEnabled, aiEndpoint, aiModel, aiApiKey, activeFileContent, activeFileName, onInsertContent }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from local storage based on active file
  useEffect(() => {
    if (!activeFileName) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${activeFileName}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        setMessages([]); // Clear when switching files if no history
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, [activeFileName]);

  // Save chat history
  useEffect(() => {
    if (activeFileName && messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}-${activeFileName}`, JSON.stringify(messages));
    }
  }, [messages, activeFileName]);

  const clearHistory = () => {
    setMessages([]);
    if (activeFileName) {
      localStorage.removeItem(`${STORAGE_KEY}-${activeFileName}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !aiEndpoint) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const systemInstruction = `You are a helpful AI coding and writing assistant integrated directly into a markdown note-taking app. 
The user is currently viewing/editing a file named "${activeFileName}".
Here is the current content of their file for context (do not repeat this content back to them unless asked):
---
${activeFileContent}
---
Keep your answers concise, format code blocks properly, and be helpful.`;

      const response = await fetch(`${aiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiApiKey ? { 'Authorization': `Bearer ${aiApiKey}` } : {})
        },
        body: JSON.stringify({
          model: aiModel || 'default',
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: input }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${await response.text()}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let fullContent = '';
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta?.content) {
                  fullContent += data.choices[0].delta.content;
                  setMessages(prev => 
                    prev.map(msg => msg.id === aiMsgId ? { ...msg, content: fullContent } : msg)
                  );
                }
              } catch (e) {
                // Ignore parse errors on partial streams
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMsg: Message = { 
        id: Date.now().toString(), 
        role: 'model', 
        content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to AI Provider.'}` 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  if (!aiEnabled) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[var(--text-muted)] bg-[var(--bg-sidebar)] border-l border-[var(--border-glass)]">
        <Bot size={32} className="mb-4 opacity-50 text-[var(--accent)]" />
        <h3 className="font-bold text-[var(--text-main)] mb-2">AI Copilot Disabled</h3>
        <p className="text-sm mb-4">You can enable the AI Copilot and configure local models in Settings.</p>
      </div>
    );
  }

  if (!aiEndpoint) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[var(--text-muted)] bg-[var(--bg-sidebar)] border-l border-[var(--border-glass)]">
        <Bot size={32} className="mb-4 opacity-50 text-[var(--accent)]" />
        <h3 className="font-bold text-[var(--text-main)] mb-2">AI Provider Not Configured</h3>
        <p className="text-sm mb-4">Please set up your AI endpoint in Settings.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-sidebar)] backdrop-blur-[var(--backdrop-blur)] border-l border-[var(--border-glass-strong)] shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-glass)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={18} className="text-[var(--accent)]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[var(--bg-sidebar)]"></div>
          </div>
          <h2 className="font-bold text-sm tracking-wide">AI Copilot</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button 
              onClick={clearHistory}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions (only show if chat is empty) */}
      {messages.length === 0 && (
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-[var(--border-glass)]">
          <button
            onClick={() => handleAction('Summarize the current document and extract the main action items.')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] hover:bg-[var(--accent-light)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[var(--text-muted)] group"
          >
            <ListOrdered size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Summarize</span>
          </button>
          <button
            onClick={() => handleAction('Review this document and suggest improvements for clarity, tone, and grammar.')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-glass)] hover:bg-[var(--accent-light)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[var(--text-muted)] group"
          >
            <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Polish</span>
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
            <MessageSquare size={32} className="mb-4" />
            <p className="text-sm font-medium">Ask me anything about your notes.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 text-sm animate-slide-in-right",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                msg.role === 'user' 
                  ? "bg-[var(--text-main)] text-[var(--bg-base)]" 
                  : "bg-[var(--accent)] text-white"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl max-w-[85%] group relative",
                msg.role === 'user' 
                  ? "bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-tr-sm" 
                  : "bg-[var(--bg-glass)] border border-[var(--accent-light)] rounded-tl-sm shadow-[0_2px_10px_var(--accent-light)]"
              )}>
                <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 overflow-hidden">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                
                {/* Insert into document button for AI responses */}
                {msg.role === 'model' && onInsertContent && msg.content && (
                  <button
                    onClick={() => onInsertContent(msg.content)}
                    className="absolute -bottom-3 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1 bg-[var(--text-main)] text-[var(--bg-base)] rounded-full text-[10px] font-bold shadow-md hover:scale-105 transition-all"
                    title="Insert at cursor"
                  >
                    <ArrowDownToLine size={10} /> Insert
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex gap-3 text-sm animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-light)]">
              <Bot size={14} />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-[var(--bg-glass)] border border-[var(--accent-light)] rounded-tl-sm flex items-center gap-2 text-[var(--accent)]">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border-glass)] bg-[var(--bg-sidebar)]">
        <div className="relative flex items-center group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Copilot..."
            className="w-full bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl pl-4 pr-12 py-3 text-sm outline-none resize-none max-h-32 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all group-hover:border-[var(--border-glass-strong)]"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "absolute right-2 p-2 rounded-lg transition-all",
              input.trim() && !isTyping
                ? "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm"
                : "text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] font-medium text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Sparkles size={10} className="text-[var(--accent)]" /> Gemini may produce inaccurate information
        </div>
      </div>
    </div>
  );
}
