import React, { useEffect, useState } from 'react';
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
  Info,
  ArrowUpRight,
  Copy,
  Laptop,
  Code2,
} from 'lucide-react';
import type { SortOption, FontSizeOption, Note } from '../types/note';
import { exportBackupJSON, importBackupJSON } from '../lib/storage/db';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { BrandLogo } from './BrandLogo';

const SEENOTE_REPO_URL = 'https://github.com/yaserarafatt12/SeeNotes';
const SEENOTE_DOWNLOAD_URL = 'https://github.com/yaserarafatt12/SeeNotes/releases';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

type TabType = 'general' | 'appearance' | 'language' | 'archive' | 'storage' | 'about';

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
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [installHintVisible, setInstallHintVisible] = useState(false);
  const [copiedAppLink, setCopiedAppLink] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalledPwa(Boolean(isStandalone));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalledPwa(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const isEn = settings.language === 'en';

  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalledPwa(true);
      }
      setDeferredInstallPrompt(null);
    } else {
      setInstallHintVisible(true);
    }
  };

  const handleCopyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedAppLink(true);
      setTimeout(() => setCopiedAppLink(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

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

  const generalNavItems: { id: TabType; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'general', label: isEn ? 'General' : 'Umum', Icon: Settings },
    { id: 'appearance', label: isEn ? 'Appearance' : 'Tampilan', Icon: Palette },
    { id: 'language', label: isEn ? 'Language' : 'Bahasa', Icon: Globe },
  ];

  const dataNavItems: { id: TabType; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'storage', label: isEn ? 'Backup & Storage' : 'Cadangan & Data', Icon: HardDrive },
    { id: 'archive', label: isEn ? 'History & Reset' : 'Riwayat & Reset', Icon: Archive },
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
        <div className="w-full md:w-56 bg-white/[0.03] p-3 border-b md:border-b-0 md:border-r q-border flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 py-1.5">
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

            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider q-text-muted">
                {isEn ? 'General Settings' : 'Pengaturan Umum'}
              </div>
              {generalNavItems.map(({ id, label, Icon }) => {
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

            <div className="space-y-1">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider q-text-muted">
                {isEn ? 'Data & Privacy' : 'Data & Privasi'}
              </div>
              {dataNavItems.map(({ id, label, Icon }) => {
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
          </div>

          <div className="pt-2 mt-3 border-t q-border space-y-1.5">
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'about'
                  ? 'liquid-lens-active q-text-primary'
                  : 'q-text-secondary hover:bg-white/[0.06] hover:q-text-primary border border-transparent'
              }`}
            >
              <Info className={`w-4 h-4 ${activeTab === 'about' ? 'text-white' : 'q-text-muted'}`} />
              <span>{isEn ? 'About & Download' : 'Tentang & Unduh'}</span>
            </button>
            <div className="px-2.5 text-[10px] q-text-muted flex items-center justify-between font-mono">
              <span>SeeNote v1.0</span>
              <ShieldCheck className="w-3.5 h-3.5 q-text-muted" />
            </div>
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

          {/* TAB 6: About & Download */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <h3 className="text-base font-bold q-text-primary tracking-tight border-b q-border pb-2">
                {isEn ? 'About & Download' : 'Tentang & Unduh SeeNote'}
              </h3>

              {/* Brand & Local Privacy Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <BrandLogo />
                  <p className="text-[11px] q-text-muted leading-relaxed">
                    {isEn
                      ? 'Fast local-first workspace for notes, docs, checklists, math & whiteboards. Zero login required.'
                      : 'Ruang kerja catatan lokal yang cepat untuk dokumen, checklist, rumus, dan whiteboard. Tanpa perlu login.'}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/[0.12] text-[10px] font-mono q-text-secondary">
                  v1.0
                </span>
              </div>

              {/* Download & Install Section */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider q-text-muted px-0.5">
                  {isEn ? 'Get SeeNote on Your Device' : 'Pasang & Unduh SeeNote'}
                </p>

                {/* 1. Install as Desktop / Mobile App (PWA) */}
                <button
                  type="button"
                  onClick={handleInstallApp}
                  disabled={isInstalledPwa}
                  className="w-full p-3.5 rounded-2xl glass-btn-primary flex items-center justify-between gap-3 text-left disabled:opacity-60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.14] flex items-center justify-center shrink-0">
                      <Laptop className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">
                        {isInstalledPwa
                          ? isEn
                            ? 'Installed as App'
                            : 'Sudah Terpasang di Perangkat'
                          : isEn
                          ? 'Install Web App (Desktop & Mobile)'
                          : 'Install Aplikasi (Desktop & HP)'}
                      </p>
                      <p className="text-[11px] text-white/60 truncate">
                        {isInstalledPwa
                          ? isEn
                            ? 'Running in standalone app mode'
                            : 'Berjalan dalam mode aplikasi mandiri'
                          : isEn
                          ? 'Works offline, opens in its own window'
                          : 'Bisa jalan offline di jendela mandiri tanpa browser bar'}
                      </p>
                    </div>
                  </div>
                  {isInstalledPwa ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Download className="w-4 h-4 text-white/80 shrink-0" />
                  )}
                </button>

                {installHintVisible && !isInstalledPwa && (
                  <p className="text-[11px] q-text-muted px-2 leading-relaxed">
                    {isEn
                      ? 'Tip: Click the install icon in your browser address bar, or open browser menu → "Install SeeNote" / "Add to Home Screen".'
                      : 'Tips: Klik ikon install di kanan address bar browser, atau buka menu browser → "Install SeeNote" / "Tambahkan ke Layar Utama".'}
                  </p>
                )}

                {/* 2. Download Link / Releases & GitHub Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={SEENOTE_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl glass-control flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Download className="w-4 h-4 q-text-muted group-hover:text-white shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold q-text-primary truncate">
                          {isEn ? 'Download Releases' : 'Unduh Rilis'}
                        </p>
                        <p className="text-[10px] q-text-muted truncate">GitHub Releases</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 q-text-muted group-hover:text-white shrink-0" />
                  </a>

                  <a
                    href={SEENOTE_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl glass-control flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Code2 className="w-4 h-4 q-text-muted group-hover:text-white shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold q-text-primary truncate">
                          {isEn ? 'GitHub Repository' : 'Kode Sumber'}
                        </p>
                        <p className="text-[10px] q-text-muted truncate">yaserarafatt12</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 q-text-muted group-hover:text-white shrink-0" />
                  </a>
                </div>

                {/* 3. Copy Share Link */}
                <button
                  type="button"
                  onClick={handleCopyAppLink}
                  className="w-full py-2.5 px-3.5 rounded-xl glass-control flex items-center justify-between text-xs font-semibold q-text-primary"
                >
                  <span className="flex items-center gap-2">
                    {copiedAppLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 q-text-muted" />
                    )}
                    <span>
                      {copiedAppLink
                        ? isEn
                          ? 'App link copied!'
                          : 'Link aplikasi disalin!'
                        : isEn
                        ? 'Copy Web App Link'
                        : 'Salin Link Web App'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono q-text-muted truncate max-w-[160px]">
                    {window.location.host}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
