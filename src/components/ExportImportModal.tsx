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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm font-sans select-none">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Cadangkan &amp; Pemulihan Data
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Export Box */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
              <Download className="w-4 h-4 text-indigo-500" />
              <span>Ekspor Cadangan (JSON)</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Unduh {notes.length} catatan dalam format JSON untuk disimpan di komputer lo.
            </p>
            <button
              onClick={handleExportDownload}
              className="w-full mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
            >
              Unduh Backup JSON
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Impor Data Catatan</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pilih berkas JSON cadangan untuk memulihkan data catatan.
            </p>
            <label className="block w-full text-center py-2 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-all cursor-pointer">
              <span>Pilih File JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
