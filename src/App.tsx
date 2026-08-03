import React, { useEffect, useState, useMemo } from 'react';
import type { FilterCategory, Note, SortOption, FontSizeOption } from './types/note';
import { getAllNotes, saveNote, deleteNotePermanently } from './lib/storage/db';
import { searchNotes } from './lib/search/searchEngine';
import { FilterBar } from './components/FilterBar';
import { SearchBar } from './components/SearchBar';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { EmptyState } from './components/EmptyState';
import { ExportImportModal } from './components/ExportImportModal';
import { Undo2, Trash2 } from 'lucide-react';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('updated');
  const [fontSize, setFontSize] = useState<FontSizeOption>('base');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [undoNote, setUndoNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Load initial notes from IndexedDB
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

  // Sync dark mode class with body element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts (Ctrl+N, Esc, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewNote();
      } else if (e.key === 'Escape') {
        setSelectedNoteId(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [notes]);

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
    };

    await saveNote(newNote);
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
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

  // Compute Subjects & Tags for filter sidebar
  const subjects = useMemo(() => {
    const set = new Set<string>();
    notes.filter((n) => !n.isTrash && n.subject).forEach((n) => set.add(n.subject));
    return Array.from(set);
  }, [notes]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.filter((n) => !n.isTrash).flatMap((n) => n.tags).forEach((t) => set.add(t));
    return Array.from(set);
  }, [notes]);

  // Compute counts
  const totalActiveNotes = useMemo(() => notes.filter((n) => !n.isTrash).length, [notes]);
  const favoriteCount = useMemo(() => notes.filter((n) => !n.isTrash && n.isFavorite).length, [notes]);
  const trashCount = useMemo(() => notes.filter((n) => n.isTrash).length, [notes]);

  // Filter notes based on category, subject, tag
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFilter === 'favorites') {
      result = result.filter((n) => !n.isTrash && n.isFavorite);
    } else if (activeFilter === 'trash') {
      result = result.filter((n) => n.isTrash);
    } else {
      result = result.filter((n) => !n.isTrash);
    }

    if (selectedSubject) {
      result = result.filter((n) => n.subject.toLowerCase() === selectedSubject.toLowerCase());
    }

    if (selectedTag) {
      result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
    }

    // Apply Sorting Options (FR-024)
    return [...result].sort((a, b) => {
      if (sortOption === 'newest') return b.createdAt - a.createdAt;
      if (sortOption === 'oldest') return a.createdAt - b.createdAt;
      if (sortOption === 'a-z') return a.title.localeCompare(b.title);
      if (sortOption === 'z-a') return b.title.localeCompare(a.title);
      return b.updatedAt - a.updatedAt; // default 'updated'
    });
  }, [notes, activeFilter, selectedSubject, selectedTag, sortOption]);

  // Apply instant search engine
  const searchResults = useMemo(() => {
    return searchNotes(filteredNotes, searchQuery);
  }, [filteredNotes, searchQuery]);

  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Compute Font Size Class (FR-023)
  const fontSizeClass = useMemo(() => {
    if (fontSize === 'sm') return 'text-xs';
    if (fontSize === 'lg') return 'text-base';
    return 'text-sm';
  }, [fontSize]);

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans ${fontSizeClass}`}>
      {/* 3-Panel Layout: 1. Sidebar FilterBar */}
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
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* 3-Panel Layout: 2. Note List & Search Panel */}
      <main className="w-full lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            resultCount={searchResults.length}
            sortOption={sortOption}
            onSortChange={setSortOption}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
          />
        </div>

        {/* Empty Trash CTA Bar for Trash Filter */}
        {activeFilter === 'trash' && trashCount > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/50 text-xs">
            <span className="text-rose-700 dark:text-rose-300 font-medium">{trashCount} Catatan di Sampah</span>
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Sampah</span>
            </button>
          </div>
        )}

        {/* Note List Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            /* Skeleton Loading State (FR-029) */
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
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
                onSelect={() => setSelectedNoteId(note.id)}
                onToggleFavorite={(e) => handleToggleFavorite(note.id, e)}
                onToggleTrash={(e) => handleToggleTrash(note.id, e)}
                onDeletePermanently={(e) => handleDeletePermanently(note.id, e)}
              />
            ))
          )}
        </div>
      </main>

      {/* 3-Panel Layout: 3. Instant Note Editor */}
      <div className="hidden md:flex flex-1 h-full">
        <NoteEditor
          note={selectedNote}
          onSave={handleSaveNote}
          onClose={() => setSelectedNoteId(null)}
          onToggleFavorite={handleToggleFavorite}
          onToggleTrash={handleToggleTrash}
        />
      </div>

      {/* Toast Notification for Trash Undo */}
      {undoNote && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-xs font-semibold rounded-2xl shadow-xl animate-bounce">
          <span>Catatan dipindahkan ke tempat sampah.</span>
          <button
            onClick={handleUndoTrash}
            className="flex items-center gap-1 text-amber-400 dark:text-amber-600 hover:underline font-bold"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Batalkan (Undo)</span>
          </button>
        </div>
      )}

      {/* Backup & Import Modal */}
      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        notes={notes}
        onNotesImported={(imported) => {
          setNotes(imported);
          if (imported.length > 0) setSelectedNoteId(imported[0].id);
        }}
      />
    </div>
  );
}
