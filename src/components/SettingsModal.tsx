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
import type { SortOption, FontSizeOption, Note } from '../types/note';
import { exportBackupJSON, importBackupJSON } from '../lib/storage/db';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

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

  const isEn = settings.language === 'en';

  const handleExport = async () => {
    const jsonStr = await exportBackupJSON(notes);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SeeNote_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
        setImportStatus(
          isEn
            ? `Successfully imported ${imported.length} notes.`
            : `Berhasil mengimpor ${imported.length} catatan.`
        );
        setErrorMsg(null);
      } catch {
        setErrorMsg(
          isEn
            ? 'Invalid file format. Please choose a valid JSON backup file.'
            : 'Format file tidak valid. Pastikan memilih file JSON cadangan.'
        );
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  const navItems: { id: TabType; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'general', label: isEn ? 'General' : 'Umum', Icon: Settings },
    { id: 'appearance', label: isEn ? 'Appearance' : 'Tampilan', Icon: Palette },
    { id: 'language', label: isEn ? 'Language' : 'Bahasa', Icon: Globe },
    { id: 'archive', label: isEn ? 'History & Reset' : 'Riwayat & Reset', Icon: Archive },
    { id: 'storage', label: isEn ? 'Backup & Storage' : 'Cadangan & Data', Icon: HardDrive },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md select-none font-sans"
      style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Modal Sidebar */}
        <div className="w-full md:w-56 bg-white/[0.04] p-3 border-b md:border-b-0 md:border-r q-border flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-bold q-text-primary tracking-tight flex items-center gap-2">
                <Settings className="w-4 h-4 q-text-muted" />
                <span>{isEn ? 'Settings' : 'Pengaturan'}</span>
              </span>
              <button
                onClick={onClose}
                className="md:hidden p-1 q-text-muted hover:q-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navItems.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'liquid-lens-active q-text-primary'
                      : 'q-text-secondary hover:bg-white/[0.06] hover:q-text-primary border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'q-text-muted'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t q-border px-2 text-[10px] q-text-muted flex items-center justify-between font-mono">
            <span>SeeNote v1.0</span>
            <ShieldCheck className="w-3.5 h-3.5 q-text-muted" />
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 bg-transparent p-6 flex flex-col justify-between overflow-y-auto relative">
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
            aria-label={isEn ? 'Close' : 'Tutup'}
          >
            <X className="w-5 h-5" />
          </button>

          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'General' : 'Umum'}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-2 border-b q-border">
                  <div>
                    <p className="text-xs font-semibold q-text-primary">
                      {isEn ? 'Theme Mode' : 'Tema Aplikasi'}
                    </p>
                    <p className="text-[11px] q-text-muted">
                      {isEn ? 'Switch between dark, light, or system' : 'Pilih mode gelap, terang, atau ikut sistem'}
                    </p>
                  </div>
                  <LiquidSegmentedControl
                    size="xs"
                    value={settings.theme}
                    onChange={(theme) => onUpdateSettings({ ...settings, theme })}
                    options={[
                      { value: 'dark', icon: <Moon className="w-3 h-3" />, label: isEn ? 'Dark' : 'Gelap' },
                      { value: 'light', icon: <Sun className="w-3 h-3" />, label: isEn ? 'Light' : 'Terang' },
                      { value: 'system', icon: <Monitor className="w-3 h-3" />, label: isEn ? 'Auto' : 'Sistem' },
                    ]}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b q-border">
                  <div>
                    <p className="text-xs font-semibold q-text-primary">
                      {isEn ? 'Text Size' : 'Ukuran Teks'}
                    </p>
                    <p className="text-[11px] q-text-muted">
                      {isEn ? 'Adjust reading and editor text scale' : 'Sesuaikan ukuran teks pada editor'}
                    </p>
                  </div>
                  <LiquidSegmentedControl
                    size="xs"
                    value={settings.fontSize}
                    onChange={(fontSize) => onUpdateSettings({ ...settings, fontSize })}
                    options={[
                      { value: 'sm', label: isEn ? 'Small' : 'Kecil' },
                      { value: 'base', label: isEn ? 'Default' : 'Sedang' },
                      { value: 'lg', label: isEn ? 'Large' : 'Besar' },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'Appearance' : 'Tampilan'}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: 'dark', label: isEn ? 'Dark Mode' : 'Mode Gelap', Icon: Moon },
                    { id: 'light', label: isEn ? 'Light Mode' : 'Mode Terang', Icon: Sun },
                    { id: 'system', label: isEn ? 'System' : 'Sistem OS', Icon: Monitor },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = settings.theme === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onUpdateSettings({ ...settings, theme: id })}
                      className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                        active
                          ? 'liquid-lens-active q-text-primary font-semibold'
                          : 'bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.09] q-text-secondary hover:q-text-primary'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto ${active ? 'text-white' : 'q-text-muted'}`} />
                      <p className="text-xs font-semibold">{label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Language */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'Language' : 'Bahasa'}
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'id' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                    settings.language === 'id'
                      ? 'liquid-lens-active q-text-primary'
                      : 'bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.09] q-text-secondary hover:q-text-primary'
                  }`}
                >
                  <span>Bahasa Indonesia</span>
                  {settings.language === 'id' && <Check className="w-4 h-4 text-white" />}
                </button>

                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
                    settings.language === 'en'
                      ? 'liquid-lens-active q-text-primary'
                      : 'bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.09] q-text-secondary hover:q-text-primary'
                  }`}
                >
                  <span>English (US)</span>
                  {settings.language === 'en' && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Archive & History */}
          {activeTab === 'archive' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'History & Reset' : 'Riwayat & Reset'}
              </h3>

              <div className="space-y-3">
                <button
                  onClick={onClearSearchHistory}
                  className="w-full py-2.5 px-4 glass-control q-text-primary text-xs font-semibold rounded-xl text-left flex items-center justify-between"
                >
                  <span>{isEn ? 'Clear Search Query' : 'Hapus Riwayat Pencarian'}</span>
                  <RotateCcw className="w-4 h-4 q-text-muted" />
                </button>

                <button
                  onClick={onResetSettings}
                  className="w-full py-2.5 px-4 bg-rose-500/12 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between border border-rose-400/25"
                >
                  <span>{isEn ? 'Reset All Preferences to Default' : 'Reset Semua Pengaturan ke Default'}</span>
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Storage & Backup */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'Backup & Storage' : 'Cadangan & Penyimpanan'}
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-2">
                  <div className="flex items-center gap-2 q-text-primary font-semibold text-xs">
                    <Download className="w-4 h-4 q-text-muted" />
                    <span>
                      {isEn ? `Export JSON Backup (${notes.length} Notes)` : `Ekspor Cadangan JSON (${notes.length} Catatan)`}
                    </span>
                  </div>
                  <p className="text-[11px] q-text-muted leading-relaxed">
                    {isEn
                      ? 'Download all your local notes to your device as a JSON file.'
                      : 'Unduh seluruh data catatan lokal ke perangkat Anda dalam format JSON.'}
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full mt-2 py-2 px-4 glass-btn-primary font-semibold text-xs rounded-full"
                  >
                    {isEn ? 'Download Backup JSON' : 'Unduh Backup JSON'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-2">
                  <div className="flex items-center gap-2 q-text-primary font-semibold text-xs">
                    <Upload className="w-4 h-4 q-text-muted" />
                    <span>{isEn ? 'Import Backup' : 'Impor Data Catatan'}</span>
                  </div>
                  <label className="block w-full text-center py-2 px-4 glass-control q-text-primary font-semibold text-xs rounded-full cursor-pointer">
                    <span>{isEn ? 'Choose JSON Backup File' : 'Pilih Berkas Backup JSON'}</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs text-white font-semibold">{importStatus}</p>
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
