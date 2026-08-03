import React from 'react';
import { Star, Calendar, Tag, BookOpen } from 'lucide-react';
import type { Note } from '../types/note';
import { HighlightText } from './HighlightText';
import { formatRelativeTime } from '../lib/dateUtils';

interface NoteCardProps {
  note: Note;
  snippet: string;
  searchQuery: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  snippet,
  searchQuery,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none font-sans ${
        isSelected
          ? 'bg-[#1a1c29] border-l-2 border-l-indigo-500 border-t-[#252838] border-r-[#252838] border-b-[#252838] shadow-sm'
          : 'bg-[#13141b]/60 border-[#1f212c] hover:border-[#2c2f3f] hover:bg-[#181923]'
      }`}
    >
      {/* Title & Favorite Star Indicator */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-indigo-400 transition-colors tracking-tight">
          <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
        </h3>
        {note.isFavorite && (
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Snippet Preview */}
      <p className="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed font-normal">
        <HighlightText text={snippet} query={searchQuery} />
      </p>

      {/* Metadata Row: Subject, Tag & Relative Date */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 pt-1.5 border-t border-[#1f212c]/70">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {note.subject && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1f212c] text-zinc-300 font-medium">
              <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
              {note.subject}
            </span>
          )}
          {note.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="inline-flex items-center gap-0.5 text-zinc-400 font-medium">
              <Tag className="w-2.5 h-2.5 opacity-60" />
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[9px] text-zinc-500 font-medium">+{note.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 font-medium text-zinc-500">
          <Calendar className="w-3 h-3 opacity-70" />
          <span>{formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
