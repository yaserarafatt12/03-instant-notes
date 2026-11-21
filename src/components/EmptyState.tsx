import React from 'react';
import { Plus, FileText, Star, History, Search, Trash2, Clock, Folder } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface EmptyStateProps {
  type: 'all' | 'favorites' | 'trash' | 'recent' | 'search';
  onNewNote: () => void;
  language?: 'id' | 'en';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onNewNote, language = 'id' }) => {
  const isEn = language === 'en';

  if (type === 'search') {
    return (
      <div className="max-w-md mx-auto mt-14 p-8 text-center glass-card rounded-3xl font-sans space-y-3">
        <div className="w-11 h-11 mx-auto rounded-2xl glass-control flex items-center justify-center">
          <Search className="w-5 h-5 q-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold q-text-primary tracking-tight">
            {isEn ? 'No matching notes found' : 'Tidak ada catatan yang cocok'}
          </p>
          <p className="text-xs q-text-muted mt-1">
            {isEn ? 'Try a different keyword or clear active filters.' : 'Coba kata kunci lain atau ubah filter pencarian.'}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'trash') {
    return (
      <div className="max-w-md mx-auto mt-14 p-8 text-center glass-card rounded-3xl font-sans space-y-3">
        <div className="w-11 h-11 mx-auto rounded-2xl glass-control flex items-center justify-center">
          <Trash2 className="w-5 h-5 q-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold q-text-primary tracking-tight">
            {isEn ? 'Trash is empty' : 'Tempat sampah kosong'}
          </p>
          <p className="text-xs q-text-muted mt-1">
            {isEn ? 'Deleted notes will appear here so you can restore them anytime.' : 'Catatan yang dihapus akan muncul di sini dan bisa dipulihkan kapan saja.'}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'favorites') {
    return (
      <div className="max-w-md mx-auto mt-14 p-8 text-center glass-card rounded-3xl font-sans space-y-3">
        <div className="w-11 h-11 mx-auto rounded-2xl glass-control flex items-center justify-center">
          <Star className="w-5 h-5 q-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold q-text-primary tracking-tight">
            {isEn ? 'No favorite notes yet' : 'Belum ada catatan favorit'}
          </p>
          <p className="text-xs q-text-muted mt-1">
            {isEn ? 'Star important notes to keep them pinned here.' : 'Tandai catatan penting dengan bintang agar mudah ditemukan.'}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'recent') {
    return (
      <div className="max-w-md mx-auto mt-14 p-8 text-center glass-card rounded-3xl font-sans space-y-3">
        <div className="w-11 h-11 mx-auto rounded-2xl glass-control flex items-center justify-center">
          <Clock className="w-5 h-5 q-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold q-text-primary tracking-tight">
            {isEn ? 'No recent activity' : 'Belum ada catatan yang baru dibuka'}
          </p>
          <p className="text-xs q-text-muted mt-1">
            {isEn ? 'Notes you open or edit will show up here.' : 'Catatan yang kamu buka atau edit akan tampil di sini.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-14 p-8 text-center glass-card rounded-3xl font-sans space-y-4">
      <div className="w-11 h-11 mx-auto rounded-2xl glass-control flex items-center justify-center">
        <FileText className="w-5 h-5 q-text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold q-text-primary tracking-tight">
          {isEn ? 'No notes here yet' : 'Belum ada catatan di sini'}
        </p>
        <p className="text-xs q-text-muted mt-1">
          {isEn ? 'Create your first note to start writing.' : 'Buat catatan pertamamu untuk mulai menulis.'}
        </p>
      </div>
      <button
        onClick={onNewNote}
        className="inline-flex items-center gap-1.5 px-4 py-2 glass-btn-primary font-semibold text-xs rounded-full active:scale-[0.98]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isEn ? 'Create First Note' : 'Buat Catatan Baru'}</span>
      </button>
    </div>
  );
};

export const DashboardEmptyEditor: React.FC<{ onNewNote: () => void }> = ({ onNewNote }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 text-center select-none font-sans bg-transparent overflow-y-auto">
      <div className="max-w-2xl w-full space-y-10">
        {/* Main Title & Minimal Brand Header */}
        <div className="space-y-4 flex flex-col items-center">
          <BrandLogo />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight q-text-primary leading-tight">
            Apa yang ingin kamu catat hari ini?
          </h2>
          <p className="text-xs sm:text-sm q-text-muted leading-relaxed max-w-md mx-auto">
            Ruang tulis yang tenang untuk dokumen, ide, dan catatan harian.
          </p>
        </div>

        {/* Monochrome Tempered Glass Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <button
            onClick={onNewNote}
            className="group p-5 rounded-2xl glass-card transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl glass-control flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 q-text-primary" />
              </div>
              <span className="text-[10px] q-text-muted font-mono glass-recessed px-2 py-1 rounded-md">Ctrl+N</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold q-text-primary tracking-tight">
                Buat Catatan Baru
              </h3>
              <p className="text-xs q-text-muted mt-1 leading-relaxed">
                Tulis dokumen, catatan cepat, atau ide baru.
              </p>
            </div>
          </button>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl glass-control flex items-center justify-center">
              <Search className="w-5 h-5 q-text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold q-text-primary tracking-tight">
                Pencarian Cepat
              </h3>
              <p className="text-xs q-text-muted mt-1 leading-relaxed">
                Temukan catatan, folder, atau tag dengan kata kunci apa saja.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl glass-control flex items-center justify-center">
              <Folder className="w-5 h-5 q-text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold q-text-primary tracking-tight">
                Folder &amp; Tag Terstruktur
              </h3>
              <p className="text-xs q-text-muted mt-1 leading-relaxed">
                Kelompokkan informasi penting dengan folder bersarang dan tag.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl glass-control flex items-center justify-center">
              <History className="w-5 h-5 q-text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold q-text-primary tracking-tight">
                Riwayat &amp; Cadangan
              </h3>
              <p className="text-xs q-text-muted mt-1 leading-relaxed">
                Pulihkan versi sebelumnya atau ekspor catatan kapan saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
