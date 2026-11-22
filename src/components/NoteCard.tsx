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
      className={`group relative p-4.5 rounded-2xl transition-all duration-200 cursor-pointer select-none font-sans flex flex-col justify-between min-h-[260px] glass-card ${
        isMultiSelected
          ? '!border-white/45 ring-2 ring-white/25'
          : isSelected
          ? '!border-white/35 ring-1 ring-white/20'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Top Section: Multi-select Checkbox, Clean Full Title, & Context Menu */}
      <div className="space-y-2">
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
                    ? 'bg-white border-white text-[#071124]'
                    : 'border-white/25 bg-white/[0.06] group-hover:border-white/45'
                }`}
              >
                {isMultiSelected && <Check className="w-3 h-3" />}
              </div>
            )}

            <h3 className="font-semibold text-[15px] text-white line-clamp-1 transition-colors tracking-tight">
              <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Context Menu Trigger */}
            {!isSelectionMode && (
              <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Opsi Catatan"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Tempered Glass Context Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-6 w-44 glass-popover rounded-2xl p-1.5 z-50 space-y-0.5 font-sans">
                    {note.isTrash ? (
                      <>
                        {onToggleTrash && (
                          <button
                            onClick={() => {
                              onToggleTrash(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5 q-text-muted" />
                            <span>Pulihkan</span>
                          </button>
                        )}

                        {onDeletePermanently && (
                          <button
                            onClick={() => {
                              onDeletePermanently(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Permanen</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onToggleFavorite && (
                          <button
                            onClick={() => {
                              onToggleFavorite(note.id);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-white fill-current' : 'q-text-muted'}`} />
                            <span>{note.isFavorite ? 'Hapus Favorit' : 'Tandai Favorit'}</span>
                          </button>
                        )}

                        {onDuplicateNote && (
                          <button
                            onClick={() => {
                              onDuplicateNote(note);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <CopyPlus className="w-3.5 h-3.5 q-text-muted" />
                            <span>Duplikat</span>
                          </button>
                        )}

                        {onMoveNote && (
                          <div className="relative">
                            <button
                              onClick={() => setIsMovePopoverOpen(!isMovePopoverOpen)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderInput className="w-3.5 h-3.5 q-text-muted" />
                                <span>Pindah Folder</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 q-text-muted" />
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
                                    className="w-full text-left px-2 py-1 text-xs truncate rounded-lg q-text-secondary hover:q-text-primary hover:bg-white/10"
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
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
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
        <div className="flex items-center gap-1.5 text-[11.5px] text-white/55 font-medium">
          <FolderOpen className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <span className="truncate text-white/70">{note.subject || 'Umum'}</span>

          {note.isFavorite && (
            <Star className="w-3 h-3 text-white fill-current shrink-0 ml-0.5" />
          )}

          <span className="opacity-40">•</span>
          <Clock className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <span className="text-white/55">{formatRelativeTime(note.updatedAt)}</span>
        </div>
      </div>

      {/* Middle Document Preview (Clean Card Surface Hierarchy) */}
      <div className="flex-1 my-3 py-1 overflow-hidden text-left flex flex-col justify-start gap-2">
        {miniBlocks.length === 0 ? (
          <p className="text-[12.5px] text-white/40 italic select-none">
            Belum ada konten catatan.
          </p>
        ) : (
          miniBlocks.slice(0, 3).map((b, i) => {
            if (b.type === 'text') {
              return (
                <p key={i} className="text-[13px] text-white/75 font-normal leading-relaxed line-clamp-3 select-none">
                  <HighlightText text={b.text} query={searchQuery} />
                </p>
              );
            }

            if (b.type === 'mermaid') {
              return (
                <div key={i} className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center gap-2 select-none shrink-0">
                  <GitGraph className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span className="text-[11px] font-medium q-text-primary truncate">Diagram Mermaid</span>
                </div>
              );
            }

            if (b.type === 'attachment') {
              return (
                <div key={i} className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center gap-2 select-none shrink-0">
                  <FileUp className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <div className="overflow-hidden flex-1 leading-tight">
                    <div className="text-[11px] font-medium q-text-primary truncate">{b.name}</div>
                    {b.size && <div className="text-[9.5px] q-text-muted">{b.size}</div>}
                  </div>
                </div>
              );
            }

            if (b.type === 'subpage') {
              return (
                <div key={i} className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center gap-2 select-none shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span className="text-[11px] font-medium q-text-primary truncate">{b.title}</span>
                </div>
              );
            }

            if (b.type === 'code') {
              return (
                <div key={i} className="px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg flex items-center gap-2 font-mono select-none shrink-0">
                  <Code2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span className="text-[10px] q-text-secondary truncate font-mono">{b.code.slice(0, 45) || 'Code Block'}</span>
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Bottom Inline Tags (Monochrome Tempered Glass) */}
      <div className="flex items-center gap-1.5 text-[10px] font-medium overflow-hidden">
        {note.tags.slice(0, 3).map((t, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full glass-control q-text-secondary">
            #{t}
          </span>
        ))}
        {note.tags.length > 3 && (
          <span className="q-text-muted">+{note.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
};
