import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { RangeSet, Range } from "@codemirror/state";

const hideMark = Decoration.replace({});

export function markdownLivePreview() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const ranges: Range<Decoration>[] = [];
        const { state, viewport } = view;
        const selection = state.selection.main;

        syntaxTree(state).iterate({
          from: viewport.from,
          to: viewport.to,
          enter: (node) => {
            const { name, from: nodeFrom, to: nodeTo } = node;

            const isContainer =
              name.startsWith("ATXHeading") ||
              name === "StrongEmphasis" ||
              name === "Emphasis" ||
              name === "InlineCode" ||
              name === "FencedCode";

            if (isContainer) {
              const overlaps = selection.from <= nodeTo && selection.to >= nodeFrom;
              if (overlaps) {
                // Skip processing this node and its children (revert to raw text)
                return false;
              }

              if (name.startsWith("ATXHeading")) {
                const level = parseInt(name.replace("ATXHeading", ""), 10) || 1;
                ranges.push(Decoration.mark({ class: `cm-md-heading cm-md-h${level}` }).range(nodeFrom, nodeTo));
              } else if (name === "StrongEmphasis") {
                ranges.push(Decoration.mark({ class: "cm-md-bold" }).range(nodeFrom, nodeTo));
              } else if (name === "Emphasis") {
                ranges.push(Decoration.mark({ class: "cm-md-italic" }).range(nodeFrom, nodeTo));
              } else if (name === "InlineCode" || name === "FencedCode") {
                ranges.push(Decoration.mark({ class: "cm-md-code" }).range(nodeFrom, nodeTo));
              }
            }

            if (
              name === "HeaderMark" ||
              name === "EmphasisMark" ||
              name === "CodeMark" ||
              name === "CodeInfo"
            ) {
              ranges.push(hideMark.range(nodeFrom, nodeTo));
            }
          },
        });

        ranges.sort((a, b) => {
          if (a.from !== b.from) return a.from - b.from;
          if (a.to !== b.to) return b.to - a.to;
          return 0;
        });

        return RangeSet.of(ranges, true);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

