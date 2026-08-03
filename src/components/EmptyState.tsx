import React from 'react';
import { FileText, SearchX, Trash2, Star, Plus } from 'lucide-react';
import type { FilterCategory } from '../types/note';

interface EmptyStateProps {
  type: FilterCategory | 'search';
  onNewNote?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onNewNote }) => {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 my-6">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Tidak ada hasil pencarian
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          Coba kata kunci lain atau periksa kembali ejaan kata kunci lo.
        </p>
      </div>
    );
  }

  if (type === 'favorites') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 my-6">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Star className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Belum ada catatan favorit
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Klik ikon bintang pada catatan mana saja untuk menyimpannya di sini.
        </p>
      </div>
    );
  }

  if (type === 'trash') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 my-6">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Trash2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Tempat sampah kosong
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Catatan yang dihapus akan muncul di sini sebelum dihapus permanen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 my-6">
      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <FileText className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        Belum ada catatan
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        Mulai tulis ide, rumus, atau snippet kode lo dalam hitungan detik.
      </p>
      {onNewNote && (
        <button
          onClick={onNewNote}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Catatan Pertama</span>
        </button>
      )}
    </div>
  );
};
