import React from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  BookOpen,
  Tag,
  History,
  Settings,
  Search,
  X,
  ChevronRight,
  PanelLeftClose,
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
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  filteredNotes: Note[];
  onToggleSidebar?: () => void;
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
  searchQuery,
  onSearchQueryChange,
  selectedNoteId,
  onSelectNote,
  filteredNotes,
  onToggleSidebar,
}) => {
  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#111218] border-r border-[#1d1e2a] p-3.5 flex flex-col justify-between h-full select-none font-sans overflow-hidden">
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* 1. Header: Craft-style Brand Title + Sidebar Collapse Toggle */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <NotebookPen className="w-4 h-4" />
            </div>
            <h1 className="font-bold text-sm text-white tracking-tight">
              Instant<span className="text-indigo-400">Notes</span>
            </h1>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1b1c26] transition-colors"
              title="Tutup Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Craft Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari catatan instan..."
            aria-label="Cari catatan"
            className="w-full pl-9 pr-8 py-2 bg-[#171822] border border-[#232536] rounded-xl text-xs font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 p-0.5 text-zinc-400 hover:text-white rounded"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Primary New Note Action Button */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Catatan Baru</span>
        </button>

        {/* 4. Navigation Menu */}
        <div className="space-y-0.5 pt-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
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
                ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs'
                : 'text-zinc-400 hover:bg-[#171822] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Semua Catatan</span>
            </div>
            <span className="text-[11px] font-medium opacity-60 bg-[#1e202e] px-1.5 py-0.5 rounded-md">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'recent'
                ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs'
                : 'text-zinc-400 hover:bg-[#171822] hover:text-zinc-200'
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
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'favorites'
                ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs'
                : 'text-zinc-400 hover:bg-[#171822] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Favorit</span>
            </div>
            <span className="text-[11px] font-medium opacity-60 bg-[#1e202e] px-1.5 py-0.5 rounded-md">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === 'trash'
                ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30 shadow-xs'
                : 'text-zinc-400 hover:bg-[#171822] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-[11px] font-medium opacity-60 bg-[#1e202e] px-1.5 py-0.5 rounded-md">{trashCount}</span>
          </button>
        </div>

        {/* 5. Craft Notes List Tiles inside Sidebar */}
        <div className="space-y-1 pt-2.5 border-t border-[#1d1e2a]">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Daftar Catatan ({filteredNotes.length})
            </p>
          </div>

          {filteredNotes.length === 0 ? (
            <p className="px-2 py-3 text-xs text-zinc-500 italic text-center">Belum ada catatan</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectNote(n.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group border ${
                    selectedNoteId === n.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold border-indigo-500/50 shadow-md shadow-indigo-600/20'
                      : 'bg-[#171822] hover:bg-[#1e2030] text-zinc-300 border-[#232536] hover:border-indigo-500/30'
                  }`}
                >
                  <div className="overflow-hidden pr-2">
                    <p className="truncate font-semibold text-xs leading-tight">
                      {n.title || 'Catatan Tanpa Judul'}
                    </p>
                    <p className={`text-[10px] truncate mt-1 ${selectedNoteId === n.id ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      {n.subject || 'Umum'}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all ${selectedNoteId === n.id ? 'text-white translate-x-0.5' : 'text-zinc-500 opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Filter by Subjects */}
        {subjects.length > 0 && (
          <div className="space-y-1 pt-2.5 border-t border-[#1d1e2a]">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Subjek
            </p>
            {subjects.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  onFilterChange('all');
                  onSubjectChange(selectedSubject === name ? null : name);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedSubject === name
                    ? 'bg-[#212433] text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-zinc-400 hover:bg-[#171822] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{name}</span>
                </div>
                <span className="text-[10px] font-medium opacity-60">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* 7. Filter by Tags */}
        {tags.length > 0 && (
          <div className="space-y-1 pt-2.5 border-t border-[#1d1e2a]">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Tag
            </p>
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
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-[#171822] text-zinc-400 hover:bg-[#1e2030] hover:text-zinc-200 border border-[#232536]'
                  }`}
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  <span>{name}</span>
                  <span className="text-[9px] opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. Craft Bottom Settings Footer */}
      <div className="pt-2.5 border-t border-[#1d1e2a] shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#171822] rounded-xl transition-all border border-transparent hover:border-[#232536]"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span>Pengaturan &amp; Cadangan</span>
        </button>
      </div>
    </aside>
  );
};
