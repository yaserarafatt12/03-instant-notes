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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Cadangkan &amp; Pemulihan Data
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Export Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
              <Download className="w-4 h-4 text-amber-500" />
              <span>Ekspor Cadangan (JSON)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unduh seluruh {notes.length} catatan dalam format berkas JSON untuk disimpan secara aman di komputer lo.
            </p>
            <button
              onClick={handleExportDownload}
              className="w-full mt-2 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Unduh Backup JSON
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Impor Data Catatan</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih berkas JSON cadangan InstantNotes untuk memulihkan catatan ke peramban ini.
            </p>
            <label className="block w-full text-center py-2 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer">
              <span>Pilih File JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
