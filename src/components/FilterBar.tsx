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
  Zap,
  Moon,
  Sun,
  History,
  Settings,
  PanelLeftClose,
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
    <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800/80 p-4 flex flex-col justify-between h-full select-none font-sans">
      <div className="space-y-6 overflow-y-auto">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-black shadow-sm">
              <Zap className="w-4.5 h-4.5 fill-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Instant<span className="text-amber-500">Notes</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Tutup Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Note Action */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Note</span>
          <span className="ml-auto text-[10px] opacity-75">Ctrl+N</span>
        </button>

        {/* Navigation Categories */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Navigasi
          </p>

          <button
            onClick={() => {
              onFilterChange('all');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'all' && !selectedSubject && !selectedTag
                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Semua Catatan</span>
            </div>
            <span className="text-xs font-semibold opacity-75">{totalNotes}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('recent');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'recent'
                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-emerald-500" />
              <span>Terakhir Dibuka</span>
            </div>
          </button>

          <button
            onClick={() => {
              onFilterChange('favorites');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'favorites'
                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Favorit</span>
            </div>
            <span className="text-xs font-semibold opacity-75">{favoriteCount}</span>
          </button>

          <button
            onClick={() => {
              onFilterChange('trash');
              onSubjectChange(null);
              onTagChange(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'trash'
                ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4" />
              <span>Tempat Sampah</span>
            </div>
            <span className="text-xs font-semibold opacity-75">{trashCount}</span>
          </button>
        </div>

        {/* Filter by Subjects */}
        {subjects.length > 0 && (
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Subjek / Topik
            </p>
            {subjects.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => {
                  onFilterChange('all');
                  onSubjectChange(selectedSubject === name ? null : name);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedSubject === name
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[120px]">{name}</span>
                </div>
                <span className="text-[11px] font-semibold opacity-75">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filter by Tags */}
        {tags.length > 0 && (
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Tag Catatan
            </p>
            <div className="flex flex-wrap gap-1.5 px-2">
              {tags.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => {
                    onFilterChange('all');
                    onTagChange(selectedTag === name ? null : name);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    selectedTag === name
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Tag className="w-3 h-3 opacity-70" />
                  <span>{name}</span>
                  <span className="text-[9px] opacity-75 font-semibold">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Backup / Import Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2 mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            title="Ekspor Data Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor</span>
          </button>
          <button
            onClick={onImport}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
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

