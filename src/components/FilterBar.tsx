import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  Folder as FolderIcon,
  History,
  Settings,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';
import type { FilterCategory, Note } from '../types/note';

interface FilterBarProps {
  activeFilter: FilterCategory;
  onFilterChange: (f: FilterCategory) => void;
  selectedSubject: string | null;
  onSubjectChange: (s: string | null) => void;
  selectedTag: string | null;
  onTagChange: (t: string | null) => void;
  subjects: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  totalNotes: number;
  favoriteCount: number;
  trashCount: number;
  onNewNote: () => void;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
  onOpenBackup?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  notes?: Note[];
  selectedNoteId?: string | null;
  onSelectNote?: (id: string) => void;
  filteredNotes?: Note[];
  onAddFolder?: (folderName: string) => void;
}

const PINNED_TAGS_KEY = 'instant_notes_pinned_tags';

// Tree interface for recursive subfolder support
interface FolderNode {
  name: string;
  fullPath: string;
  count: number;
  children: Map<string, FolderNode>;
  documents: Note[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  selectedSubject,
  onSubjectChange,
  selectedTag,
  onTagChange,
  subjects,
  tags,
  totalNotes,
  favoriteCount,
  trashCount,
  onNewNote,
  onOpenSettings,
  onToggleSidebar,
  notes = [],
  selectedNoteId,
  onSelectNote = () => {},
  onAddFolder,
}) => {
  const [isFoldersSectionCollapsed, setIsFoldersSectionCollapsed] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);
  const [isPinTagPopoverOpen, setIsPinTagPopoverOpen] = useState(false);

  // Track expanded folder paths for recursive tree
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<string[]>([]);

  const tagPopoverRef = useRef<HTMLDivElement>(null);

  // Pinned Tags State
  const [pinnedTags, setPinnedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_TAGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load pinned tags:', e);
    }
    return tags.map((t) => t.name);
  });

  const togglePinTag = (tagName: string) => {
    let updated: string[];
    if (pinnedTags.includes(tagName)) {
      updated = pinnedTags.filter((t) => t !== tagName);
    } else {
      updated = [...pinnedTags, tagName];
    }
    setPinnedTags(updated);
    localStorage.setItem(PINNED_TAGS_KEY, JSON.stringify(updated));
  };

  const toggleFolderPathExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedFolderPaths.includes(path)) {
      setExpandedFolderPaths(expandedFolderPaths.filter((p) => p !== path));
    } else {
      setExpandedFolderPaths([...expandedFolderPaths, path]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPopoverRef.current && !tagPopoverRef.current.contains(e.target as Node)) {
        setIsPinTagPopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateFolderPrompt = (parentPath = '') => {
    const promptMsg = parentPath
      ? `Masukkan nama Subfolder di dalam '${parentPath}':`
      : 'Masukkan nama Folder baru:';
    const name = window.prompt(promptMsg);
    if (name && name.trim()) {
      const fullPath = parentPath ? `${parentPath}/${name.trim()}` : name.trim();
      if (onAddFolder) onAddFolder(fullPath);
      onSubjectChange(fullPath);
      if (parentPath && !expandedFolderPaths.includes(parentPath)) {
        setExpandedFolderPaths([...expandedFolderPaths, parentPath]);
      }
    }
  };

  // Build Hierarchical Subfolder Tree from slash-separated paths (e.g. A/e)
  const folderTree = React.useMemo(() => {
    const root = new Map<string, FolderNode>();

    // Process all active notes to group into folder tree
    notes.filter((n) => !n.isTrash).forEach((note) => {
      const pathParts = (note.subject || 'Umum').split('/').map((p) => p.trim()).filter(Boolean);
      let currentMap = root;
      let accumulatedPath = '';

      pathParts.forEach((part, index) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        if (!currentMap.has(part)) {
          currentMap.set(part, {
            name: part,
            fullPath: accumulatedPath,
            count: 0,
            children: new Map(),
            documents: [],
          });
        }
        const node = currentMap.get(part)!;
        node.count++;
        if (index === pathParts.length - 1) {
          node.documents.push(note);
        }
        currentMap = node.children;
      });
    });

    // Also include empty subjects from subjects prop
    subjects.forEach(({ name }) => {
      const pathParts = name.split('/').map((p) => p.trim()).filter(Boolean);
      let currentMap = root;
      let accumulatedPath = '';

      pathParts.forEach((part) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        if (!currentMap.has(part)) {
          currentMap.set(part, {
            name: part,
            fullPath: accumulatedPath,
            count: 0,
            children: new Map(),
            documents: [],
          });
        }
        const node = currentMap.get(part)!;
        currentMap = node.children;
      });
    });

    return root;
  }, [notes, subjects]);

  // Recursive Tree Component Renderer
  const renderFolderNode = (node: FolderNode, depth = 0) => {
    const isExpanded = expandedFolderPaths.includes(node.fullPath);
    const hasChildren = node.children.size > 0 || node.documents.length > 0;
    const isSelected = selectedSubject?.toLowerCase() === node.fullPath.toLowerCase();

    return (
      <div key={node.fullPath} className="space-y-0.5">
        <div
          onClick={() => {
            onFilterChange('all');
            onSubjectChange(isSelected ? null : node.fullPath);
            onTagChange(null);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group/item ${
            isSelected
              ? 'bg-[#252528] text-white font-semibold'
              : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <button
              onClick={(e) => toggleFolderPathExpand(node.fullPath, e)}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 rounded"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                )
              ) : (
                <span className="w-3 inline-block" />
              )}
            </button>
            <FolderIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate max-w-[110px]">{node.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFolderPrompt(node.fullPath);
              }}
              className="p-0.5 text-zinc-500 hover:text-white rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
              title={`Tambah Subfolder di '${node.name}'`}
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-xs text-zinc-500 font-normal">{node.count}</span>
          </div>
        </div>

        {/* Recursive Subfolder Loop & Nested Documents */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* Render Subfolders first */}
            {Array.from(node.children.values()).map((childNode) =>
              renderFolderNode(childNode, depth + 1)
            )}

            {/* Render Documents in this folder */}
            {node.documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectNote(doc.id)}
                className={`w-full text-left py-1 text-[11px] truncate block transition-colors ${
                  selectedNoteId === doc.id
                    ? 'text-indigo-400 font-bold bg-[#202024]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1d]'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
              >
                {doc.title || 'Catatan Tanpa Judul'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-60 shrink-0 bg-[#141416] border-r border-white/5 p-3 flex flex-col justify-between h-full select-none font-sans overflow-hidden">
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* 1. Craft Top Workspace Header & Sidebar Close Button */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <button className="flex items-center gap-1.5 text-xs font-bold text-white hover:bg-[#202024] px-2 py-1.5 rounded-lg transition-colors">
            <div className="w-4.5 h-4.5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
              ⚡
            </div>
            <span className="tracking-tight text-sm font-extrabold text-white">SeeNote</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202024] transition-colors"
              title="Sembunyikan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. New Document Action Link (Craft Style) */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#202024] rounded-lg transition-colors group"
        >
          <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          <span>New Document</span>
        </button>

        {/* 3. Craft Main Nav Menu */}
        <div className="space-y-0.5 pt-1">
          <button
            onClick={() => {
              onFilterChange('all');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all' && !selectedSubject && !selectedTag
                ? 'bg-[#252528] text-white font-semibold'
                : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-3.5 h-3.5 opacity-80" />
              <span>All Docs</span>
            </div>
            <span className="text-xs text-zinc-500 font-normal">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'recent'
                ? 'bg-[#252528] text-white font-semibold'
                : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terakhir Dibuka</span>
            </div>
          </button>

          <button
            onClick={() => {
              onFilterChange('favorites');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'favorites'
                ? 'bg-[#252528] text-white font-semibold'
                : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Favorit</span>
            </div>
            <span className="text-xs text-zinc-500 font-normal">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'trash'
                ? 'bg-[#252528] text-white font-semibold'
                : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-xs text-zinc-500 font-normal">{trashCount}</span>
          </button>
        </div>

        {/* 4. Folders Section (Subfolder Recursive Loop Tree) */}
        <div className="space-y-0.5 pt-3 group/folders">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-400">Folders</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/folders:opacity-100 transition-opacity">
              <button
                onClick={() => handleCreateFolderPrompt('')}
                className="p-0.5 text-zinc-400 hover:text-white rounded hover:bg-[#202024] transition-colors"
                title="Tambah Root Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsFoldersSectionCollapsed(!isFoldersSectionCollapsed)}
                className="p-0.5 text-zinc-400 hover:text-white rounded hover:bg-[#202024] transition-colors"
                title={isFoldersSectionCollapsed ? 'Buka Folders' : 'Sembunyikan Folders'}
              >
                {isFoldersSectionCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {!isFoldersSectionCollapsed && (
            <div className="space-y-0.5">
              {folderTree.size === 0 ? (
                <p className="px-2 text-[10px] text-zinc-600 italic">Belum ada folder</p>
              ) : (
                Array.from(folderTree.values()).map((rootNode) => renderFolderNode(rootNode, 0))
              )}
            </div>
          )}
        </div>

        {/* 5. Craft-style Tags Section (# tag format + Pinned Tags Popover) */}
        <div className="space-y-0.5 pt-3 group/tags relative">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-400">Tags</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/tags:opacity-100 transition-opacity">
              <button
                onClick={() => setIsPinTagPopoverOpen(!isPinTagPopoverOpen)}
                className="p-0.5 text-zinc-400 hover:text-white rounded hover:bg-[#202024] transition-colors"
                title="Pilih Tag yang di-Pin"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
                className="p-0.5 text-zinc-400 hover:text-white rounded hover:bg-[#202024] transition-colors"
                title={isTagsCollapsed ? 'Buka Tags' : 'Sembunyikan Tags'}
              >
                {isTagsCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Pinned Tags Selection Popover Menu */}
          {isPinTagPopoverOpen && (
            <div
              ref={tagPopoverRef}
              className="absolute left-2 top-8 w-44 bg-[#202024] border border-white/10 rounded-xl shadow-2xl p-2 z-50 space-y-1"
            >
              <p className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                Pilih Tag Pin
              </p>
              {tags.length === 0 ? (
                <p className="text-[10px] text-zinc-500 px-2 py-1">Belum ada tag</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {tags.map(({ name }) => {
                    const isPinned = pinnedTags.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => togglePinTag(name)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-colors ${
                          isPinned ? 'bg-[#2b2b32] text-white font-semibold' : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
                        }`}
                      >
                        <span>#{name}</span>
                        {isPinned && <Check className="w-3 h-3 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!isTagsCollapsed && (
            <div className="space-y-0.5">
              {tags.filter((t) => pinnedTags.includes(t.name)).length === 0 ? (
                <p className="px-2 text-[10px] text-zinc-600 italic">Pin key tags for quick access</p>
              ) : (
                tags
                  .filter((t) => pinnedTags.includes(t.name))
                  .map(({ name }) => (
                    <button
                      key={name}
                      onClick={() => {
                        onFilterChange('all');
                        onSubjectChange(null);
                        onTagChange(selectedTag === name ? null : name);
                      }}
                      className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                        selectedTag === name
                          ? 'bg-[#252528] text-white font-semibold'
                          : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-zinc-500 font-normal">#</span>
                      <span>{name}</span>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Craft Bottom Left Footer: Clear Icon + Text "Pengaturan" */}
      <div className="pt-2 border-t border-white/5 shrink-0 flex items-center justify-between px-1">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#202024] rounded-lg transition-colors"
          title="Pengaturan"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Pengaturan</span>
        </button>

        <div className="p-1.5 text-indigo-400" title="InstantNotes Local Engine">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
    </aside>
  );
};
