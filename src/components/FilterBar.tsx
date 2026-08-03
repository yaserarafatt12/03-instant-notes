import React from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  Folder,
  Tag,
  History,
  Settings,
  PanelLeftClose,
  ChevronDown,
  NotebookPen,
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
}) => {
  return (
    <aside className="w-full lg:w-64 shrink-0 bg-[#18181c] border-r border-[#2b2b32] p-3.5 flex flex-col justify-between h-full select-none font-sans overflow-hidden">
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* 1. Header: Workspace Selector & Sidebar Toggle */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <button className="flex items-center gap-2 text-xs font-bold text-white hover:bg-[#25252a] px-2 py-1.5 rounded-xl transition-colors">
            <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <NotebookPen className="w-3.5 h-3.5" />
            </div>
            <span>Personal Space</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-[#25252a] transition-colors"
              title="Sembunyikan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. New Document Action Button */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Catatan Baru</span>
        </button>

        {/* 3. Main Nav Menu */}
        <div className="space-y-0.5 pt-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Navigasi
          </p>

          <button
            onClick={() => {
              onFilterChange('all');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'all' && !selectedSubject && !selectedTag
                ? 'bg-[#282830] text-white font-bold border border-white/10 shadow-xs'
                : 'text-zinc-300 hover:bg-[#232328] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Semua Catatan</span>
            </div>
            <span className="text-[11px] font-semibold opacity-70 bg-[#2b2b34] px-2 py-0.5 rounded-md">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'recent'
                ? 'bg-[#282830] text-white font-bold border border-white/10 shadow-xs'
                : 'text-zinc-300 hover:bg-[#232328] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Terakhir Dibuka</span>
            </div>
          </button>

          <button
            onClick={() => {
              onFilterChange('favorites');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'favorites'
                ? 'bg-[#282830] text-white font-bold border border-white/10 shadow-xs'
                : 'text-zinc-300 hover:bg-[#232328] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>Favorit</span>
            </div>
            <span className="text-[11px] font-semibold opacity-70 bg-[#2b2b34] px-2 py-0.5 rounded-md">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'trash'
                ? 'bg-[#282830] text-white font-bold border border-white/10 shadow-xs'
                : 'text-zinc-300 hover:bg-[#232328] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-[11px] font-semibold opacity-70 bg-[#2b2b34] px-2 py-0.5 rounded-md">{trashCount}</span>
          </button>
        </div>

        {/* 4. Folders Section (Replaces "Subjek") */}
        <div className="space-y-1 pt-3">
          <p className="px-2 text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Folders</span>
          </p>
          {subjects.length === 0 ? (
            <p className="px-2 text-[10px] text-zinc-500 italic">Belum ada folder</p>
          ) : (
            subjects.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  onFilterChange('all');
                  onSubjectChange(selectedSubject === name ? null : name);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedSubject === name
                    ? 'bg-[#282830] text-white font-bold border border-white/10'
                    : 'text-zinc-300 hover:bg-[#232328] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{name}</span>
                </div>
                <span className="text-[10px] font-semibold opacity-60">({count})</span>
              </button>
            ))
          )}
        </div>

        {/* 5. Tags Section */}
        <div className="space-y-1 pt-3">
          <p className="px-2 text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tags</span>
          </p>
          {tags.length === 0 ? (
            <p className="px-2 text-[10px] text-zinc-500 italic">Belum ada tag</p>
          ) : (
            <div className="flex flex-wrap gap-1 px-1">
              {tags.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => {
                    onFilterChange('all');
                    onTagChange(selectedTag === name ? null : name);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedTag === name
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-[#232328] text-zinc-300 hover:bg-[#2c2c34] hover:text-white border border-white/5'
                  }`}
                >
                  <span>#{name}</span>
                  <span className="text-[9px] opacity-60">({count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Clean Bottom Sidebar Footer (Icon Settings + Tulisan "Pengaturan") */}
      <div className="pt-3 border-t border-[#2b2b32] shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-200 hover:text-white hover:bg-[#232328] rounded-xl transition-all border border-transparent hover:border-white/10"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Settings className="w-4 h-4" />
          </div>
          <span>Pengaturan</span>
        </button>
      </div>
    </aside>
  );
};
