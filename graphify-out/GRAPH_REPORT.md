# Graph Report - .  (2026-07-04)

## Corpus Check
- Corpus is ~21,430 words - fits in a single context window. You may not need a graph.

## Summary
- 229 nodes · 351 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Sidebar & Utility Components|Sidebar & Utility Components]]
- [[_COMMUNITY_Build Configuration|Build Configuration]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Editors & Core Types|Editors & Core Types]]
- [[_COMMUNITY_Graph Navigation Components|Graph Navigation Components]]
- [[_COMMUNITY_App Core & Settings|App Core & Settings]]
- [[_COMMUNITY_Markdown Live Preview|Markdown Live Preview]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Electron Main Process|Electron Main Process]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Graphify Agents Config|Graphify Agents Config]]
- [[_COMMUNITY_Documentation & Readme|Documentation & Readme]]
- [[_COMMUNITY_Security Policy|Security Policy]]
- [[_COMMUNITY_React Entry Point|React Entry Point]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 23 edges
2. `FileType` - 17 edges
3. `compilerOptions` - 15 edges
4. `WorkspaceFile` - 10 edges
5. `scripts` - 9 edges
6. `Theme` - 9 edges
7. `FileEntry` - 8 edges
8. `build` - 7 edges
9. `TrashEntry` - 6 edges
10. `Props` - 5 edges

## Surprising Connections (you probably didn't know these)
- `graphify workflow` --conceptually_related_to--> `Graphify Knowledge Graph`  [INFERRED]
  .agents/workflows/graphify.md → .agents/rules/graphify.md
- `App()` --calls--> `cn()`  [EXTRACTED]
  src/App.tsx → src/lib/utils.ts
- `Props` --references--> `FileType`  [EXTRACTED]
  src/components/BacklinksPanel.tsx → src/types.ts
- `Backlink` --references--> `FileType`  [EXTRACTED]
  src/components/BacklinksPanel.tsx → src/types.ts
- `Props` --references--> `FileType`  [EXTRACTED]
  src/components/Breadcrumbs.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (18 total, 3 thin omitted)

### Community 0 - "Sidebar & Utility Components"
Cohesion: 0.11
Nodes (22): AiAssistant(), Message, Props, CalendarWidget(), DAY_LABELS, formatDateStr(), Props, SearchPanel() (+14 more)

### Community 1 - "Build Configuration"
Cohesion: 0.08
Nodes (25): build, appId, directories, files, nsis, productName, win, output (+17 more)

### Community 2 - "Package Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, chokidar, clsx, @codemirror/lang-markdown, @codemirror/language, @codemirror/language-data, @codemirror/state, @codemirror/view (+18 more)

### Community 3 - "Editors & Core Types"
Cohesion: 0.14
Nodes (19): Props, StatusBar(), BoardEditor(), Props, TYPE_ICONS, COLUMNS, PRIORITIES, Props (+11 more)

### Community 4 - "Graph Navigation Components"
Cohesion: 0.15
Nodes (15): Backlink, BacklinksPanel(), Props, Breadcrumbs(), Props, CommandPalette(), Props, GraphLink (+7 more)

### Community 5 - "App Core & Settings"
Cohesion: 0.13
Nodes (14): Heading, OutlinePanel(), Props, ACCENT_COLORS, FONTS, Props, SettingsModal(), Props (+6 more)

### Community 6 - "Markdown Live Preview"
Cohesion: 0.12
Nodes (10): MarkdownEditor(), Props, CheckboxWidget, clickHandler, dimSyntax, hashtagMatcher, ImagePlaceholderWidget, livePreviewPlugin (+2 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 8 - "Electron Main Process"
Cohesion: 0.16
Nodes (11): AppSettings, DEFAULT_SETTINGS, FileEntry, findVaultRoot(), getFileType(), loadSettings(), searchInDir(), SearchResult (+3 more)

### Community 9 - "Dev Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, electron, electron-builder, esbuild, tailwindcss, tsx, @types/express (+4 more)

### Community 10 - "Graphify Agents Config"
Cohesion: 0.29
Nodes (7): graphify explain, Graphify Knowledge Graph, graphify path, graphify query, graphify update, graphify skill, graphify workflow

## Knowledge Gaps
- **109 isolated node(s):** `SETTINGS_PATH`, `AppSettings`, `DEFAULT_SETTINGS`, `FileEntry`, `SearchResult` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Dependencies` to `Build Configuration`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `cn()` connect `Sidebar & Utility Components` to `Editors & Core Types`, `Graph Navigation Components`, `App Core & Settings`, `Markdown Live Preview`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Build Configuration`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `SETTINGS_PATH`, `AppSettings`, `DEFAULT_SETTINGS` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar & Utility Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Should `Build Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._