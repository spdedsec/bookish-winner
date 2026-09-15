import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen, ChevronDown, ChevronRight, CirclePlus, Clock3, Download,
  FileText, Folder, Hash, Keyboard, Link2, Menu, MoreHorizontal,
  PanelLeft, PanelRight, Plus, Search, Settings2, Sparkles, Tag, Trash2,
  Upload, UserRound, Users, X, Check, Eye, Edit3, Command, Library,
  List, PenLine, BookMarked, CalendarDays
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "storyforge-v1";

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const nowISO = () => new Date().toISOString();

const initialData = {
  book: {
    title: "Untitled Book",
    subtitle: "A private writing workspace",
    author: "You",
    synopsis: "",
    targetWords: 80000
  },
  notes: [
    {
      id: "n-intro",
      title: "Welcome to StoryForge",
      kind: "chapter",
      folder: "Draft",
      tags: ["meta"],
      content: "# Welcome to StoryForge\n\nA fast, local-first workspace for building a book without the noise.\n\n## The idea\n\nWrite here in **Markdown**. Use `# headings`, lists, quotes, links, and tables. Your work is saved automatically in this browser.\n\n## Useful conventions\n\n- `# Chapter` for major sections\n- `[[Character Name]]` for a relationship/backlink\n- `#tag` anywhere in your notes\n- Keep scraps, scenes, research, and finished prose together\n\n> The interface should disappear. The story should not.",
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: "n-ideas",
      title: "Story Ideas",
      kind: "note",
      folder: "Ideas",
      tags: ["ideas", "plot"],
      content: "## Fragments\n\nWrite fragments, stray dialogue, endings, images, lines, and scenes here.\n\n- **Ending image:**\n- **Recurring object:**\n- **Line I want to keep:**\n",
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: "n-characters",
      title: "Character Ledger",
      kind: "character",
      folder: "Characters",
      tags: ["characters"],
      content: "# Character Ledger\n\nUse this note for a quick cast overview. Individual character pages can be added later.\n\n## Core cast\n\n- [[Prithvi]] — protagonist\n- [[Komal]] — central relationship\n",
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: "n-timeline",
      title: "Timeline",
      kind: "timeline",
      folder: "Planning",
      tags: ["timeline", "structure"],
      content: "# Timeline\n\n| Time | Event | POV / thread |\n| --- | --- | --- |\n| Year 0 | Opening status quo | Prithvi |\n| +5 years | Relationship fracture | Komal |\n| +7 years | The call | Prithvi |\n",
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ],
  characters: [
    { id: "c-prithvi", name: "Prithvi", role: "Protagonist", note: "The emotional center of the story." },
    { id: "c-komal", name: "Komal", role: "Central character", note: "A relationship that keeps changing shape." }
  ],
  timeline: [
    { id: "t-1", date: "Year 0", title: "Beginning", detail: "The story opens." },
    { id: "t-2", date: "Year 5", title: "Separation", detail: "The central rupture." },
    { id: "t-3", date: "Year 7", title: "The call", detail: "A voice from the past returns." }
  ]
};

function loadData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return parsed ? { ...initialData, ...parsed } : initialData;
  } catch {
    return initialData;
  }
}

function extractTags(text) {
  return [...new Set((text.match(/(^|\s)#([a-zA-Z0-9_-]+)/g) || []).map(x => x.trim().slice(1)))]
    .filter(Boolean);
}

function extractLinks(text) {
  return [...new Set((text.match(/\[\[[^\]]+\]\]/g) || []).map(x => x.slice(2, -2).trim()).filter(Boolean))];
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatCount(n) {
  return new Intl.NumberFormat().format(n);
}

function downloadFile(name, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [data, setData] = useState(loadData);
  const [activeId, setActiveId] = useState("n-intro");
  const [view, setView] = useState("editor");
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [inspector, setInspector] = useState(true);
  const [showCommand, setShowCommand] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const [activePanel, setActivePanel] = useState("outline");
  const textareaRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    setSaveState("Saving…");
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveState("Saved");
    }, 350);
    return () => clearTimeout(t);
  }, [data]);

  const active = data.notes.find(n => n.id === activeId) || data.notes[0];

  const stats = useMemo(() => {
    const allText = data.notes.map(n => n.content).join("\n");
    const tags = [...new Set(data.notes.flatMap(n => [...n.tags, ...extractTags(n.content)]))].sort();
    return {
      words: wordCount(allText),
      notes: data.notes.length,
      tags,
      links: [...new Set(data.notes.flatMap(n => extractLinks(n.content)))],
      chapters: data.notes.filter(n => n.kind === "chapter").length
    };
  }, [data]);

  const filteredNotes = useMemo(() => {
    return data.notes.filter(n => {
      const hay = `${n.title} ${n.content} ${n.folder} ${n.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !query.trim() || hay.includes(query.toLowerCase());
      const matchesTag = !selectedTag || n.tags.includes(selectedTag) || extractTags(n.content).includes(selectedTag);
      return matchesQuery && matchesTag;
    });
  }, [data.notes, query, selectedTag]);

  const outline = useMemo(() => {
    const lines = (active?.content || "").split("\n");
    return lines
      .map((line, i) => {
        const m = line.match(/^(#{1,4})\s+(.+)/);
        return m ? { level: m[1].length, title: m[2].replace(/[*_`]/g, ""), line: i } : null;
      })
      .filter(Boolean);
  }, [active]);

  const backlinks = useMemo(() => {
    if (!active) return [];
    return data.notes.filter(n => n.id !== active.id && extractLinks(n.content).some(x => x.toLowerCase() === active.title.toLowerCase()));
  }, [active, data.notes]);

  function updateNote(id, patch) {
    setData(d => ({
      ...d,
      notes: d.notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n)
    }));
  }

  function createNote(kind = "note", folder = "Notes") {
    const labels = { note: "New Note", chapter: "New Chapter", character: "New Character", timeline: "New Timeline Entry" };
    const note = {
      id: uid(), title: labels[kind] || "New Note", kind, folder,
      tags: kind === "chapter" ? ["chapter"] : [],
      content: kind === "chapter" ? "# New Chapter\n\n" : "# New Note\n\n",
      createdAt: nowISO(), updatedAt: nowISO()
    };
    setData(d => ({ ...d, notes: [note, ...d.notes] }));
    setActiveId(note.id);
    setView("editor");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function deleteActive() {
    if (!active || data.notes.length <= 1) return;
    const next = data.notes.find(n => n.id !== active.id);
    setData(d => ({ ...d, notes: d.notes.filter(n => n.id !== active.id) }));
    setActiveId(next.id);
  }

  function exportBook() {
    const payload = JSON.stringify(data, null, 2);
    downloadFile(`${slugify(data.book.title) || "storyforge"}-backup.json`, payload, "application/json");
  }

  function exportMarkdown() {
    const sorted = [...data.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const content = `# ${data.book.title}\n\n${data.book.subtitle ? `${data.book.subtitle}\n\n` : ""}${sorted.map(n => `\n---\n\n## ${n.title}\n\n${n.content}\n`).join("\n")}`;
    downloadFile(`${slugify(data.book.title) || "book"}.md`, content, "text/markdown");
  }

  function importBook(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!incoming.notes) throw new Error("Invalid backup");
        setData(incoming);
        setActiveId(incoming.notes[0]?.id);
      } catch {
        alert("That file isn't a valid StoryForge backup.");
      }
    };
    reader.readAsText(file);
  }

  function insertAtCursor(text) {
    const el = textareaRef.current;
    if (!el || !active) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = active.content.slice(0, start);
    const after = active.content.slice(end);
    updateNote(active.id, { content: before + text + after });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  useEffect(() => {
    const onKey = e => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommand(true);
      }
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setView(v => v === "preview" ? "editor" : "preview");
      }
      if (e.key === "Escape") {
        setShowCommand(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = [
    ["New note", () => createNote("note")],
    ["New chapter", () => createNote("chapter", "Draft")],
    ["Toggle preview", () => setView(v => v === "preview" ? "editor" : "preview")],
    ["Focus mode", () => { setSidebar(false); setInspector(false); }],
    ["Export Markdown", exportMarkdown],
    ["Export backup", exportBook]
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <button className="icon-btn mobile-only" onClick={() => setSidebar(v => !v)} title="Toggle sidebar"><Menu size={17}/></button>
          <BookOpen size={17} />
          <span>StoryForge</span>
          <span className="dot">·</span>
          <span className="book-name">{data.book.title}</span>
        </div>
        <div className="top-actions">
          <span className="save-state">{saveState}</span>
          <button className="icon-btn" onClick={() => setShowCommand(true)} title="Command palette"><Command size={16}/></button>
          <button className="icon-btn" onClick={() => setInspector(v => !v)} title="Toggle inspector"><PanelRight size={16}/></button>
        </div>
      </header>

      <div className="workspace">
        {sidebar && <aside className="sidebar">
          <div className="book-card">
            <div className="eyebrow">BOOK</div>
            <input className="book-title-input" value={data.book.title} onChange={e => setData(d => ({...d, book: {...d.book, title: e.target.value}}))} />
            <input className="book-subtitle-input" value={data.book.subtitle} onChange={e => setData(d => ({...d, book: {...d.book, subtitle: e.target.value}}))} />
          </div>

          <div className="search-wrap">
            <Search size={15}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search everything…" />
            <kbd>⌘K</kbd>
          </div>

          <nav className="nav">
            <button className={`nav-row ${activePanel === "library" ? "active" : ""}`} onClick={() => setActivePanel("library")}><Library size={15}/><span>Library</span><span className="count">{data.notes.length}</span></button>
            <button className={`nav-row ${activePanel === "outline" ? "active" : ""}`} onClick={() => setActivePanel("outline")}><List size={15}/><span>Outline</span></button>
            <button className={`nav-row ${activePanel === "timeline" ? "active" : ""}`} onClick={() => setActivePanel("timeline")}><Clock3 size={15}/><span>Timeline</span></button>
            <button className={`nav-row ${activePanel === "characters" ? "active" : ""}`} onClick={() => setActivePanel("characters")}><Users size={15}/><span>Characters</span><span className="count">{data.characters.length}</span></button>
          </nav>

          <div className="section-head">
            <span>Your notes</span>
            <button className="mini-btn" onClick={() => createNote("note")} title="New note"><Plus size={14}/></button>
          </div>

          <div className="note-tree">
            {filteredNotes.map(n => (
              <button key={n.id} className={`note-row ${n.id === activeId ? "selected" : ""}`} onClick={() => {setActiveId(n.id); setView("editor");}}>
                {n.kind === "chapter" ? <FileText size={14}/> : n.kind === "character" ? <UserRound size={14}/> : n.kind === "timeline" ? <CalendarDays size={14}/> : <PenLine size={14}/>}
                <span className="note-row-title">{n.title}</span>
                <span className="note-kind">{n.kind}</span>
              </button>
            ))}
            {!filteredNotes.length && <div className="empty-side">Nothing matches.</div>}
          </div>

          <div className="sidebar-footer">
            <button className="nav-row" onClick={() => importRef.current?.click()}><Upload size={15}/><span>Import backup</span></button>
            <button className="nav-row" onClick={exportBook}><Download size={15}/><span>Export backup</span></button>
            <button className="nav-row" onClick={exportMarkdown}><BookMarked size={15}/><span>Export Markdown</span></button>
            <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={e => e.target.files?.[0] && importBook(e.target.files[0])}/>
          </div>
        </aside>}

        <main className="main">
          {activePanel !== "library" ? (
            <PanelContent activePanel={activePanel} data={data} setActiveId={setActiveId} createNote={createNote} active={active} />
          ) : (
            <div className="editor-shell">
              <div className="editor-header">
                <div className="breadcrumbs"><span>{active?.folder}</span><ChevronRight size={14}/><span>{active?.kind}</span></div>
                <div className="editor-actions">
                  <button className={`view-toggle ${view === "editor" ? "on" : ""}`} onClick={() => setView("editor")}><Edit3 size={14}/> Write</button>
                  <button className={`view-toggle ${view === "preview" ? "on" : ""}`} onClick={() => setView("preview")}><Eye size={14}/> Preview</button>
                  <button className="icon-btn" onClick={deleteActive} title="Delete note"><Trash2 size={15}/></button>
                  <button className="icon-btn" onClick={() => setShowCommand(true)} title="More"><MoreHorizontal size={16}/></button>
                </div>
              </div>

              <div className="editor-title-row">
                <input className="note-title-input" value={active?.title || ""} onChange={e => active && updateNote(active.id, {title: e.target.value})}/>
                <div className="submeta">{formatCount(wordCount(active?.content || ""))} words · updated {new Date(active?.updatedAt || Date.now()).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</div>
              </div>

              <div className="quick-tools">
                <button onClick={() => insertAtCursor("**bold**")}>B</button>
                <button onClick={() => insertAtCursor("_italic_")}><i>I</i></button>
                <button onClick={() => insertAtCursor("\n## Heading\n")}>H</button>
                <button onClick={() => insertAtCursor("\n- list item\n")}>•</button>
                <button onClick={() => insertAtCursor("> quote\n")}>”</button>
                <button onClick={() => insertAtCursor("[[Linked Note]]")}>[[ ]]</button>
                <button onClick={() => insertAtCursor("#tag ")}>#</button>
              </div>

              {view === "editor" ? (
                <textarea
                  ref={textareaRef}
                  className="editor"
                  spellCheck="false"
                  value={active?.content || ""}
                  onChange={e => active && updateNote(active.id, {content: e.target.value, tags: [...new Set([...active.tags, ...extractTags(e.target.value)])]})}
                  placeholder="Start writing…"
                />
              ) : (
                <article className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{active?.content || ""}</ReactMarkdown>
                </article>
              )}

              <div className="editor-status">
                <span>{formatCount(wordCount(active?.content || ""))} words</span>
                <span>{active?.content?.length || 0} chars</span>
                <span>Markdown</span>
                <span className="status-spacer"/>
                <span>Local-first · autosaved</span>
              </div>
            </div>
          )}
        </main>

        {inspector && <aside className="inspector">
          <div className="inspector-head">
            <span>Inspector</span>
            <button className="icon-btn" onClick={() => setInspector(false)}><X size={15}/></button>
          </div>

          <div className="inspector-section">
            <div className="inspector-label">BOOK PROGRESS</div>
            <div className="progress-wrap"><div className="progress-bar" style={{width: `${Math.min(100, (stats.words / Math.max(1, data.book.targetWords)) * 100)}%`}} /></div>
            <div className="progress-meta"><strong>{formatCount(stats.words)}</strong><span>{formatCount(data.book.targetWords)} target</span></div>
          </div>

          <div className="inspector-section">
            <div className="inspector-label">NOTE</div>
            <div className="stat-grid">
              <div><strong>{formatCount(wordCount(active?.content || ""))}</strong><span>words</span></div>
              <div><strong>{active?.content?.split(/\n/).length || 0}</strong><span>lines</span></div>
            </div>
          </div>

          <div className="inspector-section">
            <div className="inspector-label">TAGS</div>
            <div className="tags">
              {[...(active?.tags || []), ...extractTags(active?.content || "")].filter((x,i,a)=>a.indexOf(x)===i).map(t => (
                <button key={t} className="tag-pill" onClick={() => setSelectedTag(t)}><Hash size={11}/>{t}</button>
              ))}
              {!active?.tags?.length && <span className="muted">No tags yet.</span>}
            </div>
          </div>

          <div className="inspector-section">
            <div className="inspector-label">LINKS</div>
            <div className="links-list">
              {extractLinks(active?.content || "").map(link => {
                const target = data.notes.find(n => n.title.toLowerCase() === link.toLowerCase());
                return <button key={link} className="link-row" onClick={() => target && (setActiveId(target.id), setActivePanel("library"))}><Link2 size={13}/><span>{link}</span>{target ? <Check size={12}/> : <span className="broken">?</span>}</button>
              })}
              {!extractLinks(active?.content || "").length && <span className="muted">Use <code>[[Name]]</code> to connect notes.</span>}
            </div>
          </div>

          <div className="inspector-section">
            <div className="inspector-label">BACKLINKS</div>
            {backlinks.length ? backlinks.map(n => (
              <button className="backlink" key={n.id} onClick={() => {setActiveId(n.id); setActivePanel("library");}}>
                <div><Link2 size={13}/><span>{n.title}</span></div><small>{n.kind}</small>
              </button>
            )) : <span className="muted">No notes link here yet.</span>}
          </div>

          <div className="inspector-section">
            <div className="inspector-label">FAST ACTIONS</div>
            <button className="wide-action" onClick={() => createNote("chapter", "Draft")}><CirclePlus size={14}/> New chapter</button>
            <button className="wide-action" onClick={() => createNote("note", "Ideas")}><Sparkles size={14}/> Capture idea</button>
            <button className="wide-action" onClick={() => setShowCommand(true)}><Keyboard size={14}/> Keyboard shortcuts</button>
          </div>
        </aside>}
      </div>

      {showCommand && (
        <div className="modal-backdrop" onMouseDown={() => setShowCommand(false)}>
          <div className="command" onMouseDown={e => e.stopPropagation()}>
            <div className="command-search"><Search size={16}/><input autoFocus placeholder="Type a command…" /></div>
            <div className="command-list">
              {commands.map(([label, fn], i) => (
                <button key={label} onClick={() => {fn(); setShowCommand(false);}}>
                  <span>{label}</span><kbd>{i === 0 ? "⌘ N" : i === 1 ? "⌘ ⇧ N" : ""}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bottom-hint">⌘K command palette · ⌘P preview · all data stays in this browser</div>
    </div>
  );
}

function PanelContent({ activePanel, data, setActiveId, createNote, active }) {
  if (activePanel === "outline") {
    const headings = (active?.content || "").split("\n").map((line, i) => {
      const m = line.match(/^(#{1,4})\s+(.+)/);
      return m ? { level: m[1].length, title: m[2], line: i } : null;
    }).filter(Boolean);
    return (
      <div className="panel-page">
        <div className="page-kicker">STRUCTURE</div>
        <h1>Outline</h1>
        <p className="page-intro">The shape of <strong>{active?.title}</strong>, pulled directly from your Markdown headings.</p>
        <div className="outline-list">
          {headings.map(h => <div key={h.line} className={`outline-item level-${h.level}`}><span>{h.level === 1 ? "01" : h.level === 2 ? "02" : "03"}</span>{h.title.replace(/[*_`]/g,"")}</div>)}
          {!headings.length && <div className="empty-state">Add Markdown headings like <code>## Scene One</code> to build your outline.</div>}
        </div>
      </div>
    );
  }

  if (activePanel === "timeline") {
    return (
      <div className="panel-page">
        <div className="page-kicker">CHRONOLOGY</div>
        <h1>Timeline</h1>
        <p className="page-intro">Keep story time separate from writing time.</p>
        <div className="timeline">
          {data.timeline.map((t, idx) => (
            <div className="timeline-item" key={t.id}>
              <div className="timeline-dot">{String(idx+1).padStart(2,"0")}</div>
              <div><div className="timeline-date">{t.date}</div><h3>{t.title}</h3><p>{t.detail}</p></div>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={() => createNote("timeline", "Planning")}><Plus size={15}/> Add timeline note</button>
      </div>
    );
  }

  if (activePanel === "characters") {
    return (
      <div className="panel-page">
        <div className="page-kicker">CAST</div>
        <h1>Characters</h1>
        <p className="page-intro">A compact character ledger. The real pages still live in your notes.</p>
        <div className="character-grid">
          {data.characters.map(c => (
            <div className="character-card" key={c.id}>
              <div className="avatar">{c.name.slice(0,1)}</div>
              <div><h3>{c.name}</h3><span>{c.role}</span><p>{c.note}</p></div>
            </div>
          ))}
        </div>
        <button className="primary-btn" onClick={() => createNote("character", "Characters")}><Plus size={15}/> Add character page</button>
      </div>
    );
  }
  return null;
}

function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

createRoot(document.getElementById("root")).render(<App />);
