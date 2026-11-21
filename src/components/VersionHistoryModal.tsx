import React from 'react';
import { History, RotateCcw, X, Clock } from 'lucide-react';
import { getVersionLogs } from '../lib/storage/versionHistory';
import type { VersionSnapshot } from '../lib/storage/versionHistory';

interface VersionHistoryModalProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (snapshot: VersionSnapshot) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  noteId,
  isOpen,
  onClose,
  onRestore,
}) => {
  if (!isOpen) return null;

  const logs = getVersionLogs(noteId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Riwayat Versi</h3>
              <p className="text-[11px] text-slate-400">Restore/pulihkan progres jika tidak sengaja terhapus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Belum ada riwayat versi tercatat untuk catatan ini.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#071123]/70 hover:bg-[#0D1E3B]/80 border border-white/10 hover:border-sky-400/35 rounded-2xl transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] rounded-full font-bold">
                        Terbaru
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white mt-1 truncate">{log.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-normal">
                    {log.content.replace(/:::attachment\{.*?\}\n:::/g, '[Media]').trim() || '(Kosong)'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>{log.charCount} Karakter</span>
                    {log.subject && <span>Folder: {log.subject}</span>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestore(log);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 glass-btn-primary text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
                  title="Pulihkan versi ini"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Pulihkan
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#071123]/75 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Otomatis menyimpan hingga 20 versi terakhir.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
