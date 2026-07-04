import { Extension } from '@codemirror/state';
import { ViewPlugin, DecorationSet, Decoration, EditorView, WidgetType, MatchDecorator } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// Helper function to dim syntax characters (like # or **)
const dimSyntax = Decoration.mark({ class: 'cm-md-syntax' });

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean, readonly pos: number) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.pos === this.pos;
  }

  toDOM() {
    const wrap = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'cm-md-checkbox';
    input.checked = this.checked;
    
    // Allow the user to click the checkbox to toggle it in the editor
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const view = (target.getRootNode() as any)?.host?.view || (window as any).cmView; // Hack to get view if we can't easily pass it
      if (view) {
        // Find a way to dispatch transaction. Best is if we can handle clicks at the view level instead of widget DOM level.
        // For simplicity in this implementation, we rely on a click handler registered on the EditorView below.
      }
    });

    wrap.appendChild(input);
    return wrap;
  }
}

class ImagePlaceholderWidget extends WidgetType {
  constructor(readonly alt: string) {
    super();
  }

  eq(other: ImagePlaceholderWidget) {
    return other.alt === this.alt;
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-md-image-widget';
    span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> ${this.alt || 'Image'}`;
    return span;
  }
}

// Regex matchers for things not easily parsed by basic lezer-markdown
const hashtagMatcher = new MatchDecorator({
  regexp: /#[a-zA-Z0-9_-]+/g,
  decoration: match => Decoration.mark({ class: 'cm-md-hashtag' })
});

const wikilinkMatcher = new MatchDecorator({
  regexp: /\[\[(.*?)\]\]/g,
  decoration: match => Decoration.mark({ class: 'cm-md-wikilink' })
});

const livePreviewPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: any) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView) {
    const builder: any[] = [];
    const { state } = view;
    const selection = state.selection.main;
    
    // 1. Regex based decorations
    const regexDecorations = [];
    for (const { from, to } of view.visibleRanges) {
      regexDecorations.push(hashtagMatcher.createDeco(view), wikilinkMatcher.createDeco(view));
    }

    // 2. Syntax tree based decorations
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(state).iterate({
        from,
        to,
        enter: (node) => {
          const type = node.type.name;
          const isCursorInside = selection.from >= node.from && selection.to <= node.to;

          // Headings
          if (type.startsWith('ATXHeading')) {
            const level = type.match(/\d/)?.[0] || '1';
            builder.push(Decoration.line({ class: `cm-md-heading cm-md-h${level}` }).range(node.from));
            
            if (!isCursorInside) {
              const text = state.doc.sliceString(node.from, node.to);
              const match = text.match(/^(#+)\s/);
              if (match) {
                builder.push(dimSyntax.range(node.from, node.from + match[0].length));
              }
            }
          }

          // Strong / Bold
          if (type === 'StrongEmphasis') {
            builder.push(Decoration.mark({ class: 'cm-md-bold' }).range(node.from, node.to));
            if (!isCursorInside) {
              builder.push(dimSyntax.range(node.from, node.from + 2));
              builder.push(dimSyntax.range(node.to - 2, node.to));
            }
          }

          // Emphasis / Italic
          if (type === 'Emphasis') {
            builder.push(Decoration.mark({ class: 'cm-md-italic' }).range(node.from, node.to));
            if (!isCursorInside) {
              builder.push(dimSyntax.range(node.from, node.from + 1));
              builder.push(dimSyntax.range(node.to - 1, node.to));
            }
          }

          // Strikethrough
          if (type === 'Strikethrough') {
            builder.push(Decoration.mark({ class: 'cm-md-strikethrough' }).range(node.from, node.to));
            if (!isCursorInside) {
              builder.push(dimSyntax.range(node.from, node.from + 2));
              builder.push(dimSyntax.range(node.to - 2, node.to));
            }
          }

          // Inline Code
          if (type === 'InlineCode') {
            builder.push(Decoration.mark({ class: 'cm-md-code' }).range(node.from, node.to));
            if (!isCursorInside) {
              builder.push(dimSyntax.range(node.from, node.from + 1));
              builder.push(dimSyntax.range(node.to - 1, node.to));
            }
          }

          // Blockquote
          if (type === 'Blockquote') {
            builder.push(Decoration.line({ class: 'cm-md-blockquote-line' }).range(node.from));
          }

          // Horizontal Rule
          if (type === 'HorizontalRule') {
            if (!isCursorInside) {
              builder.push(Decoration.replace({
                widget: new (class extends WidgetType {
                  toDOM() {
                    const hr = document.createElement('hr');
                    hr.className = 'cm-md-hr';
                    return hr;
                  }
                })()
              }).range(node.from, node.to));
            }
          }

          // Links (standard markdown links)
          if (type === 'Link') {
            builder.push(Decoration.mark({ class: 'cm-md-link' }).range(node.from, node.to));
          }

          // Images
          if (type === 'Image' && !isCursorInside) {
            const text = state.doc.sliceString(node.from, node.to);
            const altMatch = text.match(/!\[(.*?)\]/);
            const alt = altMatch ? altMatch[1] : '';
            builder.push(Decoration.replace({
              widget: new ImagePlaceholderWidget(alt)
            }).range(node.from, node.to));
          }

          // Task lists (checkboxes)
          if (type === 'TaskMarker') {
            const text = state.doc.sliceString(node.from, node.to);
            const isChecked = text.includes('x') || text.includes('X');
            if (!isCursorInside) {
              builder.push(Decoration.replace({
                widget: new CheckboxWidget(isChecked, node.from)
              }).range(node.from, node.to));
            }
          }
        }
      });
    }

    // Sort and build
    builder.sort((a, b) => a.from - b.from);
    return Decoration.set(builder);
  }
}, {
  decorations: v => v.decorations
});

// Click handler for task checkboxes and wikilinks
const clickHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    // Handle checkbox clicks
    if ((event.target as HTMLElement).classList.contains('cm-md-checkbox')) {
      const pos = view.posAtDOM(event.target as Node);
      if (pos !== null) {
        // Try to find the exact TaskMarker
        const line = view.state.doc.lineAt(pos);
        const match = line.text.match(/\[( |x|X)\]/);
        if (match && match.index !== undefined) {
          const from = line.from + match.index + 1;
          const isChecked = match[1] !== ' ';
          view.dispatch({
            changes: { from, to: from + 1, insert: isChecked ? ' ' : 'x' }
          });
          return true;
        }
      }
    }
    
    // Handle wikilink and hashtag clicks if we want to add navigation later
    // Could dispatch custom events that the React component listens for
  }
});

export function markdownLivePreview(): Extension {
  return [livePreviewPlugin, clickHandler];
}
