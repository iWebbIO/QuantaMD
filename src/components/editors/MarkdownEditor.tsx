import { useEffect, useRef, useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { 
  Bold, Italic, Strikethrough, Heading, Link, Code, 
  List, ListOrdered, CheckSquare, Minus
} from 'lucide-react';
import { WorkspaceFile, Theme, AppSettings } from '../../types';
import { markdownLivePreview } from './markdownLivePreview';
import { cn } from '../../lib/utils';
import { useContextMenu, ContextMenuItem } from '../ContextMenu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { vim } from '@replit/codemirror-vim';
interface Props {
  file: WorkspaceFile;
  onChange: (content: string) => void;
  theme: Theme;
  settings: AppSettings;
}

export function MarkdownEditor({ file, onChange, theme, settings }: Props) {
  const [content, setContent] = useState(file.content);
  const editorRef = useRef<{ view?: EditorView }>(null);
  const { showMenu, ContextMenuComponent } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [
      { id: 'bold', label: 'Bold', icon: <Bold size={14} />, action: () => insertSyntax('**', '**') },
      { id: 'italic', label: 'Italic', icon: <Italic size={14} />, action: () => insertSyntax('*', '*') },
      { id: 'strikethrough', label: 'Strikethrough', icon: <Strikethrough size={14} />, action: () => insertSyntax('~~', '~~') },
      { id: 'sep1', label: '', separator: true, action: () => {} },
      { id: 'h1', label: 'Heading 1', icon: <Heading size={14} />, action: () => insertLinePrefix('# ') },
      { id: 'h2', label: 'Heading 2', icon: <Heading size={14} />, action: () => insertLinePrefix('## ') },
      { id: 'h3', label: 'Heading 3', icon: <Heading size={14} />, action: () => insertLinePrefix('### ') },
      { id: 'sep2', label: '', separator: true, action: () => {} },
      { id: 'link', label: 'Link', icon: <Link size={14} />, action: () => insertSyntax('[', '](url)') },
      { id: 'code', label: 'Inline Code', icon: <Code size={14} />, action: () => insertSyntax('`', '`') },
      { id: 'sep3', label: '', separator: true, action: () => {} },
      { id: 'bullet', label: 'Bulleted List', icon: <List size={14} />, action: () => insertLinePrefix('- ') },
      { id: 'num', label: 'Numbered List', icon: <ListOrdered size={14} />, action: () => insertLinePrefix('1. ') },
      { id: 'task', label: 'Task List', icon: <CheckSquare size={14} />, action: () => insertLinePrefix('- [ ] ') },
      { id: 'hr', label: 'Horizontal Rule', icon: <Minus size={14} />, action: () => insertLinePrefix('\n---\n') },
    ];
    showMenu(e, items);
  };

  useEffect(() => {
    setContent(file.content);
  }, [file.id, file.content]);

  const handleChange = (val: string) => {
    setContent(val);
    onChange(val);
  };

  const themeExtension = useMemo(() => {
    return EditorView.theme({
      "&": {
        color: "var(--text-main)",
        backgroundColor: "transparent",
      },
      ".cm-content": {
        fontFamily: "var(--font-sans)",
      },
      "& [class^='tok-']": {
        color: "inherit",
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
  }, [theme]);

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
  const extensions = useMemo(() => {
    const exts = [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      markdownLivePreview(),
      themeExtension,
      EditorState.tabSize.of(settings.editorTabSize ?? 2)
    ];

    if (settings.editorWordWrap !== false) {
      exts.push(EditorView.lineWrapping);
    }

    if (settings.vimMode && vim) {
      exts.push(vim({ status: true }));
    }
    return exts;
  }, [themeExtension, settings.editorTabSize, settings.editorWordWrap, settings.vimMode]);

  const viewMode = settings.editorViewMode || 'source';

  return (
    <div className="h-full flex flex-col relative bg-transparent">
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {/* Editor Pane */}
        {(viewMode === 'source' || viewMode === 'split') && (
          <div 
            className={cn("h-full relative overflow-hidden", viewMode === 'split' ? "w-1/2 border-r border-[var(--border-glass)]" : "w-full")}
            onContextMenu={handleContextMenu}
          >
            <CodeMirror
              value={content}
              height="100%"
              theme="none"
              extensions={extensions}
              onChange={handleChange}
              className="h-full w-full text-base"
              basicSetup={{
                lineNumbers: settings.editorLineNumbers ?? true,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightActiveLine: false,
                highlightSelectionMatches: true
              }}
              ref={editorRef}
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn("h-full overflow-y-auto p-8 prose prose-sm max-w-none dark:prose-invert text-[var(--text-main)] bg-[var(--bg-base)] transition-colors", viewMode === 'split' ? "w-1/2" : "w-full mx-auto max-w-4xl")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <ContextMenuComponent />
    </div>
  );
}
