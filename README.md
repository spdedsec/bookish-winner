# StoryForge

A clean, local-first React writing workspace for a single book.

## What is included

- Markdown editor with GFM preview
- Autosave to browser `localStorage`
- Notes / chapters / character / timeline note types
- Search across titles, folders, tags, and content
- `[[Wiki-style links]]` and backlink detection
- Hashtag extraction and tag filtering
- Outline view based on Markdown headings
- Character ledger
- Timeline view
- Book word-count target and progress
- Command palette
- Keyboard shortcuts
- JSON backup + restore
- Combined Markdown export
- Minimal dark UI, responsive layout
- No backend, no account, no telemetry

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints.

## Build

```bash
npm run build
npm run preview
```

## Data

Your writing is stored in the browser's local storage under `storyforge-v1`.

Export a JSON backup regularly if the writing matters. The app is deliberately local-first; clearing browser/site storage removes the local copy.

## Shortcuts

- `Cmd/Ctrl + K` — command palette
- `Cmd/Ctrl + P` — toggle Markdown preview
- `Esc` — close command palette

## Markdown linking

Create a connection to another note with:

```md
[[Name of the character]]
```

The Inspector will show the link and a backlink on the target note when the names match.

## Suggested next upgrades

This starter intentionally stays simple. Natural next steps are:
- IndexedDB for larger books
- Folder drag-and-drop
- Git-like revision history
- Split editor/preview
- Graph view
- Daily writing sessions
- Focus mode with distraction-free typography
- Character relationship graph
- Scene cards / Kanban
- PDF / DOCX manuscript export
- Optional filesystem sync
