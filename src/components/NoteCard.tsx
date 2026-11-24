import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Star,
  FolderOpen,
  Clock,
  MoreHorizontal,
  CopyPlus,
  Trash2,
  FolderInput,
  ChevronRight,
  Check,
  Undo2,
  FileText,
  FileUp,
  Code2,
  GitGraph,
  PenTool,
  Table2,
  Sigma,
  Circle,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import type { Note } from '../types/note';
import { HighlightText } from './HighlightText';
import { formatRelativeTime } from '../lib/dateUtils';
import {
  compressImageToWebP,
  getCachedAttachmentUrl,
  isIdbAttachmentUrl,
  resolveAttachmentUrl,
  saveAttachmentBlob,
} from '../lib/storage/attachmentStore';
import {
  CARD_WALLPAPER_PRESETS,
  getDefaultWallpaperForNote,
  resolvePresetWallpaperUrl,
} from '../lib/cardWallpapers';

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
  onUpdateCover?: (note: Note, coverImage: string | undefined) => void;
  allExistingFolders?: string[];
  isSelectionMode?: boolean;
  isMultiSelected?: boolean;
  onToggleMultiSelect?: (id: string) => void;
}

type MiniBlock =
  | { type: 'text'; text: string }
  | { type: 'checklist'; text: string; checked: boolean }
  | { type: 'subpage'; title: string }
  | { type: 'attachment'; name: string; size?: string }
  | { type: 'code'; lang?: string; code: string }
  | { type: 'mermaid'; code: string }
  | { type: 'whiteboard'; title: string }
  | { type: 'collection'; title: string }
  | { type: 'formula'; expr: string };

interface ParsedCardPreview {
  blocks: MiniBlock[];
  coverImageUrl: string | null;
  hasWhiteboard: boolean;
  hasCode: boolean;
  hasTable: boolean;
}

// Soft obsidian atmospheric gradients (deterministic per note ID for curated editorial variety)
const SOFT_COVER_PALETTES = [
  'radial-gradient(120% 100% at 15% 0%, rgba(148, 163, 184, 0.16) 0%, rgba(39, 39, 42, 0.08) 55%, transparent 100%)',
  'radial-gradient(120% 100% at 85% 0%, rgba(125, 211, 252, 0.13) 0%, rgba(56, 189, 248, 0.04) 55%, transparent 100%)',
  'radial-gradient(120% 100% at 20% 0%, rgba(167, 243, 208, 0.12) 0%, rgba(16, 185, 129, 0.03) 55%, transparent 100%)',
  'radial-gradient(120% 100% at 80% 0%, rgba(196, 181, 253, 0.13) 0%, rgba(139, 92, 246, 0.04) 55%, transparent 100%)',
  'radial-gradient(120% 100% at 25% 0%, rgba(253, 230, 138, 0.11) 0%, rgba(245, 158, 11, 0.03) 55%, transparent 100%)',
  'radial-gradient(120% 100% at 75% 0%, rgba(253, 164, 175, 0.12) 0%, rgba(244, 63, 94, 0.03) 55%, transparent 100%)',
];

function getSoftPaletteForNote(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return SOFT_COVER_PALETTES[Math.abs(hash) % SOFT_COVER_PALETTES.length];
}

function parseTextSegmentToMiniBlocks(textSegment: string, outBlocks: MiniBlock[], state: { coverImageUrl: string | null }) {
  const lines = textSegment.split('\n');
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const joined = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) {
      outBlocks.push({ type: 'text', text: joined });
    }
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Markdown image ![alt](url)
    const mdImgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (mdImgMatch) {
      if (!state.coverImageUrl) {
        state.coverImageUrl = mdImgMatch[2];
      }
      continue;
    }

    // Divider lines (---, ***, ..., ===)
    if (/^([-*_=.])\1{2,}$/.test(trimmed)) {
      continue;
    }

    // Display math block $$...$$
    const mathMatch = trimmed.match(/^\$\$([\s\S]+?)\$\$$/);
    if (mathMatch) {
      flushParagraph();
      outBlocks.push({ type: 'formula', expr: mathMatch[1].trim() });
      continue;
    }

    // Checklist item - [ ] / - [x]
    const taskMatch = trimmed.match(/^-\s+\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      flushParagraph();
      const taskText = taskMatch[2]
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/[*~_`]/g, '')
        .trim();
      if (taskText) {
        outBlocks.push({
          type: 'checklist',
          checked: taskMatch[1].toLowerCase() === 'x',
          text: taskText,
        });
      }
      continue;
    }

    // Clean inline markdown text
    const cleanLine = trimmed
      .replace(/^#{1,6}\s+/, '')
      .replace(/^((?:>\s*)+)/, '')
      .replace(/^(?:•|◦|▪|[-*+])\s+/, '')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/[*~_`]/g, '')
      .trim();

    if (cleanLine) {
      paragraphLines.push(cleanLine);
    }
  }

  flushParagraph();
}

function parseNoteToMiniBlocks(rawContent: string): ParsedCardPreview {
  const empty: ParsedCardPreview = {
    blocks: [],
    coverImageUrl: null,
    hasWhiteboard: false,
    hasCode: false,
    hasTable: false,
  };
  if (!rawContent || !rawContent.trim()) return empty;

  const blocks: MiniBlock[] = [];
  const state = { coverImageUrl: null as string | null };
  let hasWhiteboard = false;
  let hasCode = false;
  let hasTable = false;

  const blockRegex = /(:::(?:subpage|attachment|code|mermaid|collection|whiteboard)\{[\s\S]*?:::|```(?:mermaid|[a-zA-Z0-9_-]*)\n[\s\S]*?```)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(rawContent)) !== null) {
    const textSegment = rawContent.slice(lastIndex, match.index).trim();
    if (textSegment) {
      parseTextSegmentToMiniBlocks(textSegment, blocks, state);
    }

    const blockStr = match[0];

    if (blockStr.startsWith(':::subpage')) {
      const titleMatch = blockStr.match(/title="([^"]*)"/);
      const title = titleMatch?.[1]?.trim() || 'Sub-halaman';
      blocks.push({ type: 'subpage', title });
    } else if (blockStr.startsWith(':::attachment')) {
      const nameMatch = blockStr.match(/name="([^"]*)"/);
      const sizeMatch = blockStr.match(/size="([^"]*)"/);
      const isInlineMatch = blockStr.match(/isInline="(true|false)"/i);
      const mimeMatch = blockStr.match(/mime="([^"]*)"/i);
      const urlMatch = blockStr.match(/url="([^"]*)"/);
      const isImg = isInlineMatch?.[1] === 'true' || (mimeMatch?.[1]?.startsWith('image/') ?? false);
      if (isImg && urlMatch?.[1] && !state.coverImageUrl) {
        state.coverImageUrl = urlMatch[1];
      } else {
        const name = nameMatch?.[1] || 'File Attachment';
        const size = sizeMatch?.[1] || '';
        blocks.push({ type: 'attachment', name, size });
      }
    } else if (blockStr.startsWith(':::whiteboard')) {
      hasWhiteboard = true;
      const titleMatch = blockStr.match(/title="([^"]*)"/);
      blocks.push({ type: 'whiteboard', title: titleMatch?.[1]?.trim() || 'Whiteboard' });
    } else if (blockStr.startsWith(':::collection')) {
      hasTable = true;
      const titleMatch = blockStr.match(/title="([^"]*)"/);
      blocks.push({ type: 'collection', title: titleMatch?.[1]?.trim() || 'Tabel & Koleksi' });
    } else if (blockStr.startsWith(':::code')) {
      hasCode = true;
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
      hasCode = true;
      const langMatch = blockStr.match(/^```([a-zA-Z0-9_-]*)\n/);
      const code = blockStr.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/\n?```$/, '');
      blocks.push({ type: 'code', lang: langMatch ? langMatch[1] : 'code', code: code.trim() });
    }

    lastIndex = match.index + blockStr.length;
  }

  const remainingText = rawContent.slice(lastIndex).trim();
  if (remainingText) {
    parseTextSegmentToMiniBlocks(remainingText, blocks, state);
  }

  return {
    blocks,
    coverImageUrl: state.coverImageUrl,
    hasWhiteboard,
    hasCode,
    hasTable,
  };
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
  onUpdateCover,
  allExistingFolders = ['Umum'],
  isSelectionMode = false,
  isMultiSelected = false,
  onToggleMultiSelect = () => {},
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
  const [isCoverPopoverOpen, setIsCoverPopoverOpen] = useState(false);
  const [submenuSide, setSubmenuSide] = useState<'right' | 'left'>('right');
  const menuRef = useRef<HTMLDivElement>(null);
  const coverUploadRef = useRef<HTMLInputElement>(null);

  const openMenuWithSmartSide = (nextOpen: boolean) => {
    if (nextOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setSubmenuSide(window.innerWidth - rect.right < 240 ? 'left' : 'right');
    }
    setIsMenuOpen(nextOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setIsMovePopoverOpen(false);
        setIsCoverPopoverOpen(false);
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

  // Parse chronological mini blocks + soft cover image URL
  const preview = useMemo(() => parseNoteToMiniBlocks(note.content), [note.content]);
  const miniBlocks = preview.blocks;

  // Priority: minimal (off) > explicit note.coverImage (preset or custom) > first inline photo > curated soft landscape wallpaper
  const rawCoverSource = useMemo(() => {
    if (note.coverImage === 'minimal') return null;
    if (note.coverImage) {
      return resolvePresetWallpaperUrl(note.coverImage) || note.coverImage;
    }
    if (preview.coverImageUrl) return preview.coverImageUrl;
    return getDefaultWallpaperForNote(note.id || note.title || 'note').url;
  }, [note.coverImage, note.id, note.title, preview.coverImageUrl]);

  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(() => {
    if (!rawCoverSource) return null;
    if (!isIdbAttachmentUrl(rawCoverSource)) return rawCoverSource;
    return getCachedAttachmentUrl(rawCoverSource) || null;
  });

  useEffect(() => {
    if (!rawCoverSource) {
      setResolvedCoverUrl(null);
      return;
    }
    if (!isIdbAttachmentUrl(rawCoverSource)) {
      setResolvedCoverUrl(rawCoverSource);
      return;
    }
    const cached = getCachedAttachmentUrl(rawCoverSource);
    if (cached) {
      setResolvedCoverUrl(cached);
      return;
    }
    let cancelled = false;
    resolveAttachmentUrl(rawCoverSource).then((resolved) => {
      if (!cancelled && resolved) {
        setResolvedCoverUrl(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [rawCoverSource]);

  const handleCustomCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/') || !onUpdateCover) return;
    try {
      const compressed = await compressImageToWebP(file);
      const blobId = `cover-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const idbUrl = await saveAttachmentBlob(
        blobId,
        compressed.blob,
        file.name,
        compressed.mime || file.type || 'image/webp'
      );
      onUpdateCover(note, idbUrl);
      setIsCoverPopoverOpen(false);
      setIsMenuOpen(false);
    } catch {
      // ignore upload failures
    }
  };

  const softPalette = useMemo(() => getSoftPaletteForNote(note.id || note.title), [note.id, note.title]);

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSelectionMode) {
          openMenuWithSmartSide(true);
        }
      }}
      className={`group relative rounded-[22px] transition-all duration-300 cursor-pointer select-none font-sans flex flex-col justify-between min-h-[272px] glass-card ${
        isMenuOpen ? 'z-40' : ''
      } ${
        isMultiSelected
          ? '!border-white/45 ring-2 ring-white/25'
          : isSelected
          ? '!border-white/35 ring-1 ring-white/20'
          : 'hover:-translate-y-1'
      }`}
    >
      {/* Top Soft Visual Cover Banner (Real Image Soft-Fade OR Atmospheric Tempered Mesh) */}
      <div className="relative h-20 w-full shrink-0 border-b border-white/[0.06]">
        <div className="absolute inset-0 rounded-t-[21px] overflow-hidden pointer-events-none">
          {resolvedCoverUrl ? (
            <>
              <img
                src={resolvedCoverUrl}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover opacity-65 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-[#121215]/45 to-[#141417]/95" />
            </>
          ) : (
            <div
              className="w-full h-full relative"
              style={{ background: softPalette }}
            >
              {preview.hasWhiteboard && (
                <div
                  className="absolute inset-0 opacity-35"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#141417]/80" />
              <div className="absolute left-4 bottom-2.5 flex items-center gap-1.5 text-white/40 group-hover:text-white/65 transition-colors">
                {preview.hasWhiteboard ? (
                  <PenTool className="w-3.5 h-3.5" />
                ) : preview.hasTable ? (
                  <Table2 className="w-3.5 h-3.5" />
                ) : preview.hasCode ? (
                  <Code2 className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 opacity-70" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top Right Overlay: Star & Context Menu Trigger (outside overflow-hidden so popover never clips) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-30">
          {note.isFavorite && (
            <div className="w-6 h-6 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-current" />
            </div>
          )}
          {!isSelectionMode && (
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => openMenuWithSmartSide(!isMenuOpen)}
                className="w-6 h-6 rounded-full bg-black/45 backdrop-blur-md border border-white/15 q-text-muted hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Opsi Catatan"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Tempered Glass Context Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 top-7 w-44 glass-popover rounded-2xl p-1.5 z-50 space-y-0.5 font-sans">
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
                            onClick={() => {
                              setIsCoverPopoverOpen(false);
                              setIsMovePopoverOpen(!isMovePopoverOpen);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FolderInput className="w-3.5 h-3.5 q-text-muted" />
                              <span>Pindah Folder</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 q-text-muted" />
                          </button>

                          {isMovePopoverOpen && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 w-40 glass-popover rounded-2xl p-1.5 z-50 max-h-36 overflow-y-auto space-y-0.5 font-sans ${
                                submenuSide === 'right' ? 'left-full ml-1.5' : 'right-full mr-1.5'
                              }`}
                            >
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

                      {onUpdateCover && (
                        <div className="relative">
                          <input
                            ref={coverUploadRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleCustomCoverFile}
                            className="hidden"
                          />
                          <button
                            onClick={() => {
                              setIsMovePopoverOpen(false);
                              setIsCoverPopoverOpen(!isCoverPopoverOpen);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-3.5 h-3.5 q-text-muted" />
                              <span>Wallpaper Card</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 q-text-muted" />
                          </button>

                          {isCoverPopoverOpen && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 w-52 glass-popover rounded-2xl p-2 z-50 space-y-2 font-sans ${
                                submenuSide === 'right' ? 'left-full ml-1.5' : 'right-full mr-1.5'
                              }`}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45 px-1">
                                Pilih Wallpaper
                              </p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {CARD_WALLPAPER_PRESETS.map((wp) => {
                                  const active = note.coverImage === `preset:${wp.id}`;
                                  return (
                                    <button
                                      key={wp.id}
                                      type="button"
                                      onClick={() => {
                                        onUpdateCover(note, `preset:${wp.id}`);
                                        setIsCoverPopoverOpen(false);
                                        setIsMenuOpen(false);
                                      }}
                                      className={`relative h-10 rounded-lg overflow-hidden border transition-all ${
                                        active ? 'border-white ring-1 ring-white/40' : 'border-white/15 hover:border-white/40'
                                      }`}
                                      title={wp.name}
                                    >
                                      <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-1 pt-1 border-t border-white/[0.08]">
                                <button
                                  type="button"
                                  onClick={() => coverUploadRef.current?.click()}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[11px] font-semibold text-white/85 transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Foto</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateCover(note, undefined);
                                    setIsCoverPopoverOpen(false);
                                    setIsMenuOpen(false);
                                  }}
                                  className="py-1.5 px-2.5 rounded-lg hover:bg-white/10 text-[11px] font-medium text-white/60 hover:text-white transition-colors"
                                >
                                  Auto
                                </button>
                              </div>
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

        {/* Multi-selection Checkbox Indicator (top-left of cover) */}
        {isSelectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleMultiSelect(note.id);
            }}
            className={`absolute top-2.5 left-2.5 z-20 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
              isMultiSelected
                ? 'bg-white border-white text-[#09090b]'
                : 'border-white/35 bg-black/45 backdrop-blur-md group-hover:border-white/60'
            }`}
          >
            {isMultiSelected && <Check className="w-3 h-3" />}
          </div>
        )}
      </div>

      {/* Main Card Body */}
      <div className="p-4 pt-3 flex-1 flex flex-col justify-between">
        {/* Title & Metadata */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-[15px] text-white line-clamp-1 transition-colors tracking-tight">
            <HighlightText text={note.title || 'Catatan Tanpa Judul'} query={searchQuery} />
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
            <FolderOpen className="w-3 h-3 text-white/45 shrink-0" />
            <span className="truncate text-white/65">{note.subject || 'Umum'}</span>
            <span className="opacity-40">•</span>
            <Clock className="w-3 h-3 text-white/45 shrink-0" />
            <span>{formatRelativeTime(note.updatedAt)}</span>
          </div>
        </div>

        {/* Middle Document Preview (Clean Pills & Rich Text Snippets) */}
        <div className="flex-1 my-3 overflow-hidden text-left flex flex-col justify-start gap-1.5">
          {miniBlocks.length === 0 ? (
            <p className="text-[12px] text-white/30 select-none">
              Catatan kosong — klik untuk menulis
            </p>
          ) : (
            miniBlocks.slice(0, 3).map((b, i) => {
              if (b.type === 'text') {
                return (
                  <p key={i} className="text-[12.5px] text-white/70 font-normal leading-relaxed line-clamp-2 select-none">
                    <HighlightText text={b.text} query={searchQuery} />
                  </p>
                );
              }

              if (b.type === 'checklist') {
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[12px] text-white/65 select-none">
                    {b.checked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-white/35 shrink-0" />
                    )}
                    <span className={`truncate ${b.checked ? 'line-through text-white/35' : ''}`}>
                      {b.text}
                    </span>
                  </div>
                );
              }

              if (b.type === 'whiteboard') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 select-none shrink-0">
                    <PenTool className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[11px] font-medium text-white/80 truncate">{b.title}</span>
                  </div>
                );
              }

              if (b.type === 'collection') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 select-none shrink-0">
                    <Table2 className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[11px] font-medium text-white/80 truncate">{b.title}</span>
                  </div>
                );
              }

              if (b.type === 'formula') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 font-mono select-none shrink-0">
                    <Sigma className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[10.5px] text-white/70 truncate">{b.expr}</span>
                  </div>
                );
              }

              if (b.type === 'mermaid') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 select-none shrink-0">
                    <GitGraph className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[11px] font-medium text-white/80 truncate">Diagram Mermaid</span>
                  </div>
                );
              }

              if (b.type === 'attachment') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 select-none shrink-0">
                    <FileUp className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <div className="overflow-hidden flex-1 flex items-center justify-between gap-2 leading-tight">
                      <span className="text-[11px] font-medium text-white/80 truncate">{b.name}</span>
                      {b.size && <span className="text-[9.5px] text-white/40 shrink-0">{b.size}</span>}
                    </div>
                  </div>
                );
              }

              if (b.type === 'subpage') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 select-none shrink-0">
                    <FileText className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[11px] font-medium text-white/80 truncate">{b.title}</span>
                  </div>
                );
              }

              if (b.type === 'code') {
                return (
                  <div key={i} className="px-2.5 py-1.5 bg-white/[0.045] border border-white/[0.09] rounded-xl flex items-center gap-2 font-mono select-none shrink-0">
                    <Code2 className="w-3.5 h-3.5 text-white/65 shrink-0" />
                    <span className="text-[10px] text-white/70 truncate font-mono">{b.code.slice(0, 42) || 'Code Block'}</span>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Bottom Inline Tags */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium overflow-hidden pt-1">
          {note.tags.slice(0, 3).map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60">
              #{t}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-white/40">+{note.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
};
