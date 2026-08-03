import React from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  BookOpen,
  Tag,
  Download,
  Upload,
  Moon,
  Sun,
  History,
  Settings,
  PanelLeftClose,
  NotebookPen,
} from 'lucide-react';
import type { FilterCategory } from '../types/note';

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
  onExport: () => void;
  onImport: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
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
  onExport,
  onImport,
  isDarkMode,
  onToggleDarkMode,
  onOpenSettings,
  onToggleSidebar,
}) => {
  return (
    <aside className="w-full lg:w-60 shrink-0 bg-white dark:bg-zinc-900/90 border-r border-zinc-200 dark:border-zinc-800/60 p-3.5 flex flex-col justify-between h-full select-none font-sans">
      <div className="space-y-5 overflow-y-auto">
        {/* Brand Logo & Controls Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <NotebookPen className="w-4 h-4" />
            </div>
            <h1 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
              Instant<span className="text-indigo-500 font-bold">Notes</span>
            </h1>
          </div>

          <div className="flex items-center gap-0.5">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Tutup Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Note Action */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-between py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold text-xs rounded-lg transition-all shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catatan Baru</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono bg-indigo-700/60 px-1.5 py-0.5 rounded">Ctrl+N</span>
        </button>

        {/* Navigation Categories */}
        <div className="space-y-0.5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            Navigasi
          </p>

          <button
            onClick={() => {
              onFilterChange('all');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all' && !selectedSubject && !selectedTag
                ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Semua Catatan</span>
            </div>
            <span className="text-[11px] font-medium opacity-70">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'recent'
                ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-emerald-500" />
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
                ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Favorit</span>
            </div>
            <span className="text-[11px] font-medium opacity-70">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'trash'
                ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-[11px] font-medium opacity-70">{trashCount}</span>
          </button>
        </div>

        {/* Filter by Subjects */}
        {subjects.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
              Subjek
            </p>
            {subjects.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  onFilterChange('all');
                  onSubjectChange(selectedSubject === name ? null : name);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedSubject === name
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[110px]">{name}</span>
                </div>
                <span className="text-[10px] font-medium opacity-60">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filter by Tags */}
        {tags.length > 0 && (
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
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
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200/60 dark:border-zinc-700/40'
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

      {/* Footer Backup / Import Actions */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            title="Ekspor Data Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor</span>
          </button>
          <button
            onClick={onImport}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            title="Impor Data Backup"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
