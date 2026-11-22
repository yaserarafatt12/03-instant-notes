import React, { useState } from 'react';
import { X, Download, Upload, FileCheck, AlertCircle } from 'lucide-react';
import type { Note } from '../types/note';
import { exportBackupJSON, importBackupJSON } from '../lib/storage/db';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onNotesImported: (notes: Note[]) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  notes,
  onNotesImported,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportDownload = async () => {
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
        setErrorMsg('Format file tidak valid. Pastikan memilih file JSON cadangan InstantNotes.');
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md font-sans select-none"
      style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b q-border">
          <h2 className="text-base font-bold q-text-primary tracking-tight">
            Cadangkan &amp; Pemulihan Data
          </h2>
          <button onClick={onClose} className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Export Box */}
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-2">
            <div className="flex items-center gap-2 q-text-primary font-semibold text-xs">
              <Download className="w-4 h-4 q-text-muted" />
              <span>Ekspor Cadangan (JSON)</span>
            </div>
            <p className="text-xs q-text-muted leading-relaxed">
              Unduh {notes.length} catatan dalam format JSON untuk disimpan di perangkat Anda.
            </p>
            <button
              onClick={handleExportDownload}
              className="w-full mt-2 py-2 px-4 glass-btn-primary font-semibold text-xs rounded-full transition-all"
            >
              Unduh Backup JSON
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.12] space-y-2">
            <div className="flex items-center gap-2 q-text-primary font-semibold text-xs">
              <Upload className="w-4 h-4 q-text-muted" />
              <span>Impor Data Catatan</span>
            </div>
            <p className="text-xs q-text-muted leading-relaxed">
              Pilih berkas JSON cadangan untuk memulihkan data catatan.
            </p>
            <label className="block w-full text-center py-2 px-4 glass-control q-text-primary font-semibold text-xs rounded-full transition-all cursor-pointer">
              <span>Pilih File JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="flex items-center gap-2 p-3 glass-control text-white text-xs rounded-xl">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-400/30 text-rose-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
