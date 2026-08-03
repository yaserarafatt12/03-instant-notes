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
}) => {
  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#13141b] border-r border-[#1f212c] p-3 flex flex-col justify-between h-full select-none font-sans overflow-hidden">
      <div className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* 1. Search Bar at the VERY TOP */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Cari catatan..."
            aria-label="Cari catatan"
            className="w-full pl-9 pr-8 py-2 bg-[#1b1d28] border border-[#272938] rounded-xl text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 p-0.5 text-zinc-400 hover:text-zinc-200 rounded"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Single "+ Catatan Baru" Button */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Catatan Baru</span>
        </button>

        {/* 3. Main Navigation Categories */}
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
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeFilter === 'all' && !selectedSubject && !selectedTag
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/20'
                : 'text-zinc-400 hover:bg-[#1b1d28] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Semua Catatan</span>
            </div>
            <span className="text-[11px] font-medium opacity-60">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeFilter === 'recent'
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/20'
                : 'text-zinc-400 hover:bg-[#1b1d28] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
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
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeFilter === 'favorites'
                ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/20'
                : 'text-zinc-400 hover:bg-[#1b1d28] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Favorit</span>
            </div>
            <span className="text-[11px] font-medium opacity-60">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeFilter === 'trash'
                ? 'bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/20'
                : 'text-zinc-400 hover:bg-[#1b1d28] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-[11px] font-medium opacity-60">{trashCount}</span>
          </button>
        </div>

        {/* 4. Notes List directly inside Sidebar */}
        <div className="space-y-1 pt-2 border-t border-[#1f212c]">
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Daftar Catatan ({filteredNotes.length})
            </p>
          </div>

          {filteredNotes.length === 0 ? (
            <p className="px-2 py-2 text-xs text-zinc-500 italic">Tidak ada catatan</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectNote(n.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between group ${
                    selectedNoteId === n.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-zinc-300 hover:bg-[#1b1d28] hover:text-white'
                  }`}
                >
                  <div className="overflow-hidden pr-1">
                    <p className="truncate font-semibold text-xs leading-tight">
                      {n.title || 'Catatan Tanpa Judul'}
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 ${selectedNoteId === n.id ? 'text-indigo-200' : 'text-zinc-500'}`}>
                      {n.subject || 'Umum'}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${selectedNoteId === n.id ? 'opacity-100 text-white' : 'text-zinc-400'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Filter by Subjects */}
        {subjects.length > 0 && (
          <div className="space-y-0.5 pt-2 border-t border-[#1f212c]">
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  selectedSubject === name
                    ? 'bg-[#212433] text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-zinc-400 hover:bg-[#1b1d28] hover:text-zinc-200'
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

        {/* 6. Filter by Tags */}
        {tags.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-[#1f212c]">
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
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    selectedTag === name
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-[#1b1d28] text-zinc-400 hover:bg-[#252838] hover:text-zinc-200 border border-[#272938]'
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

      {/* 7. Settings at Bottom Footer */}
      <div className="pt-2 border-t border-[#1f212c] shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#1b1d28] rounded-xl transition-all"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span>Pengaturan &amp; Cadangan</span>
        </button>
      </div>
    </aside>
  );
};
