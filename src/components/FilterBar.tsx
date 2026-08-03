import React from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  Folder,
  Tag as TagIcon,
  History,
  Settings,
  PanelLeftClose,
  ChevronDown,
  Sparkles,
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
  onOpenBackup,
}) => {
  return (
    <aside className="w-full lg:w-60 shrink-0 bg-[#141416] border-r border-white/5 p-3 flex flex-col justify-between h-full select-none font-sans overflow-hidden">
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* 1. Craft Top Workspace Header & Sidebar Close Button */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-white hover:bg-[#202024] px-2 py-1.5 rounded-lg transition-colors">
            <div className="w-4 h-4 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
              ⚡
            </div>
            <span>My Space</span>
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

        {/* 4. Folders Section */}
        <div className="space-y-0.5 pt-3">
          <p className="px-2 text-[11px] font-semibold text-zinc-400 mb-1">
            Folders
          </p>
          {subjects.length === 0 ? (
            <p className="px-2 text-[10px] text-zinc-600 italic">Belum ada folder</p>
          ) : (
            subjects.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  onFilterChange('all');
                  onSubjectChange(selectedSubject === name ? null : name);
                  onTagChange(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedSubject === name
                    ? 'bg-[#252528] text-white font-semibold'
                    : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{name}</span>
                </div>
                <span className="text-xs text-zinc-500 font-normal">({count})</span>
              </button>
            ))
          )}
        </div>

        {/* 5. Clean Craft-style Tags Section (# tag format) */}
        <div className="space-y-0.5 pt-3">
          <p className="px-2 text-[11px] font-semibold text-zinc-400 mb-1">
            Tags
          </p>
          {tags.length === 0 ? (
            <p className="px-2 text-[10px] text-zinc-600 italic">Pin key tags for quick access</p>
          ) : (
            <div className="space-y-0.5">
              {tags.map(({ name }) => (
                <button
                  key={name}
                  onClick={() => {
                    onFilterChange('all');
                    onSubjectChange(null);
                    onTagChange(selectedTag === name ? null : name);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    selectedTag === name
                      ? 'bg-[#252528] text-indigo-400 font-bold'
                      : 'text-zinc-400 hover:bg-[#1a1a1d] hover:text-zinc-200'
                  }`}
                >
                  <TagIcon className="w-3 h-3 opacity-60 text-indigo-400" />
                  <span>#{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Craft Bottom Left Footer Icons */}
      <div className="pt-2 border-t border-white/5 shrink-0 flex items-center justify-between px-1 text-zinc-400">
        <button
          onClick={onOpenSettings}
          className="p-1.5 hover:text-white hover:bg-[#202024] rounded-lg transition-colors"
          title="Pengaturan"
        >
          <Settings className="w-4 h-4" />
        </button>

        {onOpenBackup && (
          <button
            onClick={onOpenBackup}
            className="p-1.5 hover:text-white hover:bg-[#202024] rounded-lg transition-colors"
            title="Cadangkan & Pemulihan"
          >
            <Settings className="w-4 h-4 opacity-0 pointer-events-none" />
          </button>
        )}

        <div className="p-1.5 text-indigo-400" title="InstantNotes Local Engine">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
    </aside>
  );
};
