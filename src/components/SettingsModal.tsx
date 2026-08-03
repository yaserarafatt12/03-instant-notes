import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Settings,
  Palette,
  Globe,
  Archive,
  HardDrive,
  RotateCcw,
  Download,
  Upload,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { SortOption, FontSizeOption } from '../types/note';
import type { Note } from '../types/note';
import { exportBackupJSON, importBackupJSON } from '../lib/storage/db';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: FontSizeOption;
  defaultSort: SortOption;
  keyboardShortcuts: boolean;
  language: 'id' | 'en';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 'base',
  defaultSort: 'updated',
  keyboardShortcuts: true,
  language: 'id',
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearSearchHistory: () => void;
  onResetSettings: () => void;
  notes?: Note[];
  onNotesImported?: (notes: Note[]) => void;
}

type TabType = 'general' | 'appearance' | 'language' | 'archive' | 'storage';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearSearchHistory,
  onResetSettings,
  notes = [],
  onNotesImported = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    const jsonStr = await exportBackupJSON(notes);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InstantNotes_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const imported = await importBackupJSON(content);
        onNotesImported(imported);
        setImportStatus(`Berhasil mengimpor ${imported.length} catatan!`);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg('Format file tidak valid. Pastikan memilih file JSON cadangan.');
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-2xl bg-[#1d1d21] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[460px]">
        {/* Left Modal Sidebar (ChatGPT Style) */}
        <div className="w-full md:w-56 bg-[#17171a] p-3 border-r border-white/5 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Pengaturan</span>
              </span>
              <button
                onClick={onClose}
                className="md:hidden p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'general'
                  ? 'bg-[#29292e] text-white'
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Umum</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'appearance'
                  ? 'bg-[#29292e] text-white'
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Personalisasi</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'language'
                  ? 'bg-[#29292e] text-white'
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Bahasa</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'archive'
                  ? 'bg-[#29292e] text-white'
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip &amp; Riwayat</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-[#29292e] text-white'
                  : 'text-zinc-400 hover:bg-[#202024] hover:text-zinc-200'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Penyimpanan</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 px-2 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
            <span>SeeNote v1.0</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 bg-[#1d1d21] p-6 flex flex-col justify-between overflow-y-auto relative">
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#28282e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TAB 1: General (Umum) */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Umum</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Penampilan Tema</p>
                    <p className="text-[11px] text-zinc-400">Pilih tema gelap atau terang</p>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) => onUpdateSettings({ ...settings, theme: e.target.value as any })}
                    className="bg-[#28282e] border border-white/10 text-xs font-semibold text-white py-1.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="dark">Gelap (Dark)</option>
                    <option value="light">Terang (Light)</option>
                    <option value="system">Sistem</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Ukuran Font Teks</p>
                    <p className="text-[11px] text-zinc-400">Ukuran font tampilan editor</p>
                  </div>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: e.target.value as FontSizeOption })}
                    className="bg-[#28282e] border border-white/10 text-xs font-semibold text-white py-1.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sm">Kecil (14px)</option>
                    <option value="base">Sedang (16px)</option>
                    <option value="lg">Besar (18px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance (Personalisasi) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Personalisasi</h3>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-[#25252a] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-6 h-6 mx-auto text-indigo-400" />
                  <p className="text-xs font-semibold">Mode Gelap</p>
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
                    settings.theme === 'light'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-[#25252a] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-6 h-6 mx-auto text-amber-400" />
                  <p className="text-xs font-semibold">Mode Terang</p>
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'system' })}
                  className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
                    settings.theme === 'system'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-[#25252a] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-6 h-6 mx-auto text-emerald-400" />
                  <p className="text-xs font-semibold">Sistem OS</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Language (Bahasa) */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Bahasa (Language)</h3>

              <div className="space-y-2">
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'id' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.language === 'id'
                      ? 'bg-[#292930] border-indigo-500 text-white'
                      : 'bg-[#232328] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🇮🇩 Bahasa Indonesia (Deteksi Otomatis)</span>
                  {settings.language === 'id' && <Check className="w-4 h-4 text-indigo-400" />}
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.language === 'en'
                      ? 'bg-[#292930] border-indigo-500 text-white'
                      : 'bg-[#232328] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🇺🇸 English (US)</span>
                  {settings.language === 'en' && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Archive & History (Arsip & Riwayat) */}
          {activeTab === 'archive' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Arsip &amp; Riwayat</h3>

              <div className="space-y-3">
                <button
                  onClick={onClearSearchHistory}
                  className="w-full py-2.5 px-4 bg-[#28282e] hover:bg-[#32323a] text-zinc-200 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between"
                >
                  <span>Hapus Riwayat Pencarian</span>
                  <RotateCcw className="w-4 h-4 text-zinc-400" />
                </button>

                <button
                  onClick={onResetSettings}
                  className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between border border-rose-500/20"
                >
                  <span>Reset Semua Preferensi ke Default</span>
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Storage & Backup (Penyimpanan) */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Penyimpanan &amp; Cadangan Data</h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#232328] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Ekspor Berkas JSON ({notes.length} Catatan)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Unduh seluruh data catatan lokal ke komputer lo.
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Unduh Backup JSON
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#232328] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Impor Data Catatan</span>
                  </div>
                  <label className="block w-full text-center py-2 px-4 bg-[#2d2d34] hover:bg-[#383842] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer">
                    <span>Pilih Berkas Backup JSON</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs text-emerald-400 font-semibold">{importStatus}</p>
                )}
                {errorMsg && (
                  <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
