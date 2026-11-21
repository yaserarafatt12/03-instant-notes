import React from 'react';
import { Search, SlidersHorizontal, Type, X } from 'lucide-react';
import type { SortOption, FontSizeOption } from '../types/note';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  resultCount: number;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  fontSize: FontSizeOption;
  onFontSizeChange: (size: FontSizeOption) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  resultCount,
  sortOption,
  onSortChange,
  fontSize,
  onFontSizeChange,
}) => {
  return (
    <div className="space-y-2.5 font-sans">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 q-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari catatan... (Ctrl+K)"
          aria-label="Cari catatan"
          className="w-full pl-9 pr-9 py-1.5 glass-input rounded-full text-xs font-medium q-text-primary placeholder:text-slate-400 focus:outline-none transition-all"
        />
        {query ? (
          <button
            onClick={() => onQueryChange('')}
            aria-label="Hapus kata kunci pencarian"
            className="absolute right-2.5 p-0.5 q-text-muted hover:q-text-primary rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono q-text-muted glass-control rounded">
            Ctrl+K
          </kbd>
        )}
      </div>

      {/* Control Strip: Result Counter, Sort Selector, Font Selector */}
      <div className="flex items-center justify-between text-xs q-text-muted">
        <span className="font-medium text-[11px] q-text-muted">
          {resultCount} Catatan
        </span>

        <div className="flex items-center gap-2">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 q-text-muted" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Urutkan catatan"
              className="bg-transparent text-[11px] font-medium q-text-secondary focus:outline-none cursor-pointer"
            >
              <option value="updated">Terakhir Diubah</option>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="a-z">Judul A-Z</option>
              <option value="z-a">Judul Z-A</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 border-l q-border pl-2">
            <Type className="w-3 h-3 q-text-muted" />
            <select
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value as FontSizeOption)}
              aria-label="Pilih ukuran font"
              className="bg-transparent text-[11px] font-medium q-text-secondary focus:outline-none cursor-pointer"
            >
              <option value="sm">Kecil</option>
              <option value="base">Sedang</option>
              <option value="lg">Besar</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
