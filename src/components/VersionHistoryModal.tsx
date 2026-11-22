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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b q-border flex items-center justify-between bg-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 glass-control rounded-xl">
              <History className="w-4 h-4 q-text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold q-text-primary tracking-tight">Riwayat Versi</h3>
              <p className="text-[11px] q-text-muted">Pulihkan versi sebelumnya kapan saja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 q-text-muted hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-10 q-text-muted text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Belum ada riwayat versi tercatat untuk catatan ini.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={log.id}
                className="p-3.5 bg-white/[0.05] border border-white/[0.12] rounded-2xl transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold q-text-secondary">
                    <Clock className="w-3.5 h-3.5 q-text-muted" />
                    <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 glass-control text-white text-[10px] rounded-full font-semibold">
                        Terbaru
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold q-text-primary mt-1 truncate">{log.title}</p>
                  <p className="text-[11px] q-text-muted line-clamp-2 mt-0.5 font-normal">
                    {log.content.replace(/:::attachment\{.*?\}\n:::/g, '[Media]').trim() || '(Kosong)'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] q-text-muted">
                    <span>{log.charCount} Karakter</span>
                    {log.subject && <span>Folder: {log.subject}</span>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestore(log);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 glass-btn-primary font-semibold text-xs rounded-full transition-all flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
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
        <div className="p-3 bg-white/[0.04] border-t q-border flex items-center justify-between text-[11px] q-text-muted px-4">
          <span>Otomatis menyimpan hingga 20 versi terakhir.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 glass-control q-text-primary rounded-full font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
