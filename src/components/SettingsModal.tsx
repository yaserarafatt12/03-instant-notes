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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/75 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[460px]">
        {/* Left Modal Sidebar */}
        <div className="w-full md:w-56 bg-[#071123]/65 p-3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" />
                <span>Pengaturan</span>
              </span>
              <button
                onClick={onClose}
                className="md:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'general'
                  ? 'liquid-lens-active text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Umum</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'appearance'
                  ? 'liquid-lens-active text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Personalisasi</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'language'
                  ? 'liquid-lens-active text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Bahasa</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'archive'
                  ? 'liquid-lens-active text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip &amp; Riwayat</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'liquid-lens-active text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Penyimpanan</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 px-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>SeeNote v1.0</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 bg-transparent p-6 flex flex-col justify-between overflow-y-auto relative">
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TAB 1: General (Umum) */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Umum</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <p className="text-xs font-bold text-white">Penampilan Tema</p>
                    <p className="text-[11px] text-slate-400">Pilih tema gelap atau terang</p>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) => onUpdateSettings({ ...settings, theme: e.target.value as any })}
                    className="glass-input text-xs font-semibold text-white py-1.5 px-3 rounded-xl focus:outline-none"
                  >
                    <option value="dark" className="bg-[#0B172E]">Gelap (Dark)</option>
                    <option value="light" className="bg-[#0B172E]">Terang (Light)</option>
                    <option value="system" className="bg-[#0B172E]">Sistem</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <div>
                    <p className="text-xs font-bold text-white">Ukuran Font Teks</p>
                    <p className="text-[11px] text-slate-400">Ukuran font tampilan editor</p>
                  </div>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ ...settings, fontSize: e.target.value as FontSizeOption })}
                    className="glass-input text-xs font-semibold text-white py-1.5 px-3 rounded-xl focus:outline-none"
                  >
                    <option value="sm" className="bg-[#0B172E]">Kecil (14px)</option>
                    <option value="base" className="bg-[#0B172E]">Sedang (16px)</option>
                    <option value="lg" className="bg-[#0B172E]">Besar (18px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance (Personalisasi) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Personalisasi</h3>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'liquid-lens-active text-white font-bold'
                      : 'bg-[#071123]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Moon className="w-6 h-6 mx-auto text-sky-300" />
                  <p className="text-xs font-semibold">Mode Gelap</p>
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                    settings.theme === 'light'
                      ? 'liquid-lens-active text-white font-bold'
                      : 'bg-[#071123]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Sun className="w-6 h-6 mx-auto text-amber-400" />
                  <p className="text-xs font-semibold">Mode Terang</p>
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'system' })}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                    settings.theme === 'system'
                      ? 'liquid-lens-active text-white font-bold'
                      : 'bg-[#071123]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
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
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Bahasa (Language)</h3>

              <div className="space-y-2">
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'id' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    settings.language === 'id'
                      ? 'liquid-lens-active text-white'
                      : 'bg-[#071123]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>🇮🇩 Bahasa Indonesia (Deteksi Otomatis)</span>
                  {settings.language === 'id' && <Check className="w-4 h-4 text-sky-200" />}
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    settings.language === 'en'
                      ? 'liquid-lens-active text-white'
                      : 'bg-[#071123]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>🇺🇸 English (US)</span>
                  {settings.language === 'en' && <Check className="w-4 h-4 text-sky-200" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Archive & History (Arsip & Riwayat) */}
          {activeTab === 'archive' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Arsip &amp; Riwayat</h3>

              <div className="space-y-3">
                <button
                  onClick={onClearSearchHistory}
                  className="w-full py-2.5 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between"
                >
                  <span>Hapus Riwayat Pencarian</span>
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={onResetSettings}
                  className="w-full py-2.5 px-4 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between border border-rose-400/30"
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
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Penyimpanan &amp; Cadangan Data</h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#071123]/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Ekspor Berkas JSON ({notes.length} Catatan)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unduh seluruh data catatan lokal ke komputer lo.
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full mt-2 py-2 px-4 glass-btn-primary text-white font-bold text-xs rounded-full transition-all"
                  >
                    Unduh Backup JSON
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#071123]/70 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Impor Data Catatan</span>
                  </div>
                  <label className="block w-full text-center py-2 px-4 bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-semibold text-xs rounded-full transition-all cursor-pointer">
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
