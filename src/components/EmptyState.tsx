import React from 'react';
import { Sparkles, Plus, FileText, Star, ShieldCheck, Zap } from 'lucide-react';

interface EmptyStateProps {
  type: 'all' | 'favorites' | 'trash' | 'recent' | 'search';
  onNewNote: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onNewNote }) => {
  if (type === 'search') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 text-center glass-card rounded-3xl text-slate-400 font-sans">
        <p className="text-sm font-bold text-white">Tidak ada catatan yang cocok</p>
        <p className="text-xs text-slate-400 mt-1.5">Coba kata kunci atau filter lain</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 text-center glass-card rounded-3xl text-slate-400 font-sans space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl liquid-lens-active flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-sky-200" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">Belum ada catatan di sini</p>
        <p className="text-xs text-slate-400 mt-1">Mulai dengan membuat catatan baru</p>
      </div>
      <button
        onClick={onNewNote}
        className="inline-flex items-center gap-1.5 px-4 py-2 glass-btn-primary text-white font-semibold text-xs rounded-full transition-all active:scale-[0.98]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Buat Catatan</span>
      </button>
    </div>
  );
};

export const DashboardEmptyEditor: React.FC<{ onNewNote: () => void }> = ({ onNewNote }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 text-center select-none font-sans midnight-ambient-bg overflow-y-auto">
      <div className="max-w-2xl w-full space-y-10">
        {/* Main Title & Hero Badge */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-pill text-sky-200 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>SeeNote — Next-Gen Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Apa yang ingin kamu <br />
            <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              catat hari ini?
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Personal note finder 100% lokal &amp; offline. Tulis dokumen, rumus, atau ide instan tanpa hambatan loading.
          </p>
        </div>

        {/* Tempered Glass Card Block Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <button
            onClick={onNewNote}
            className="group p-5 rounded-2xl glass-card transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center border border-sky-400/30 group-hover:scale-105 transition-transform shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-[#071123]/80 px-2 py-1 rounded-md border border-white/10">Ctrl+N</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-200 transition-colors">
                Buat Catatan Baru
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Tulis dokumen atau ide baru secara instan.</p>
            </div>
          </button>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Responsif &amp; Terbuka Instan</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Pencarian &amp; akses catatan dalam orde milidetik di IndexedDB.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center border border-amber-400/30 shadow-xs">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Organisasi Subjek &amp; Tag</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Kelompokkan informasi penting dengan kategori yang rapi.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center border border-violet-400/30 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Privasi 100% Lokal</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Data sepenuhnya milik kamu di peramban, tanpa server cloud.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
