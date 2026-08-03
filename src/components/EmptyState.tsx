import React from 'react';
import { Sparkles, Plus, FileText, Star, ShieldCheck, Zap } from 'lucide-react';

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
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Buat Catatan</span>
      </button>
    </div>
  );
};

export const DashboardEmptyEditor: React.FC<{ onNewNote: () => void }> = ({ onNewNote }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 text-center select-none font-sans bg-[#0c0d12] overflow-y-auto">
      <div className="max-w-2xl w-full space-y-10">
        {/* Main Title & Craft-style Hero Badge */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>InstantNotes — Next-Gen Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Apa yang ingin kamu <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              catat hari ini?
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Personal note finder 100% lokal &amp; offline. Tulis dokumen, rumus, atau ide instan tanpa hambatan loading.
          </p>
        </div>

        {/* Craft-style Card Block Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <button
            onClick={onNewNote}
            className="group p-5 rounded-2xl bg-[#171822] hover:bg-[#1e1f2d] border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition-transform shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono bg-[#111218] px-2 py-1 rounded-md border border-[#232536]">Ctrl+N</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Buat Catatan Baru
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Tulis dokumen atau ide baru secara instan.</p>
            </div>
          </button>

          <div className="p-5 rounded-2xl bg-[#171822] border border-white/5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Responsif &amp; Terbuka Instan</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Pencarian &amp; akses catatan dalam orde milidetik di IndexedDB.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#171822] border border-white/5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Organisasi Subjek &amp; Tag</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Kelompokkan informasi penting dengan kategori yang rapi.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#171822] border border-white/5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Privasi 100% Lokal</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Data sepenuhnya milik kamu di peramban, tanpa server cloud.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
