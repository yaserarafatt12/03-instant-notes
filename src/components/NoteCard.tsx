import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Star, FolderOpen, Clock, MoreHorizontal, CopyPlus, Trash2, FolderInput, ChevronRight, Check, Undo2, FileText, FileUp, Code2, GitGraph } from 'lucide-react';
import type { Note } from '../types/note';
import { HighlightText } from './HighlightText';
import { formatRelativeTime } from '../lib/dateUtils';

interface NoteCardProps {
  note: Note;
  snippet: string;
  searchQuery: string;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite?: (id: string) => void;
  onToggleTrash?: (id: string) => void;
  onDeletePermanently?: (id: string) => void;
  onDuplicateNote?: (note: Note) => void;
  onMoveNote?: (note: Note, newSubject: string) => void;
  allExistingFolders?: string[];
  isSelectionMode?: boolean;
  isMultiSelected?: boolean;
  onToggleMultiSelect?: (id: string) => void;
}

type MiniBlock =
  | { type: 'text'; text: string }
  | { type: 'subpage'; title: string }
  | { type: 'attachment'; name: string; size?: string }
  | { type: 'code'; lang?: string; code: string }
  | { type: 'mermaid'; code: string };

function parseNoteToMiniBlocks(rawContent: string): MiniBlock[] {
  if (!rawContent || !rawContent.trim()) return [];

  const blocks: MiniBlock[] = [];
  const blockRegex = /(:::(?:subpage|attachment|code|mermaid)\{[\s\S]*?:::|```(?:mermaid|[a-zA-Z0-9_-]*)\n[\s\S]*?```)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(rawContent)) !== null) {
    // Text segment before block
    const textSegment = rawContent.slice(lastIndex, match.index).trim();
    if (textSegment) {
      const cleanText = textSegment
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[*~_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanText) {
        blocks.push({ type: 'text', text: cleanText });
      }
    }

    const blockStr = match[0];

    if (blockStr.startsWith(':::subpage')) {
      const titleMatch = blockStr.match(/title="([^"]*)"/);
      const title = titleMatch ? titleMatch[1] : 'Halaman Tanpa Judul';
      blocks.push({ type: 'subpage', title });
    } else if (blockStr.startsWith(':::attachment')) {
      const nameMatch = blockStr.match(/name="([^"]*)"/);
      const sizeMatch = blockStr.match(/size="([^"]*)"/);
      const name = nameMatch ? nameMatch[1] : 'File Attachment';
      const size = sizeMatch ? sizeMatch[1] : '';
      blocks.push({ type: 'attachment', name, size });
    } else if (blockStr.startsWith(':::code')) {
      const langMatch = blockStr.match(/lang="([^"]*)"/);
      const contentInside = blockStr.replace(/:::code\{[\s\S]*?\}\n?/, '').replace(/\n?:::$/, '');
      blocks.push({ type: 'code', lang: langMatch ? langMatch[1] : 'code', code: contentInside.trim() });
    } else if (blockStr.startsWith(':::mermaid')) {
      const contentInside = blockStr.replace(/:::mermaid\{[\s\S]*?\}\n?/, '').replace(/\n?:::$/, '');
      blocks.push({ type: 'mermaid', code: contentInside.trim() });
    } else if (blockStr.startsWith('```mermaid')) {
      const code = blockStr.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '');
      blocks.push({ type: 'mermaid', code: code.trim() });
    } else if (blockStr.startsWith('```')) {
      const langMatch = blockStr.match(/^```([a-zA-Z0-9_-]*)\n/);
      const code = blockStr.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '');
      blocks.push({ type: 'code', lang: langMatch ? langMatch[1] : 'code', code: code.trim() });
    }

    lastIndex = match.index + blockStr.length;
  }

  // Text after last block
  const remainingText = rawContent.slice(lastIndex).trim();
  if (remainingText) {
    const cleanText = remainingText
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[*~_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanText) {
      blocks.push({ type: 'text', text: cleanText });
    }
  }

  return blocks;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  snippet: _snippet,
  searchQuery,
  isSelected,
  onSelect,
  onToggleFavorite,
  onToggleTrash,
  onDeletePermanently,
  onDuplicateNote,
  onMoveNote,
  allExistingFolders = ['Umum'],
  isSelectionMode = false,
  isMultiSelected = false,
  onToggleMultiSelect = () => {},
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsMovePopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleMultiSelect(note.id);
    } else {
      onSelect();
    }
  };

  // Parse chronological mini blocks (text, mermaid, attachment, subpage, code)
  const miniBlocks = useMemo(() => parseNoteToMiniBlocks(note.content), [note.content]);

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSelectionMode) {
          setIsMenuOpen(true);
        }
      }}
      className={`group relative p-4 rounded-2xl transition-all duration-200 cursor-pointer select-none font-sans flex flex-col justify-between min-h-[260px] glass-card ${
        isMultiSelected
          ? '!border-sky-400/80 ring-2 ring-sky-400/40 shadow-[0_0_28px_rgba(56,189,248,0.22)]'
          : isSelected
          ? '!border-sky-400/60 ring-1 ring-sky-400/30'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Top Section: Multi-select Checkbox, Clean Full Title, & Context Menu */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {/* Multi-selection Checkbox Indicator */}
            {isSelectionMode && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMultiSelect(note.id);
                }}
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                  isMultiSelected
                    ? 'bg-sky-500 border-sky-300 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                    : 'border-white/25 bg-[#071123]/80 group-hover:border-white/45'
                }`}
              >
                {isMultiSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            )}

            <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-sky-200 transition-colors tracking-tight">
              <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Context Menu Trigger */}
            {!isSelectionMode && (
              <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Opsi Catatan"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Tempered Glass Context Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-6 w-44 glass-popover rounded-2xl p-1.5 z-50 space-y-0.5 font-sans">
                    {note.isTrash ? (
                      <>
                        {/* Trash-specific menu: Pulihkan & Hapus Permanen */}
                        {onToggleTrash && (
                          <button
                            onClick={() => {
                              onToggleTrash(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 rounded-xl transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pulihkan</span>
                          </button>
                        )}

                        {onDeletePermanently && (
                          <button
                            onClick={() => {
                              onDeletePermanently(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hapus Permanen</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Normal note menu */}
                        {onToggleFavorite && (
                          <button
                            onClick={() => {
                              onToggleFavorite(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                            <span>{note.isFavorite ? 'Unstar' : 'Pin to Favorite'}</span>
                          </button>
                        )}

                        {onDuplicateNote && (
                          <button
                            onClick={() => {
                              onDuplicateNote(note);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <CopyPlus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Duplicate</span>
                          </button>
                        )}

                        {/* Move to Folder Submenu */}
                        {onMoveNote && (
                          <div className="relative">
                            <button
                              onClick={() => setIsMovePopoverOpen(!isMovePopoverOpen)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                                <span>Move to</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {isMovePopoverOpen && (
                              <div className="absolute left-full top-0 ml-1.5 w-40 glass-popover rounded-2xl p-1.5 z-50 max-h-36 overflow-y-auto space-y-0.5 font-sans">
                                {allExistingFolders.map((f) => (
                                  <button
                                    key={f}
                                    onClick={() => {
                                      onMoveNote(note, f);
                                      setIsMovePopoverOpen(false);
                                      setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-2 py-1 text-xs truncate rounded-lg text-slate-200 hover:text-white hover:bg-white/10"
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {onToggleTrash && (
                          <button
                            onClick={() => {
                              onToggleTrash(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Row: Folder Name, Star Badge, & Updated Relative Time */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <FolderOpen className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="truncate text-slate-300">{note.subject || 'Umum'}</span>

          {/* Sleek Star Icon Badge */}
          {note.isFavorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0 ml-0.5" />
          )}

          <span className="text-slate-600">•</span>
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="text-slate-400">Updated {formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>

      {/* Middle Recessed Midnight Navy Document Paper Preview */}
      <div className="flex-1 my-3 bg-[#071123]/75 rounded-xl p-3 border border-white/[0.08] overflow-hidden text-left shadow-[inset_0_2px_8px_rgba(2,6,23,0.5)] flex flex-col justify-start gap-1.5">
        {miniBlocks.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic select-none">
            Belum ada konten catatan.
          </p>
        ) : (
          miniBlocks.slice(0, 3).map((b, i) => {
            if (b.type === 'text') {
              return (
                <p key={i} className="text-[11px] text-slate-300 font-normal leading-relaxed line-clamp-3 select-none opacity-90">
                  <HighlightText text={b.text} query={searchQuery} />
                </p>
              );
            }

            if (b.type === 'mermaid') {
              return (
                <div key={i} className="p-2 bg-[#0B172E]/80 rounded-lg border border-white/[0.08] flex items-center gap-2 text-slate-200 select-none shrink-0">
                  <GitGraph className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[10.5px] font-semibold text-slate-200 truncate">Diagram Mermaid</span>
                </div>
              );
            }

            if (b.type === 'attachment') {
              return (
                <div key={i} className="p-2 bg-[#0B172E]/80 rounded-lg border border-white/[0.08] flex items-center gap-2 text-slate-200 select-none shrink-0">
                  <FileUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="overflow-hidden flex-1 leading-tight">
                    <div className="text-[10.5px] font-semibold text-slate-200 truncate">{b.name}</div>
                    {b.size && <div className="text-[9px] text-slate-500">{b.size}</div>}
                  </div>
                </div>
              );
            }

            if (b.type === 'subpage') {
              return (
                <div key={i} className="p-2 bg-[#0B172E]/80 rounded-lg border border-white/[0.08] flex items-center gap-2 text-slate-200 select-none shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10.5px] font-semibold text-slate-200 truncate">{b.title}</span>
                </div>
              );
            }

            if (b.type === 'code') {
              return (
                <div key={i} className="p-2 bg-[#0B172E]/80 rounded-lg border border-white/[0.08] flex items-center gap-2 font-mono text-slate-200 select-none shrink-0">
                  <Code2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-[9.5px] text-violet-200 truncate font-mono">{b.code.slice(0, 45) || 'Code Block'}</span>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Bottom Inline Tags */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium overflow-hidden">
        {note.tags.slice(0, 3).map((t, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-slate-200 hover:border-sky-400/40 hover:text-white transition-colors">
            #{t}
          </span>
        ))}
        {note.tags.length > 3 && (
          <span className="text-slate-500">+{note.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
};
