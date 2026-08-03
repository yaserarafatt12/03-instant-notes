import React from 'react';
import { Sparkles, Plus, FileText, Star, BookOpen, Clock } from 'lucide-react';

interface EmptyStateProps {
  type: 'all' | 'favorites' | 'trash' | 'recent' | 'search';
  onNewNote: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onNewNote }) => {
  if (type === 'search') {
    return (
      <div className="p-8 text-center text-zinc-500 font-sans">
        <p className="text-xs font-semibold text-zinc-400">Tidak ada catatan yang cocok</p>
        <p className="text-[11px] text-zinc-600 mt-1">Coba kata kunci atau filter lain</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-zinc-500 font-sans space-y-3">
      <Sparkles className="w-6 h-6 mx-auto text-indigo-400 opacity-60" />
      <div>
        <p className="text-xs font-semibold text-zinc-300">Belum ada catatan di sini</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Mulai dengan membuat catatan baru</p>
      </div>
      <button
        onClick={onNewNote}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Buat Catatan</span>
      </button>
    </div>
  );
};

export const DashboardEmptyEditor: React.FC<{ onNewNote: () => void }> = ({ onNewNote }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center select-none font-sans bg-[#0c0d12]">
      <div className="max-w-xl w-full space-y-8">
        {/* Main Title & Hero Greeting */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>InstantNotes Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Apa yang ingin kamu catat hari ini?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Akses instan 100% lokal &amp; offline. Tulis ide, rumus, atau snippet kode tanpa hambatan.
          </p>
        </div>

        {/* Quick Action Cards (Matching Image 4 Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <button
            onClick={onNewNote}
            className="group p-4 rounded-2xl bg-[#141620] hover:bg-[#1a1d2b] border border-[#212433] hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                Buat Catatan Baru
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Tulis ide atau dokumen baru secara instan.</p>
            </div>
          </button>

          <div className="p-4 rounded-2xl bg-[#141620] border border-[#212433] flex flex-col justify-between space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Terbuka Instan</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Data tersimpan otomatis di IndexedDB lokal.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141620] border border-[#212433] flex flex-col justify-between space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Organisasi Rapi</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Gunakan Subjek &amp; Tag untuk grup catatan.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141620] border border-[#212433] flex flex-col justify-between space-y-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Privasi Mutlak</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">100% tanpa server &amp; tanpa pelacakan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
