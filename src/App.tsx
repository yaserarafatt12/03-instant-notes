import { useEffect, useState, useMemo } from 'react';
import type { FilterCategory, Note } from './types/note';
import { getAllNotes, saveNote } from './lib/storage/db';
import { searchNotes } from './lib/search/searchEngine';
import { FilterBar } from './components/FilterBar';
import { NoteEditor } from './components/NoteEditor';
import { ExportImportModal } from './components/ExportImportModal';
import { SettingsModal, DEFAULT_SETTINGS } from './components/SettingsModal';
import type { AppSettings } from './components/SettingsModal';
import { Undo2, PanelLeftOpen } from 'lucide-react';

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
  const [_isLoading, setIsLoading] = useState<boolean>(true);

  // Panel Collapse States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
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
    <div className={`flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-zinc-100 font-sans ${fontSizeClass}`}>
      {/* 1. Left Sidebar (Panel 1) */}
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
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectNote}
          filteredNotes={searchResults.map((sr) => sr.note)}
          onToggleSidebar={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Full-Width Note Editor / Dashboard (Panel 2) */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Floating Sidebar Open Trigger when Sidebar is Collapsed */}
        {!isSidebarOpen && !isFocusMode && (
          <div className="absolute top-3 left-3 z-20">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-[#13141b]/90 backdrop-blur-md text-zinc-400 hover:text-white rounded-xl border border-[#1f212c] shadow-md transition-colors"
              title="Buka Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
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
          onNewNote={handleCreateNewNote}
        />
      </div>

      {/* Toast Notification */}
      {undoNote && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#171822] text-white text-xs font-semibold rounded-xl shadow-2xl border border-[#272938] font-sans">
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
