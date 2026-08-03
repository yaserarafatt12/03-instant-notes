import React from 'react';
import { Star, Trash2, RotateCcw, Copy, Check, Calendar, Tag, BookOpen, CopyPlus } from 'lucide-react';
import type { Note } from '../types/note';
import { HighlightText } from './HighlightText';
import { formatRelativeTime } from '../lib/dateUtils';

interface NoteCardProps {
  note: Note;
  snippet: string;
  searchQuery: string;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onToggleTrash: (e: React.MouseEvent) => void;
  onDuplicateNote?: (e: React.MouseEvent) => void;
  onDeletePermanently?: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  snippet,
  searchQuery,
  isSelected,
  onSelect,
  onToggleFavorite,
  onToggleTrash,
  onDuplicateNote,
  onDeletePermanently,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-500/15 dark:border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
        </h3>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {!note.isTrash && (
            <>
              <button
                onClick={onToggleFavorite}
                className={`p-1 rounded-lg transition-colors ${
                  note.isFavorite
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                }`}
                title={note.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              >
                <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-500' : ''}`} />
              </button>

              {onDuplicateNote && (
                <button
                  onClick={onDuplicateNote}
                  className="p-1 text-slate-400 hover:text-amber-500 rounded-lg transition-colors"
                  title="Duplikat catatan (FR-106)"
                >
                  <CopyPlus className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            title="Salin isi catatan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {note.isTrash ? (
            <>
              <button
                onClick={onToggleTrash}
                className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                title="Pulihkan dari tempat sampah"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {onDeletePermanently && (
                <button
                  onClick={onDeletePermanently}
                  className="p-1 text-rose-500 hover:text-rose-600 rounded-lg transition-colors"
                  title="Hapus permanen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onToggleTrash}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
              title="Pindahkan ke tempat sampah"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        <HighlightText text={snippet} query={searchQuery} />
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 overflow-hidden">
          {note.subject && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              <BookOpen className="w-3 h-3 text-amber-500" />
              {note.subject}
            </span>
          )}
          {note.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-slate-400">+{note.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0" title={`Diubah: ${new Date(note.updatedAt).toLocaleString('id-ID')}`}>
          <Calendar className="w-3 h-3" />
          <span>{formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
