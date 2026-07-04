import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WorkspaceFile } from '../../types';
import { Edit2, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { markdownLivePreview } from './markdownLivePreview';

interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ file, onChange }: Props) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{file.name}</h1>
        
        <div className="flex bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-full p-1 backdrop-blur-md shadow-[var(--shadow-sm)]">
          <button 
            onClick={() => setIsPreview(false)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all", !isPreview ? "bg-white dark:bg-white/20 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]")}
          >
            <Edit2 size={14} /> Live Edit
          </button>
          <button 
            onClick={() => setIsPreview(true)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all", isPreview ? "bg-white dark:bg-white/20 shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]")}
          >
            <Eye size={14} /> View
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--bg-glass)] backdrop-blur-[var(--backdrop-blur)] rounded-2xl border border-[var(--border-glass)] shadow-[var(--shadow-glass)] transition-colors duration-300">
        {isPreview ? (
          <div className="p-8 max-w-4xl mx-auto prose dark:prose-invert prose-headings:font-semibold prose-a:text-[var(--accent)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full live-preview-editor">
            <CodeMirror
              value={file.content}
              height="100%"
              onChange={onChange}
              className="h-full text-[15px] text-[var(--text-main)]"
              extensions={[
                markdown({ base: markdownLanguage, codeLanguages: languages }),
                EditorView.lineWrapping,
                markdownLivePreview()
              ]}
              theme="none"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
