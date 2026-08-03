import React from 'react';
import { Star, BookOpen, Clock } from 'lucide-react';
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
      className={`group relative p-4 rounded-2xl transition-all cursor-pointer select-none font-sans flex flex-col justify-between h-64 border ${
        isSelected
          ? 'bg-[#25252b] border-indigo-500/60 shadow-xl ring-1 ring-indigo-500/30'
          : 'bg-[#202024] border-white/5 hover:bg-[#25252a] hover:border-white/10 hover:shadow-lg'
      }`}
    >
      {/* Top Section: Title, Location Breadcrumb & Star */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-300 transition-colors tracking-tight">
            <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
          </h3>
          {note.isFavorite && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
          <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="truncate">{note.subject || 'Umum'}</span>
          <span>•</span>
          <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
          <span>Updated {formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>

      {/* Middle Craft Paper Document Thumbnail Preview */}
      <div className="flex-1 my-3 bg-[#f8f9fa] dark:bg-[#151518] rounded-xl p-3 border border-black/5 dark:border-white/5 overflow-hidden text-left shadow-inner">
        <p className="text-[11px] text-slate-800 dark:text-zinc-300 font-normal leading-relaxed line-clamp-5 select-none opacity-90">
          <HighlightText text={snippet || note.content || 'Ketik catatan di sini...'} query={searchQuery} />
        </p>
      </div>

      {/* Bottom Craft Inline Tags (# tag1 # tag2) */}
      <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-medium overflow-hidden">
        {note.tags.slice(0, 3).map((t, i) => (
          <span key={i} className="hover:underline">
            #{t}
          </span>
        ))}
        {note.tags.length > 3 && (
          <span className="text-zinc-500">+{note.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
};
