import React from 'react';
import { X, Moon, Sun, Monitor, Type, ArrowUpDown, Keyboard, RotateCcw, Info, ShieldCheck } from 'lucide-react';
import type { SortOption, FontSizeOption } from '../types/note';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: FontSizeOption;
  defaultSort: SortOption;
  keyboardShortcuts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'base',
  defaultSort: 'updated',
  keyboardShortcuts: true,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearSearchHistory: () => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearSearchHistory,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Pengaturan &amp; Preferensi (FR-700)
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Preference (FR-701) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Tema Tampilan</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSettings({ ...settings, theme: t })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                  settings.theme === t
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                {t === 'system' && <Monitor className="w-3.5 h-3.5" />}
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Font Size (FR-702) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Type className="w-4 h-4 text-amber-500" />
            <span>Ukuran Font Teks</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['sm', 'base', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  settings.fontSize === size
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {size === 'sm' ? 'Kecil (14px)' : size === 'base' ? 'Sedang (16px)' : 'Besar (18px)'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Default Sort (FR-703) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-amber-500" />
            <span>Urutan Catatan Default</span>
          </label>
          <select
            value={settings.defaultSort}
            onChange={(e) => onUpdateSettings({ ...settings, defaultSort: e.target.value as SortOption })}
            className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="updated">Terakhir Diubah (Recently Edited)</option>
            <option value="newest">Terbaru (Newest)</option>
            <option value="oldest">Terlama (Oldest)</option>
            <option value="a-z">Judul (A-Z)</option>
            <option value="z-a">Judul (Z-A)</option>
          </select>
        </div>

        {/* 4. Keyboard Shortcuts Toggle (FR-705) */}
        <div className="flex items-center justify-between py-2 border-y border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pintasan Keyboard</p>
              <p className="text-[10px] text-slate-400">Ctrl+N, Ctrl+K, Alt+F, Esc</p>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, keyboardShortcuts: !settings.keyboardShortcuts })}
            className={`w-10 h-6 rounded-full p-1 transition-colors ${
              settings.keyboardShortcuts ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.keyboardShortcuts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. Reset & Clear History (FR-704 & FR-706) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearSearchHistory}
            className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Hapus Riwayat Cari
          </button>
          <button
            onClick={onResetSettings}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferensi</span>
          </button>
        </div>

        {/* About App (FR-707) */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 select-text">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Info className="w-4 h-4" />
            <span>Tentang InstantNotes v1.0</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            InstantNotes — The Fastest Personal Note Finder. 100% Local-First &amp; Offline-by-Default.
          </p>
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privasi: Local Only</span>
            </div>
            <a
              href="https://github.com/yaserarafatt12/03-instant-notes"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
