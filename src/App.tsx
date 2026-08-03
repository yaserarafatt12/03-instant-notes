import { useEffect, useState, useMemo, useRef } from 'react';
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
  Check,
  ChevronDown,
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
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);

  const sortRef = useRef<HTMLDivElement>(null);

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

  // Sync dark/light mode class on html root
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
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

  const sortLabels: Record<SortOption, string> = {
    updated: 'Date Updated',
    newest: 'Date Created',
    oldest: 'Oldest First',
    'a-z': 'Name (A-Z)',
    'z-a': 'Name (Z-A)',
    recent: 'Recently Opened',
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[#1e1e22] text-zinc-100 font-sans ${fontSizeClass}`}>
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

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#1e1e22]">
        {/* Prominent Top Header Bar */}
        <header className="h-14 border-b border-white/10 bg-[#18181c] px-5 flex items-center justify-between z-10 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && !isFocusMode && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-zinc-200 hover:text-white rounded-xl hover:bg-[#28282e] transition-colors border border-white/10"
                title="Buka Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {selectedNoteId && (
              <button
                onClick={() => setSelectedNoteId(null)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-white px-3 py-1.5 rounded-xl bg-[#28282e] hover:bg-[#32323a] transition-all border border-white/10"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>Kembali ke Dokumentasi</span>
              </button>
            )}
          </div>

          {/* Prominent Floating Search Bar */}
          <div className="flex-1 max-w-lg mx-6 relative hidden sm:block">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-200 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Open or search documents... (Ctrl+K)"
              className="w-full pl-10 pr-9 py-2 bg-[#25252a] border border-white/10 rounded-full text-xs font-medium text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-center focus:text-left shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Actions: Custom Popover Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2 text-xs text-zinc-200">
            {/* Custom Popover Dropdown (No Jadul HTML Select!) */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 bg-[#25252a] hover:bg-[#2d2d34] border border-white/10 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>{sortLabels[settings.defaultSort]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#25252a] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-40 space-y-0.5">
                  {(['updated', 'newest', 'a-z', 'z-a'] as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        handleUpdateSettings({ ...settings, defaultSort: opt });
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        settings.defaultSort === opt
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-300 hover:bg-[#303038] hover:text-white'
                      }`}
                    >
                      <span>{sortLabels[opt]}</span>
                      {settings.defaultSort === opt && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="hidden md:flex items-center border border-white/10 bg-[#25252a] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Body */}
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
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateNewNote}
                  className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-md active:scale-95"
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl hover:bg-rose-500/30 transition-all border border-rose-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Sampah ({trashCount})</span>
                </button>
              )}
            </div>

            {/* Content Cards Grid / List */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-[#27272d] border border-white/5 animate-pulse" />
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
              <div className="space-y-2.5 max-w-4xl">
                {searchResults.map(({ note, snippet }) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className="p-4 rounded-2xl bg-[#27272d] hover:bg-[#303038] border border-white/10 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="overflow-hidden pr-4">
                      <h3 className="font-bold text-sm text-white truncate">{note.title || 'Catatan Tanpa Judul'}</h3>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{snippet}</p>
                    </div>
                    <span className="text-xs text-zinc-300 font-semibold bg-[#1e1e22] px-2.5 py-1 rounded-lg border border-white/5 shrink-0">{note.subject || 'Umum'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {undoNote && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#27272d] text-white text-xs font-bold rounded-xl shadow-2xl border border-white/10 font-sans">
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
        notes={notes}
        onNotesImported={(imported) => {
          setNotes(imported);
          if (imported.length > 0) setSelectedNoteId(imported[0].id);
        }}
      />
    </div>
  );
}
