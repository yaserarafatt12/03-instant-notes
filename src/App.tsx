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
import { CreateFolderModal } from './components/CreateFolderModal';
import { ConfirmModal } from './components/ConfirmModal';
import type { AppSettings } from './components/SettingsModal';
import {
  Undo2,
  Search,
  X,
  SlidersHorizontal,
  ArrowLeft,
  LayoutGrid,
  List,
  Check,
  ChevronDown,
  Trash2,
  CheckSquare,
  Star,
  FolderInput,
  CheckCircle2,
} from 'lucide-react';
import type { SortOption } from './types/note';

const SETTINGS_KEY = 'instant_notes_app_settings';
const CUSTOM_FOLDERS_KEY = 'instant_notes_custom_folders';
const FOLDER_META_KEY = 'instant_notes_folder_meta_map';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Persistent Folder Metadata (Icon & Color) State
  const [folderMetaMap, setFolderMetaMap] = useState<Record<string, { color?: string; icon?: string }>>(() => {
    try {
      const saved = localStorage.getItem(FOLDER_META_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load folder meta map:', e);
    }
    return {
      Umum: { color: '#6366f1', icon: 'folder' },
      Fisika: { color: '#ef6b6b', icon: 'science' },
      Biologi: { color: '#4ade80', icon: 'plant' },
      Programming: { color: '#60a5fa', icon: 'code' },
    };
  });

  // Persistent Custom Empty Folders State
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FOLDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load custom folders:', e);
    }
    return ['Fisika', 'Biologi', 'Programming'];
  });

  const handleAddFolder = (folderPath: string, color?: string, icon?: string) => {
    if (!customFolders.includes(folderPath)) {
      const updated = [...customFolders, folderPath];
      setCustomFolders(updated);
      localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updated));
    }

    if (color || icon) {
      const updatedMeta = {
        ...folderMetaMap,
        [folderPath]: { color: color || '#6366f1', icon: icon || 'folder' },
      };
      setFolderMetaMap(updatedMeta);
      localStorage.setItem(FOLDER_META_KEY, JSON.stringify(updatedMeta));
    }
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGlobalSearchOverride, setIsGlobalSearchOverride] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Multi-select Batch Operations State
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isBulkMovePopoverOpen, setIsBulkMovePopoverOpen] = useState<boolean>(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setIsGlobalSearchOverride(false);
    if (query.trim() && selectedNoteId) {
      setSelectedNoteId(null);
    }
  };

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [createFolderParentPath, setCreateFolderParentPath] = useState<string>('');

  const [undoNote, setUndoNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const bulkMoveRef = useRef<HTMLDivElement>(null);

  // Panel Collapse States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFocusMode] = useState<boolean>(false);

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

  // Sync dark/light mode class on html root (supporting System mode!)
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else if (settings.theme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        // System Mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (settings.theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  // Click outside to close sort dropdown & bulk move popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (bulkMoveRef.current && !bulkMoveRef.current.contains(e.target as Node)) {
        setIsBulkMovePopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMultiSelect = (id: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
    const defaultSubject = selectedSubject || '';
    const newNote: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: '',
      content: '',
      subject: defaultSubject,
      tags: ['Catatan'],
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

  const handleCreateNewNoteInFolder = async (folderPath: string) => {
    const newNote: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: '',
      content: '',
      subject: folderPath,
      tags: ['Catatan'],
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

  const handleRenameFolder = async (oldPath: string, newPath: string) => {
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (n.subject === oldPath || n.subject.startsWith(`${oldPath}/`)) {
          const updatedSubject = n.subject.replace(oldPath, newPath);
          const updatedNote = { ...n, subject: updatedSubject, updatedAt: Date.now() };
          await saveNote(updatedNote);
          return updatedNote;
        }
        return n;
      })
    );
    setNotes(updatedNotes);

    const updatedCustom = customFolders.map((f) =>
      f === oldPath || f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f
    );
    setCustomFolders(updatedCustom);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updatedCustom));

    const updatedMeta = { ...folderMetaMap };
    if (updatedMeta[oldPath]) {
      updatedMeta[newPath] = updatedMeta[oldPath];
      delete updatedMeta[oldPath];
      setFolderMetaMap(updatedMeta);
      localStorage.setItem(FOLDER_META_KEY, JSON.stringify(updatedMeta));
    }
  };

  const handleMoveFolder = async (sourceFolderPath: string, targetParentFolderPath: string) => {
    const folderBaseName = sourceFolderPath.split('/').pop() || sourceFolderPath;
    const newFolderPath = targetParentFolderPath
      ? `${targetParentFolderPath}/${folderBaseName}`
      : folderBaseName;

    if (sourceFolderPath === newFolderPath) return;

    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (n.subject === sourceFolderPath || n.subject.startsWith(`${sourceFolderPath}/`)) {
          const updatedSubject = n.subject.replace(sourceFolderPath, newFolderPath);
          const updatedNote = { ...n, subject: updatedSubject, updatedAt: Date.now() };
          await saveNote(updatedNote);
          return updatedNote;
        }
        return n;
      })
    );
    setNotes(updatedNotes);

    const updatedCustom = customFolders.map((f) =>
      f === sourceFolderPath || f.startsWith(`${sourceFolderPath}/`)
        ? f.replace(sourceFolderPath, newFolderPath)
        : f
    );
    if (!updatedCustom.includes(newFolderPath)) {
      updatedCustom.push(newFolderPath);
    }
    setCustomFolders(updatedCustom);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updatedCustom));

    const updatedMeta = { ...folderMetaMap };
    if (updatedMeta[sourceFolderPath]) {
      updatedMeta[newFolderPath] = updatedMeta[sourceFolderPath];
      delete updatedMeta[sourceFolderPath];
      setFolderMetaMap(updatedMeta);
      localStorage.setItem(FOLDER_META_KEY, JSON.stringify(updatedMeta));
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (n.subject === folderPath || n.subject.startsWith(`${folderPath}/`)) {
          const updatedNote = { ...n, isTrash: true, updatedAt: Date.now() };
          await saveNote(updatedNote);
          return updatedNote;
        }
        return n;
      })
    );
    setNotes(updatedNotes);

    const updatedCustom = customFolders.filter(
      (f) => f !== folderPath && !f.startsWith(`${folderPath}/`)
    );
    setCustomFolders(updatedCustom);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updatedCustom));

    const updatedMeta = { ...folderMetaMap };
    delete updatedMeta[folderPath];
    setFolderMetaMap(updatedMeta);
    localStorage.setItem(FOLDER_META_KEY, JSON.stringify(updatedMeta));

    if (selectedSubject === folderPath) setSelectedSubject(null);
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

  const handleMoveNote = async (targetNote: Note, newSubject: string) => {
    const updated = { ...targetNote, subject: newSubject, updatedAt: Date.now() };
    await saveNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === targetNote.id ? updated : n)));
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

  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  const handleEmptyTrash = async () => {
    const trashNotes = notes.filter((n) => n.isTrash);
    if (trashNotes.length === 0) return;

    for (const note of trashNotes) {
      await deleteNotePermanently(note.id);
    }
    setNotes((prev) => prev.filter((n) => !n.isTrash));
    if (selectedNote?.isTrash) {
      setSelectedNoteId(null);
    }
  };

  const handleDeletePermanently = async (id: string) => {
    await deleteNotePermanently(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  // Bulk Operations Handlers
  const handleBulkRestore = async () => {
    if (selectedNoteIds.length === 0) return;
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (selectedNoteIds.includes(n.id)) {
          const updated = { ...n, isTrash: false, updatedAt: Date.now() };
          await saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setNotes(updatedNotes);
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDeletePermanently = async () => {
    if (selectedNoteIds.length === 0) return;
    for (const id of selectedNoteIds) {
      await deleteNotePermanently(id);
    }
    setNotes((prev) => prev.filter((n) => !selectedNoteIds.includes(n.id)));
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) return;
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (selectedNoteIds.includes(n.id)) {
          const updated = { ...n, isTrash: true, updatedAt: Date.now() };
          await saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setNotes(updatedNotes);
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
  };

  const isAllSelectedFavorite = useMemo(() => {
    if (selectedNoteIds.length === 0) return false;
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    return selectedNotes.every((n) => n.isFavorite);
  }, [notes, selectedNoteIds]);

  const handleBulkFavorite = async () => {
    if (selectedNoteIds.length === 0) return;
    const targetState = !isAllSelectedFavorite;
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (selectedNoteIds.includes(n.id)) {
          const updated = { ...n, isFavorite: targetState, updatedAt: Date.now() };
          await saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setNotes(updatedNotes);
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkMove = async (targetFolder: string) => {
    if (selectedNoteIds.length === 0) return;
    const updatedNotes = await Promise.all(
      notes.map(async (n) => {
        if (selectedNoteIds.includes(n.id)) {
          const updated = { ...n, subject: targetFolder, updatedAt: Date.now() };
          await saveNote(updated);
          return updated;
        }
        return n;
      })
    );
    setNotes(updatedNotes);
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
    setIsBulkMovePopoverOpen(false);
  };

  const subjects = useMemo(() => {
    const map = new Map<string, number>();

    // Ensure all custom created folders exist in map with 0 count initial
    customFolders.forEach((f) => map.set(f, 0));

    // Count non-trash notes
    notes.filter((n) => !n.isTrash && n.subject).forEach((n) => {
      map.set(n.subject, (map.get(n.subject) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [notes, customFolders]);

  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    notes.filter((n) => !n.isTrash && n.subject).forEach((n) => set.add(n.subject));
    subjects.forEach((s) => set.add(s.name));
    return Array.from(set);
  }, [notes, subjects]);

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
        .filter((n) => !n.isTrash)
        .sort((a, b) => (b.lastOpenedAt || b.updatedAt || 0) - (a.lastOpenedAt || a.updatedAt || 0));
      return result;
    } else {
      result = result.filter((n) => !n.isTrash);
    }

    if (!isGlobalSearchOverride) {
      if (selectedSubject) {
        result = result.filter((n) => n.subject.toLowerCase() === selectedSubject.toLowerCase());
      }
      if (selectedTag) {
        result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
      }
    }

    return [...result].sort((a, b) => {
      if (settings.defaultSort === 'newest') return b.createdAt - a.createdAt;
      if (settings.defaultSort === 'oldest') return a.createdAt - b.createdAt;
      if (settings.defaultSort === 'recent') return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      if (settings.defaultSort === 'a-z') return a.title.localeCompare(b.title);
      if (settings.defaultSort === 'z-a') return b.title.localeCompare(a.title);
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, activeFilter, selectedSubject, selectedTag, isGlobalSearchOverride, settings.defaultSort]);

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

  const handleSelectAllVisible = () => {
    const visibleIds = searchResults.map((sr) => sr.note.id);
    if (selectedNoteIds.length === visibleIds.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(visibleIds);
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden midnight-ambient-bg text-slate-100 font-sans relative ${fontSizeClass}`}>
      {/* Ambient Midnight Navy Atmospheric Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-24 w-[440px] h-[440px] rounded-full bg-sky-500/[0.08] blur-[120px]" />
        <div className="absolute -top-20 right-[12%] w-[420px] h-[420px] rounded-full bg-indigo-500/[0.10] blur-[130px]" />
        <div className="absolute -bottom-36 right-[20%] w-[460px] h-[460px] rounded-full bg-violet-500/[0.08] blur-[140px]" />
      </div>

      {/* 1. Tempered Glass Left Sidebar */}
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
          onOpenCreateFolderModal={(parentPath = '') => {
            setCreateFolderParentPath(parentPath);
            setIsCreateFolderModalOpen(true);
          }}
          onNewDocInFolder={handleCreateNewNoteInFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveFolder={handleMoveFolder}
          folderMetaMap={folderMetaMap}
        />
      )}

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden bg-transparent">
        {/* Prominent Top Header Bar (Only visible in Gallery View, hidden when editing a note) */}
        {!selectedNoteId && (
          <header className="h-14 glass-header px-5 flex items-center justify-between z-20 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && !isFocusMode && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-200 hover:text-white rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-all border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                title="Buka Sidebar"
              >
                <svg className="w-4 h-3.5 text-slate-200" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1.5" y="1.5" width="17" height="13" rx="2.5" />
                  <line x1="6.5" y1="1.5" x2="6.5" y2="14.5" />
                </svg>
              </button>
            )}

            {selectedNoteId && (
              <button
                onClick={() => setSelectedNoteId(null)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] transition-all border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
                <span>Kembali ke Dokumentasi</span>
              </button>
            )}
          </div>

          {/* Prominent Floating Liquid Glass Search Bar */}
          <div className="flex-1 max-w-lg mx-6 relative hidden sm:block">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-sky-300/80 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Open or search documents... (Ctrl+K)"
              className="w-full pl-10 pr-9 py-2 glass-input rounded-full text-xs font-medium text-white placeholder:text-slate-400 focus:outline-none transition-all text-center focus:text-left"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Actions: Multi-select Toggle, Custom Popover Sort Dropdown & View Switcher */}
          <div className="flex items-center gap-2 text-xs text-slate-200">
            {/* Multi-select Toggle Button */}
            <button
              onClick={() => {
                if (isSelectionMode) {
                  setIsSelectionMode(false);
                  setSelectedNoteIds([]);
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isSelectionMode
                  ? 'liquid-lens-active text-white'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-slate-200 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
              }`}
              title="Multi-select Catatan"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {isSelectionMode
                  ? selectedNoteIds.length > 0
                    ? `${selectedNoteIds.length} Selected`
                    : 'Batal'
                  : 'Select'}
              </span>
            </button>

            {/* Custom Popover Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span>{sortLabels[settings.defaultSort]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-popover rounded-2xl p-1.5 z-40 space-y-0.5">
                  {(['updated', 'newest', 'a-z', 'z-a'] as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        handleUpdateSettings({ ...settings, defaultSort: opt });
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        settings.defaultSort === opt
                          ? 'liquid-lens-active text-white'
                          : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span>{sortLabels[opt]}</span>
                      {settings.defaultSort === opt && <Check className="w-3.5 h-3.5 text-sky-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Liquid Glass View Mode Switcher */}
            <div className="hidden md:flex items-center liquid-pill rounded-full p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'liquid-lens-active text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'liquid-lens-active text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
        )}

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
            onNewNote={handleCreateNewNote}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onSubjectChange={setSelectedSubject}
            onFilterChange={setActiveFilter}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
            {/* View Header */}
            <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-white/10 px-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pl-0.5">
                {selectedSubject
                  ? selectedSubject
                  : selectedTag
                  ? `#${selectedTag}`
                  : activeFilter === 'favorites'
                  ? 'Favorit'
                  : activeFilter === 'trash'
                  ? 'Tempat Sampah'
                  : activeFilter === 'recent'
                  ? 'Terakhir Dibuka'
                  : 'All Notes'}
              </h1>

              {activeFilter === 'trash' && trashCount > 0 && (
                <button
                  onClick={() => setIsConfirmEmptyTrashOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/20 text-rose-200 font-semibold text-xs rounded-full hover:bg-rose-500/30 transition-all border border-rose-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Sampah ({trashCount})</span>
                </button>
              )}
            </div>

            {/* Scoped Search vs Global Search Toggle Banner */}
            {searchQuery.trim() && (selectedSubject || selectedTag) && (
              <div className="flex items-center justify-between p-3.5 glass-card rounded-2xl text-xs text-slate-200">
                <span>
                  {isGlobalSearchOverride ? (
                    <>Menampilkan pencarian di <strong className="text-white">seluruh dokumen</strong></>
                  ) : (
                    <>Menampilkan hasil pencarian di folder <strong className="text-white">'{selectedSubject || selectedTag}'</strong> ({searchResults.length} hasil)</>
                  )}
                </span>
                <button
                  onClick={() => setIsGlobalSearchOverride(!isGlobalSearchOverride)}
                  className="px-3.5 py-1.5 glass-btn-primary text-white font-semibold text-xs rounded-full transition-all"
                >
                  {isGlobalSearchOverride ? 'Kembali ke Scope Folder' : 'Cari di Seluruh Dokumen'}
                </button>
              </div>
            )}

            {/* Content Cards Grid / List */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl glass-card animate-pulse" />
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
                    onToggleFavorite={handleToggleFavorite}
                    onToggleTrash={handleToggleTrash}
                    onDeletePermanently={handleDeletePermanently}
                    onDuplicateNote={handleDuplicateNote}
                    onMoveNote={handleMoveNote}
                    allExistingFolders={allFolderNames}
                    isSelectionMode={isSelectionMode}
                    isMultiSelected={selectedNoteIds.includes(note.id)}
                    onToggleMultiSelect={handleToggleMultiSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 max-w-4xl">
                {searchResults.map(({ note, snippet }) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleMultiSelect(note.id);
                      } else {
                        handleSelectNote(note.id);
                      }
                    }}
                    className={`p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                      selectedNoteIds.includes(note.id)
                        ? 'glass-card !border-sky-400/70 ring-1 ring-sky-400/50'
                        : 'glass-card'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                      {isSelectionMode && (
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            selectedNoteIds.includes(note.id)
                              ? 'bg-sky-500 border-sky-300 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                              : 'border-white/25 bg-[#071123]/80'
                          }`}
                        >
                          {selectedNoteIds.includes(note.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-white truncate">{note.title || 'Catatan Tanpa Judul'}</h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{snippet}</p>
                      </div>
                    </div>
                    {note.subject && (
                      <span className="text-xs text-sky-200 font-semibold bg-sky-400/10 px-2.5 py-1 rounded-full border border-sky-300/20 shrink-0">{note.subject}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating iOS 26 Liquid Glass Batch Multi-Select Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 liquid-pill rounded-full animate-in slide-in-from-bottom duration-200 font-sans">
          <div className="flex items-center gap-2 pr-3 border-r border-white/15 text-xs font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>{selectedNoteIds.length} dipilih</span>
          </div>

          <button
            onClick={handleSelectAllVisible}
            className="px-3 py-1.5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-semibold rounded-full transition-colors"
          >
            {selectedNoteIds.length === searchResults.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>

          {activeFilter === 'trash' ? (
            <>
              {/* Trash View Bulk Actions: Pulihkan & Hapus Permanen */}
              <button
                onClick={handleBulkRestore}
                disabled={selectedNoteIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-200 text-xs font-bold rounded-full transition-colors border border-emerald-400/35"
              >
                <Undo2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Pulihkan ({selectedNoteIds.length})</span>
              </button>

              <button
                onClick={handleBulkDeletePermanently}
                disabled={selectedNoteIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-200 text-xs font-bold rounded-full transition-colors border border-rose-400/35"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Hapus Permanen ({selectedNoteIds.length})</span>
              </button>
            </>
          ) : (
            <>
              {/* Normal View Bulk Actions */}
              <button
                onClick={handleBulkFavorite}
                disabled={selectedNoteIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40 text-amber-300 text-xs font-semibold rounded-full transition-colors"
              >
                <Star className={`w-3.5 h-3.5 ${isAllSelectedFavorite ? 'fill-amber-300' : 'fill-amber-300/20'}`} />
                <span>{isAllSelectedFavorite ? 'Unfavoritkan' : 'Favoritkan'}</span>
              </button>

              {/* Bulk Move Popover */}
              <div className="relative" ref={bulkMoveRef}>
                <button
                  onClick={() => setIsBulkMovePopoverOpen(!isBulkMovePopoverOpen)}
                  disabled={selectedNoteIds.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-full transition-colors"
                >
                  <FolderInput className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pindah Folder</span>
                </button>

                {isBulkMovePopoverOpen && (
                  <div className="absolute bottom-full mb-2.5 left-0 w-44 glass-popover rounded-2xl p-1.5 z-50 max-h-40 overflow-y-auto space-y-0.5 font-sans">
                    {allFolderNames.map((f) => (
                      <button
                        key={f}
                        onClick={() => handleBulkMove(f)}
                        className="w-full text-left px-2.5 py-1.5 text-xs truncate rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkDelete}
                disabled={selectedNoteIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-200 text-xs font-bold rounded-full transition-colors border border-rose-400/35"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Hapus ({selectedNoteIds.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setIsSelectionMode(false);
              setSelectedNoteIds([]);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Tutup Mode Pilih"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {undoNote && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 glass-popover text-white text-xs font-semibold rounded-full font-sans">
          <span>Catatan dipindahkan ke tempat sampah.</span>
          <button
            onClick={handleUndoTrash}
            className="flex items-center gap-1 text-sky-300 hover:text-sky-200 hover:underline font-bold"
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

      {/* Create New Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        parentPath={createFolderParentPath}
        onFolderCreated={(folderPath, color, icon) => {
          handleAddFolder(folderPath, color, icon);
          setSelectedSubject(folderPath);
        }}
      />

      {/* Confirm Empty Trash Modal */}
      <ConfirmModal
        isOpen={isConfirmEmptyTrashOpen}
        onClose={() => setIsConfirmEmptyTrashOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Kosongkan Tempat Sampah"
        message={`Hapus permanen seluruh ${trashCount} catatan di tempat sampah? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
