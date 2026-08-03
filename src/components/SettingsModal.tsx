import React from 'react';
import { X, Moon, Sun, Monitor, Type, ArrowUpDown, Keyboard, RotateCcw, Info, ShieldCheck, Download } from 'lucide-react';
import type { SortOption, FontSizeOption } from '../types/note';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: FontSizeOption;
  defaultSort: SortOption;
  keyboardShortcuts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
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
  onOpenBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearSearchHistory,
  onResetSettings,
  onOpenBackup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none font-sans">
      <div className="w-full max-w-lg bg-[#13141b] border border-[#212433] rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#212433]">
          <h2 className="text-base font-bold text-white">
            Pengaturan &amp; Cadangan Data
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backup & Restore Action Banner */}
        {onOpenBackup && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-white">Cadangkan &amp; Pulihkan Catatan</p>
                <p className="text-[10px] text-zinc-400">Ekspor/Impor berkas JSON cadangan lokal</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-xs shrink-0"
            >
              Buka Backup
            </button>
          </div>
        )}

        {/* 1. Theme Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Sun className="w-4 h-4 text-indigo-400" />
            <span>Tema Tampilan</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSettings({ ...settings, theme: t })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                  settings.theme === t
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-[#1b1d28] border-[#272938] text-zinc-400 hover:bg-[#252838]'
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

        {/* 2. Font Size */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" />
            <span>Ukuran Font Teks</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['sm', 'base', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  settings.fontSize === size
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-[#1b1d28] border-[#272938] text-zinc-400 hover:bg-[#252838]'
                }`}
              >
                {size === 'sm' ? 'Kecil (14px)' : size === 'base' ? 'Sedang (16px)' : 'Besar (18px)'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Default Sort */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
            <span>Urutan Catatan Default</span>
          </label>
          <select
            value={settings.defaultSort}
            onChange={(e) => onUpdateSettings({ ...settings, defaultSort: e.target.value as SortOption })}
            className="w-full py-2 px-3 bg-[#1b1d28] border border-[#272938] rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="updated">Terakhir Diubah</option>
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="a-z">Judul (A-Z)</option>
            <option value="z-a">Judul (Z-A)</option>
          </select>
        </div>

        {/* 4. Keyboard Shortcuts Toggle */}
        <div className="flex items-center justify-between py-2 border-y border-[#212433]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-zinc-200">Pintasan Keyboard</p>
              <p className="text-[10px] text-zinc-500">Ctrl+N, Ctrl+K, Alt+F, Esc</p>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, keyboardShortcuts: !settings.keyboardShortcuts })}
            className={`w-10 h-6 rounded-full p-1 transition-colors ${
              settings.keyboardShortcuts ? 'bg-indigo-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.keyboardShortcuts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. Reset & Clear History */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearSearchHistory}
            className="flex-1 py-2 px-3 bg-[#1b1d28] hover:bg-[#252838] text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Hapus Riwayat Cari
          </button>
          <button
            onClick={onResetSettings}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-[#1b1d28] hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferensi</span>
          </button>
        </div>

        {/* About App */}
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 select-text">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Info className="w-4 h-4" />
            <span>InstantNotes v1.0</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Personal Knowledge Base. Local-First &amp; Offline.
          </p>
          <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privasi: Local Only</span>
            </div>
            <a
              href="https://github.com/yaserarafatt12/03-instant-notes"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:underline font-bold"
            >
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
