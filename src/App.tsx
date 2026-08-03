import { useEffect, useState, useMemo } from 'react';
import type { FilterCategory, Note } from './types/note';
import { getAllNotes, saveNote, deleteNotePermanently } from './lib/storage/db';
import { searchNotes } from './lib/search/searchEngine';
import { FilterBar } from './components/FilterBar';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { EmptyState } from './components/EmptyState';
import { ExportImportModal } from './components/ExportImportModal';
import { SettingsModal, DEFAULT_SETTINGS } from './components/SettingsModal';
import type { AppSettings } from './components/SettingsModal';
import {
  Undo2,
  PanelLeftOpen,
  Search,
  X,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import type { SortOption } from './types/note';

const SETTINGS_KEY = 'instant_notes_app_settings';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [undoNote, setUndoNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Panel Collapse States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  };

  useEffect(() => {
    setIsLoading(true);
    getAllNotes().then((loaded) => {
      setNotes(loaded);
      setIsLoading(false);
    });
  }, []);

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!settings.keyboardShortcuts) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewNote();
      } else if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveFilter('favorites');
        setSelectedSubject(null);
        setSelectedTag(null);
      } else if (e.key === 'Escape') {
        if (selectedNoteId) {
          setSelectedNoteId(null);
        } else if (isFocusMode) {
          setIsFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [notes, settings.keyboardShortcuts, isFocusMode, selectedNoteId]);

  const handleSelectNote = async (id: string) => {
    setSelectedNoteId(id);
    const target = notes.find((n) => n.id === id);
    if (target) {
      const updated = { ...target, lastOpenedAt: Date.now() };
      await saveNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  const handleCreateNewNote = async () => {
    const newNote: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: '',
      content: '',
      subject: selectedSubject || 'Umum',
      tags: selectedTag ? [selectedTag] : ['Catatan'],
      isFavorite: false,
      isTrash: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    await saveNote(newNote);
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const handleDuplicateNote = async (sourceNote: Note) => {
    if (sourceNote.isTrash) return;

    const duplicated: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: sourceNote.title ? `${sourceNote.title} (Salinan)` : 'Salinan Catatan',
      content: sourceNote.content,
      subject: sourceNote.subject,
      tags: [...sourceNote.tags],
      isFavorite: false,
      isTrash: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };

    await saveNote(duplicated);
    setNotes((prev) => [duplicated, ...prev]);
    setSelectedNoteId(duplicated.id);
  };

  const handleSaveNote = async (updated: Note) => {
    await saveNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleToggleFavorite = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const updated = { ...target, isFavorite: !target.isFavorite, updatedAt: Date.now() };
    await handleSaveNote(updated);
  };

  const handleToggleTrash = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const updated = { ...target, isTrash: !target.isTrash, updatedAt: Date.now() };
    await handleSaveNote(updated);

    if (updated.isTrash) {
      setUndoNote(target);
      setTimeout(() => setUndoNote(null), 6000);
    }
  };

  const handleUndoTrash = async () => {
    if (!undoNote) return;
    const restored = { ...undoNote, isTrash: false, updatedAt: Date.now() };
    await handleSaveNote(restored);
    setUndoNote(null);
  };

  const handleEmptyTrash = async () => {
    const trashNotes = notes.filter((n) => n.isTrash);
    if (trashNotes.length === 0) return;

    if (window.confirm(`Hapus permanen seluruh ${trashNotes.length} catatan di tempat sampah?`)) {
      for (const note of trashNotes) {
        await deleteNotePermanently(note.id);
      }
      setNotes((prev) => prev.filter((n) => !n.isTrash));
      if (selectedNote?.isTrash) {
        setSelectedNoteId(null);
      }
    }
  };

  const subjects = useMemo(() => {
    const map = new Map<string, number>();
    notes.filter((n) => !n.isTrash && n.subject).forEach((n) => {
      map.set(n.subject, (map.get(n.subject) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [notes]);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    notes.filter((n) => !n.isTrash).flatMap((n) => n.tags).forEach((t) => {
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  const allTagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const totalActiveNotes = useMemo(() => notes.filter((n) => !n.isTrash).length, [notes]);
  const favoriteCount = useMemo(() => notes.filter((n) => !n.isTrash && n.isFavorite).length, [notes]);
  const trashCount = useMemo(() => notes.filter((n) => n.isTrash).length, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFilter === 'favorites') {
      result = result.filter((n) => !n.isTrash && n.isFavorite);
    } else if (activeFilter === 'trash') {
      result = result.filter((n) => n.isTrash);
    } else if (activeFilter === 'recent') {
      result = result
        .filter((n) => !n.isTrash && n.lastOpenedAt)
        .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
        .slice(0, 10);
      return result;
    } else {
      result = result.filter((n) => !n.isTrash);
    }

    if (selectedSubject) {
      result = result.filter((n) => n.subject.toLowerCase() === selectedSubject.toLowerCase());
    }

    if (selectedTag) {
      result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
    }

    return [...result].sort((a, b) => {
      if (settings.defaultSort === 'newest') return b.createdAt - a.createdAt;
      if (settings.defaultSort === 'oldest') return a.createdAt - b.createdAt;
      if (settings.defaultSort === 'recent') return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      if (settings.defaultSort === 'a-z') return a.title.localeCompare(b.title);
      if (settings.defaultSort === 'z-a') return b.title.localeCompare(a.title);
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, activeFilter, selectedSubject, selectedTag, settings.defaultSort]);

  const searchResults = useMemo(() => {
    return searchNotes(filteredNotes, searchQuery);
  }, [filteredNotes, searchQuery]);

  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const fontSizeClass = useMemo(() => {
    if (settings.fontSize === 'sm') return 'text-xs';
    if (settings.fontSize === 'lg') return 'text-base';
    return 'text-sm';
  }, [settings.fontSize]);

  const showSidebar = isSidebarOpen && !isFocusMode;

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[#171719] text-zinc-100 font-sans ${fontSizeClass}`}>
      {/* 1. Craft Left Sidebar */}
      {showSidebar && (
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={(f) => {
            setActiveFilter(f);
            setSelectedNoteId(null);
          }}
          selectedSubject={selectedSubject}
          onSubjectChange={(s) => {
            setSelectedSubject(s);
            setSelectedNoteId(null);
          }}
          selectedTag={selectedTag}
          onTagChange={(t) => {
            setSelectedTag(t);
            setSelectedNoteId(null);
          }}
          subjects={subjects}
          tags={tags}
          totalNotes={totalActiveNotes}
          favoriteCount={favoriteCount}
          trashCount={trashCount}
          onNewNote={handleCreateNewNote}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectNote}
          filteredNotes={searchResults.map((sr) => sr.note)}
          onToggleSidebar={() => setIsSidebarOpen(false)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
        />
      )}

      {/* 2. Main Content View Area (Craft Top Header Bar + All Docs View or Editor) */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#171719]">
        {/* Craft Global Top Header Bar */}
        <header className="h-12 border-b border-white/5 bg-[#141416]/90 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && !isFocusMode && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202024] transition-colors"
                title="Buka Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {selectedNoteId && (
              <button
                onClick={() => setSelectedNoteId(null)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-[#202024] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dokumentasi</span>
              </button>
            )}
          </div>

          {/* Center Floating Pill Search Bar (Craft "Q Open" Style) */}
          <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Open or search documents... (Ctrl+K)"
              className="w-full pl-9 pr-8 py-1.5 bg-[#202024] border border-white/5 rounded-full text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all text-center focus:text-left"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Header Actions: Sorting & View Controls */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1 bg-[#202024] border border-white/5 rounded-lg px-2 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={settings.defaultSort}
                onChange={(e) => handleUpdateSettings({ ...settings, defaultSort: e.target.value as SortOption })}
                className="bg-transparent text-[11px] font-medium text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="updated">Date Updated</option>
                <option value="newest">Date Created</option>
                <option value="a-z">Name (A-Z)</option>
              </select>
            </div>

            <div className="hidden md:flex items-center border border-white/5 bg-[#202024] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#2b2b32] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#2b2b32] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Body: Show Note Editor if Selected, Else Show All Docs Grid/List View */}
        {selectedNoteId ? (
          <NoteEditor
            note={selectedNote}
            allExistingTags={allTagNames}
            onSave={handleSaveNote}
            onClose={() => setSelectedNoteId(null)}
            onToggleFavorite={handleToggleFavorite}
            onToggleTrash={handleToggleTrash}
            onDuplicate={(n) => handleDuplicateNote(n)}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            onNewNote={handleCreateNewNote}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
            {/* View Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateNewNote}
                  className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-md"
                  title="Catatan Baru"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {selectedSubject
                    ? selectedSubject
                    : selectedTag
                    ? `#${selectedTag}`
                    : activeFilter === 'favorites'
                    ? 'Favorit'
                    : activeFilter === 'trash'
                    ? 'Tempat Sampah'
                    : 'All Docs'}
                </h1>
              </div>

              {activeFilter === 'trash' && trashCount > 0 && (
                <button
                  onClick={handleEmptyTrash}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 text-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-500/30 transition-all border border-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Sampah ({trashCount})</span>
                </button>
              )}
            </div>

            {/* Content Cards Grid / List */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-[#202024] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState
                type={searchQuery ? 'search' : activeFilter}
                onNewNote={handleCreateNewNote}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map(({ note, snippet }) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    snippet={snippet}
                    searchQuery={searchQuery}
                    isSelected={selectedNoteId === note.id}
                    onSelect={() => handleSelectNote(note.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-w-3xl">
                {searchResults.map(({ note, snippet }) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className="p-4 rounded-xl bg-[#202024] hover:bg-[#27272c] border border-white/5 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="overflow-hidden pr-4">
                      <h3 className="font-bold text-sm text-white truncate">{note.title || 'Catatan Tanpa Judul'}</h3>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{snippet}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">{note.subject || 'Umum'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {undoNote && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#25252b] text-white text-xs font-semibold rounded-xl shadow-2xl border border-white/10 font-sans">
          <span>Catatan dipindahkan ke tempat sampah.</span>
          <button
            onClick={handleUndoTrash}
            className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Batalkan</span>
          </button>
        </div>
      )}

      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        notes={notes}
        onNotesImported={(imported) => {
          setNotes(imported);
          if (imported.length > 0) setSelectedNoteId(imported[0].id);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearSearchHistory={() => setSearchQuery('')}
        onResetSettings={handleResetSettings}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />
    </div>
  );
}
