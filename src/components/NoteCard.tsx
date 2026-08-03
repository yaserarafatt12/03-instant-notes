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
      className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none font-sans ${
        isSelected
          ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-l-2 border-l-indigo-500 border-zinc-200 dark:border-zinc-800/80 shadow-xs'
          : 'bg-white dark:bg-zinc-900/50 border-zinc-200/70 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
          <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
        </h3>
        <div className="flex items-center gap-0.5 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
          {!note.isTrash && (
            <>
              <button
                onClick={onToggleFavorite}
                className={`p-1 rounded-md transition-colors ${
                  note.isFavorite
                    ? 'text-amber-400 hover:text-amber-500'
                    : 'text-zinc-400 dark:text-zinc-600 hover:text-amber-400'
                }`}
                title={note.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              >
                <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              {onDuplicateNote && (
                <button
                  onClick={onDuplicateNote}
                  className="p-1 text-zinc-400 hover:text-indigo-500 rounded-md transition-colors"
                  title="Duplikat catatan"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          <button
            onClick={handleCopy}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
            title="Salin isi catatan"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {note.isTrash ? (
            <>
              <button
                onClick={onToggleTrash}
                className="p-1 text-emerald-500 hover:text-emerald-600 rounded-md transition-colors"
                title="Pulihkan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {onDeletePermanently && (
                <button
                  onClick={onDeletePermanently}
                  className="p-1 text-rose-500 hover:text-rose-600 rounded-md transition-colors"
                  title="Hapus permanen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onToggleTrash}
              className="p-1 text-zinc-400 hover:text-rose-500 rounded-md transition-colors"
              title="Pindahkan ke tempat sampah"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 leading-relaxed font-normal">
        <HighlightText text={snippet} query={searchQuery} />
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-1 overflow-hidden">
          {note.subject && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-medium">
              <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
              {note.subject}
            </span>
          )}
          {note.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="inline-flex items-center gap-0.5 text-zinc-500 dark:text-zinc-400 font-medium">
              <Tag className="w-2.5 h-2.5 opacity-60" />
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[9px] text-zinc-400 font-medium">+{note.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 font-medium text-zinc-400 dark:text-zinc-500">
          <Calendar className="w-3 h-3" />
          <span>{formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
