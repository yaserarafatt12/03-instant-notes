import React, { useEffect, useRef } from 'react';
import { Search, X, Command, ArrowUpDown, Type } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-2 w-full select-none">
      {/* Main Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari catatan instan... ('/' atau 'Ctrl+K')"
          className="w-full pl-10 pr-24 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
        />
        {query ? (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300/50 dark:border-slate-700">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Controls Bar: Sort, Font Size, and Counter */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-amber-500" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="updated">Terakhir Diubah</option>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="a-z">Judul (A-Z)</option>
              <option value="z-a">Judul (Z-A)</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <Type className="w-3 h-3 text-slate-400" />
            <select
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value as FontSizeOption)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="sm">Kecil</option>
              <option value="base">Sedang</option>
              <option value="lg">Besar</option>
            </select>
          </div>
        </div>

        <span className="font-mono text-[10px] text-slate-400">
          {resultCount} Catatan
        </span>
      </div>
    </div>
  );
};
