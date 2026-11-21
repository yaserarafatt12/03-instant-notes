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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/75 backdrop-blur-md font-sans select-none">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-base font-bold text-white">
            Cadangkan &amp; Pemulihan Data
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Export Box */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#071123]/70 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Download className="w-4 h-4 text-sky-400" />
              <span>Ekspor Cadangan (JSON)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unduh {notes.length} catatan dalam format JSON untuk disimpan di komputer lo.
            </p>
            <button
              onClick={handleExportDownload}
              className="w-full mt-2 py-2 px-4 glass-btn-primary text-white font-semibold text-xs rounded-full transition-all"
            >
              Unduh Backup JSON
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#071123]/70 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Impor Data Catatan</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih berkas JSON cadangan untuk memulihkan data catatan.
            </p>
            <label className="block w-full text-center py-2 px-4 bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-100 font-semibold text-xs rounded-full transition-all cursor-pointer">
              <span>Pilih File JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs rounded-xl">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
