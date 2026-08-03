import React, { useEffect, useState, useMemo } from 'react';
import type { FilterCategory, Note } from './types/note';
import { getAllNotes, saveNote, deleteNotePermanently } from './lib/storage/db';
import { searchNotes } from './lib/search/searchEngine';
import { FilterBar } from './components/FilterBar';
import { SearchBar } from './components/SearchBar';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { EmptyState } from './components/EmptyState';
import { ExportImportModal } from './components/ExportImportModal';
import { SettingsModal, DEFAULT_SETTINGS } from './components/SettingsModal';
import type { AppSettings } from './components/SettingsModal';
import { Undo2, Trash2, PanelLeftOpen, Columns2, Plus } from 'lucide-react';

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

  // Panel Collapse States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isNoteListOpen, setIsNoteListOpen] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Settings State with LocalStorage Persistence
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
      if (loaded.length > 0) {
        setSelectedNoteId(loaded[0].id);
      }
      setIsLoading(false);
    });
  }, []);

  const isDarkMode = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [settings.theme]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
        if (isFocusMode) {
          setIsFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [notes, settings.keyboardShortcuts, isFocusMode]);

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

  const handleDuplicateNote = async (sourceNote: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const updated = { ...target, isFavorite: !target.isFavorite, updatedAt: Date.now() };
    await handleSaveNote(updated);
  };

  const handleToggleTrash = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleDeletePermanently = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await deleteNotePermanently(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
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
  const showNoteList = isNoteListOpen && !isFocusMode;

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans ${fontSizeClass}`}>
      {/* 1. Sidebar FilterBar */}
      {showSidebar && (
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedSubject={selectedSubject}
          onSubjectChange={setSelectedSubject}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          subjects={subjects}
          tags={tags}
          totalNotes={totalActiveNotes}
          favoriteCount={favoriteCount}
          trashCount={trashCount}
          onNewNote={handleCreateNewNote}
          onExport={() => setIsBackupModalOpen(true)}
          onImport={() => setIsBackupModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() =>
            handleUpdateSettings({
              ...settings,
              theme: isDarkMode ? 'light' : 'dark',
            })
          }
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Note List & Search Panel */}
      {showNoteList && (
        <main className="w-full lg:w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm flex flex-col gap-2">
            {/* Top Toolbar Trigger Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Buka Sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsNoteListOpen(!isNoteListOpen)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Sembunyikan Daftar Catatan"
                >
                  <Columns2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleCreateNewNote}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs rounded-md transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Baru</span>
              </button>
            </div>

            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              resultCount={searchResults.length}
              sortOption={settings.defaultSort}
              onSortChange={(sort) => handleUpdateSettings({ ...settings, defaultSort: sort })}
              fontSize={settings.fontSize}
              onFontSizeChange={(size) => handleUpdateSettings({ ...settings, fontSize: size })}
            />
          </div>

          {activeFilter === 'trash' && trashCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{trashCount} di Tempat Sampah</span>
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/40 animate-pulse space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState
                type={searchQuery ? 'search' : activeFilter}
                onNewNote={handleCreateNewNote}
              />
            ) : (
              searchResults.map(({ note, snippet }) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  snippet={snippet}
                  searchQuery={searchQuery}
                  isSelected={selectedNoteId === note.id}
                  onSelect={() => handleSelectNote(note.id)}
                  onToggleFavorite={(e) => handleToggleFavorite(note.id, e)}
                  onToggleTrash={(e) => handleToggleTrash(note.id, e)}
                  onDuplicateNote={(e) => handleDuplicateNote(note, e)}
                  onDeletePermanently={(e) => handleDeletePermanently(note.id, e)}
                />
              ))
            )}
          </div>
        </main>
      )}

      {/* 3. Instant Note Editor */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Floating Toggle Header when Panels are Collapsed */}
        {(!isSidebarOpen || !isNoteListOpen || isFocusMode) && (
          <div className="absolute top-2.5 left-3 z-20 flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
            {!isSidebarOpen && !isFocusMode && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Buka Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            {!isNoteListOpen && !isFocusMode && (
              <button
                onClick={() => setIsNoteListOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Tampilkan Daftar Catatan"
              >
                <Columns2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

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
        />
      </div>

      {/* Toast Notification */}
      {undoNote && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl shadow-xl border border-zinc-800 dark:border-zinc-200 font-sans">
          <span>Catatan dipindahkan ke tempat sampah.</span>
          <button
            onClick={handleUndoTrash}
            className="flex items-center gap-1 text-amber-400 dark:text-amber-600 hover:underline font-bold"
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
      />
    </div>
  );
}
