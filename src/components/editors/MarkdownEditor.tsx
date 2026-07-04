import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { 
  Bold, Italic, Strikethrough, Heading, Link, Code, 
  List, ListOrdered, CheckSquare, Minus
} from 'lucide-react';
import { WorkspaceFile, Theme } from '../../types';
import { markdownLivePreview } from './markdownLivePreview';
import { cn } from '../../lib/utils';

import { vim } from '@replit/codemirror-vim';
interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
  theme: Theme;
  vimMode?: boolean;
}

export function MarkdownEditor({ file, onChange, theme, vimMode = false }: Props) {
  const [content, setContent] = useState(file.content);
  const editorRef = useRef<{ view?: EditorView }>(null);

  useEffect(() => {
    setContent(file.content);
  }, [file.id, file.content]);

  const handleChange = (val: string) => {
    setContent(val);
    onChange(val);
  };

  const getThemeExtension = () => {
    return EditorView.theme({
      "&": {
        color: "var(--text-main)",
        backgroundColor: "transparent",
      },
      ".cm-content": {
        fontFamily: "var(--font-sans)",
      },
      ".cm-cursor": {
        borderLeftColor: "var(--accent)"
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "var(--accent-light)"
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        color: "var(--text-muted)",
        border: "none",
        fontFamily: "var(--font-mono)",
      },
      ".cm-activeLine": {
        backgroundColor: "var(--border-glass)"
      },
      ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "var(--text-main)"
      }
    }, { dark: theme !== 'light' });
  };

  const insertSyntax = (prefix: string, suffix: string = '') => {
    const view = editorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    
    // If text is selected, wrap it. Otherwise insert syntax and place cursor inside.
    const textToInsert = `${prefix}${selectedText}${suffix}`;
    
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: textToInsert
      },
      selection: {
        anchor: selection.from + prefix.length + (selectedText.length > 0 ? selectedText.length + suffix.length : 0),
        head: selection.from + prefix.length + (selectedText.length > 0 ? selectedText.length + suffix.length : 0)
      }
    });
    view.focus();
  };

  const insertLinePrefix = (prefix: string) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const selection = view.state.selection.main;
    const line = view.state.doc.lineAt(selection.from);
    
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: prefix
      }
    });
    view.focus();
  };

  // Setup extensions array
  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    markdownLivePreview(),
    getThemeExtension()
  ];

  if (vimMode && vim) {
    extensions.push(vim({ status: true }));
  }

  return (
    <div className="h-full flex flex-col relative bg-transparent">
      {/* Title Area */}
      <div className="flex items-center justify-between px-8 py-6 mb-2">
        <div className="flex flex-col">
          <input
            type="text"
            className="text-3xl font-bold bg-transparent outline-none text-[var(--text-main)] w-full placeholder:text-[var(--text-muted)]"
            value={file.name}
            readOnly
          />
          <span className="text-xs text-[var(--text-muted)] font-medium mt-1">
            Last edited {new Date(file.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="px-8 pb-4 sticky top-0 z-10">
        <div className="editor-toolbar inline-flex shadow-sm">
          <button onClick={() => insertSyntax('**', '**')} title="Bold (Ctrl+B)">
            <Bold size={14} />
          </button>
          <button onClick={() => insertSyntax('*', '*')} title="Italic (Ctrl+I)">
            <Italic size={14} />
          </button>
          <button onClick={() => insertSyntax('~~', '~~')} title="Strikethrough">
            <Strikethrough size={14} />
          </button>
          <div className="separator" />
          <button onClick={() => insertLinePrefix('## ')} title="Heading">
            <Heading size={14} />
          </button>
          <div className="separator" />
          <button onClick={() => insertSyntax('[', '](url)')} title="Link">
            <Link size={14} />
          </button>
          <button onClick={() => insertSyntax('`', '`')} title="Inline Code">
            <Code size={14} />
          </button>
          <div className="separator" />
          <button onClick={() => insertLinePrefix('- ')} title="Bulleted List">
            <List size={14} />
          </button>
          <button onClick={() => insertLinePrefix('1. ')} title="Numbered List">
            <ListOrdered size={14} />
          </button>
          <button onClick={() => insertLinePrefix('- [ ] ')} title="Task List">
            <CheckSquare size={14} />
          </button>
          <button onClick={() => insertLinePrefix('\n---\n')} title="Horizontal Rule">
            <Minus size={14} />
          </button>
        </div>
      </div>

      {/* CodeMirror Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        <CodeMirror
          value={content}
          height="100%"
          theme={theme === 'light' ? 'light' : 'dark'}
          extensions={extensions}
          onChange={handleChange}
          className="h-full w-full text-base"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: false,
            highlightSelectionMatches: true,
          }}
          ref={editorRef}
        />
      </div>
    </div>
  );
}
