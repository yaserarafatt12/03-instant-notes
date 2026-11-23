import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  Trash2,
  X,
  FileDown,
  Folder,
  ListTree,
  Type,
  Code2,
  Table,
  Image as ImageIcon,
  Layout,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Sigma,
  Eraser,
  FileUp,
  GitGraph,
  LayoutGrid,
  FileText,
  AlertCircle,
  Download,
  Eye,
  GripVertical,
  Highlighter,
  History,
  MoreHorizontal,
  Music,
  Video,
  LayoutList,
  Square,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Home,
  ChevronRight,
  Undo2,
  Redo2,
  Expand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  FilePlus,
} from 'lucide-react';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markdown';
import {
  NOTION_COLORS,
  escapeCodeHtml,
  markdownToHtml,
  htmlToMarkdown,
} from '../lib/editor/markdownCodec';
import {
  parsePastedHtmlToMarkdown,
  parsePastedTextToChronoBlocks,
} from '../lib/editor/clipboardParser';
import { classifyTextBlock, isRtlText } from '../lib/editor/blockClassifier';
export { NOTION_COLORS };

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  logLevel: 'error',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#162848',
    primaryBorderColor: 'rgba(255, 255, 255, 0.26)',
    primaryTextColor: '#ffffff',
    secondaryColor: '#11213D',
    secondaryBorderColor: 'rgba(255, 255, 255, 0.20)',
    secondaryTextColor: '#ffffff',
    tertiaryColor: '#0E1C35',
    lineColor: 'rgba(255, 255, 255, 0.65)',
    textColor: '#ffffff',
    mainBkg: '#162848',
    nodeBorder: 'rgba(255, 255, 255, 0.26)',
    clusterBkg: 'rgba(255, 255, 255, 0.04)',
    clusterBorder: 'rgba(255, 255, 255, 0.16)',
    actorBkg: '#162848',
    actorBorder: 'rgba(255, 255, 255, 0.26)',
    actorTextColor: '#ffffff',
    actorLineColor: 'rgba(255, 255, 255, 0.35)',
    signalColor: 'rgba(255, 255, 255, 0.85)',
    signalTextColor: '#ffffff',
    labelBoxBkgColor: '#162848',
    labelBoxBorderColor: 'rgba(255, 255, 255, 0.22)',
    labelTextColor: '#ffffff',
    noteBkgColor: '#192E52',
    noteBorderColor: 'rgba(255, 255, 255, 0.22)',
    noteTextColor: '#ffffff',
  },
});
import type { Note, CollectionData } from '../types/note';
import { CollectionBlockRenderer, createDefaultCollection } from './CollectionBlockRenderer';
import { exportNoteAsTXT } from '../lib/storage/db';
import { saveVersionLog } from '../lib/storage/versionHistory';
import { VersionHistoryModal } from './VersionHistoryModal';
import { DashboardEmptyEditor } from './EmptyState';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface NoteEditorProps {
  note: Note | null;
  allExistingTags?: string[];
  onSave: (updated: Note) => void;
  onClose: (updated: Note) => void;
  onToggleFavorite: (id: string) => void;
  onToggleTrash: (id: string) => void;
  onDuplicate?: (note: Note) => void;
  isFocusMode?: boolean;
  onNewNote?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onSubjectChange?: (subject: string | null) => void;
  onFilterChange?: (filter: any) => void;
}

type RightPanelTab = 'insert' | 'format' | 'style' | 'info';

interface SubPage {
  id: string;
  title: string;
  content: string;
  layout?: 'small' | 'regular' | 'card';
}

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  mime: string;
  url: string;
  isInlineImage?: boolean;
  layout?: 'small' | 'regular' | 'card';
  width?: number;
}

interface CodeBlockData {
  id: string;
  lang: string;
  code: string;
}

interface MermaidBlockData {
  id: string;
  code: string;
}

type ChronoBlock =
  | { type: 'text'; id: string; content: string }
  | { type: 'subpage'; id: string; data: SubPage }
  | { type: 'attachment'; id: string; data: FileAttachment }
  | { type: 'code'; id: string; data: CodeBlockData }
  | { type: 'mermaid'; id: string; data: MermaidBlockData }
  | { type: 'collection'; id: string; data: CollectionData };

// Global In-Memory Attachment Data Store
const globalAttachmentMap = new Map<string, FileAttachment>();

// Monochrome Tempered Glass File Icon Badge
const CraftFileTypeBadge: React.FC<{ mime: string; name: string }> = ({ mime, name }) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  let label = 'FILE';
  if (mime.includes('pdf') || ext === 'pdf') {
    label = 'PDF';
  } else if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet')) {
    label = 'XLS';
  } else if (['docx', 'doc'].includes(ext) || mime.includes('word')) {
    label = 'DOC';
  } else if (ext === 'txt') {
    label = 'TXT';
  } else if (['zip', 'rar', '7z'].includes(ext)) {
    label = 'ZIP';
  } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mime.startsWith('audio/')) {
    label = 'MP3';
  } else if (['mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) {
    label = 'MP4';
  } else if (mime.startsWith('image/')) {
    label = 'IMG';
  } else {
    label = ext.slice(0, 4).toUpperCase() || 'FILE';
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.20)] flex flex-col items-center justify-center shrink-0 select-none">
      <FileText className="w-3.5 h-3.5 text-white/85" />
      <span className="text-[7px] font-bold uppercase tracking-wider text-white/60 leading-none mt-0.5">
        {label}
      </span>
    </div>
  );
};

// Monochrome Tempered Glass Page Document Badge
const CraftPageBadge: React.FC = () => (
  <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.20)] flex items-center justify-center shrink-0 select-none">
    <FileText className="w-4 h-4 text-white/90 stroke-[2]" />
  </div>
);

// Monochrome Tempered Glass Large File Icon (For Card Mode)
const LargeCraftFileTypeBadge: React.FC<{ mime: string; name: string }> = ({ mime, name }) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  let label = 'FILE';
  if (mime.includes('pdf') || ext === 'pdf') {
    label = 'PDF';
  } else if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet')) {
    label = 'XLS';
  } else if (['docx', 'doc'].includes(ext) || mime.includes('word')) {
    label = 'DOC';
  } else if (ext === 'txt') {
    label = 'TXT';
  } else if (['zip', 'rar', '7z'].includes(ext)) {
    label = 'ZIP';
  } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mime.startsWith('audio/')) {
    label = 'MP3';
  } else if (['mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) {
    label = 'MP4';
  } else if (mime.startsWith('image/')) {
    label = 'IMG';
  } else {
    label = ext.slice(0, 4).toUpperCase() || 'FILE';
  }

  return (
    <div className="w-24 h-28 rounded-2xl bg-white/[0.08] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_28px_rgba(0,0,0,0.3)] p-2.5 flex flex-col items-center justify-between shrink-0 select-none">
      <div className="w-full flex-1 flex items-center justify-center">
        <FileText className="w-9 h-9 text-white/85" />
      </div>
      <div className="w-full py-1 rounded-lg bg-white/[0.10] border border-white/[0.14] text-white/90 text-[10px] font-bold text-center uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

export interface ColorPreset {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  dotColor: string;
}

function encodeSubPageContent(str: string): string {
  if (!str) return '';
  try {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binString);
  } catch {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return encodeURIComponent(str);
    }
  }
}

function decodeSubPageContent(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  try {
    const binString = atob(trimmed);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return decodeURIComponent(escape(atob(trimmed)));
    } catch {
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    }
  }
}

function escapeAttr(str: string): string {
  return (str || '').replace(/"/g, '&quot;');
}

function unescapeAttr(str: string): string {
  return (str || '').replace(/&quot;/g, '"');
}



interface DropIndicatorProps {
  label?: string;
  position?: 'before' | 'after';
}

const DropIndicatorLine: React.FC<DropIndicatorProps> = ({ position = 'before' }) => (
  <div
    className={`absolute left-0 right-0 z-40 flex items-center pointer-events-none ${
      position === 'before' ? '-top-1' : '-bottom-1'
    }`}
  >
    <div className="w-full h-[2.5px] rounded-full bg-gradient-to-r from-white/35 via-white/95 to-white/35 shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
  </div>
);

// Craft Docs Style Rename Icon (Matching User Screenshot: Box with A and Cursor Beam)
const CraftRenameIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={`${className} shrink-0 text-zinc-400`}
  >
    <rect x="2.5" y="4.5" width="19" height="15" rx="4" strokeWidth="1.8" />
    <path d="M7 15l2.2-6h1.2L12.6 15M7.9 12.8h3.9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16.5" y1="6.5" x2="16.5" y2="17.5" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="6.5" x2="18" y2="6.5" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="17.5" x2="18" y2="17.5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface RenameAttachmentModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

const RenameAttachmentModal: React.FC<RenameAttachmentModalProps> = ({
  isOpen,
  initialName,
  onClose,
  onSave,
}) => {
  const [val, setVal] = useState(initialName);

  useEffect(() => {
    setVal(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSave(val.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150 select-none"
      style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold q-text-primary tracking-tight flex items-center gap-2">
            <CraftRenameIcon className="w-4 h-4 q-text-muted" />
            <span>Ubah Nama Lampiran</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-2 glass-input rounded-xl text-xs font-medium q-text-primary placeholder:text-slate-500 focus:outline-none transition-colors"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 glass-control q-text-primary text-xs font-semibold rounded-full"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 glass-btn-primary text-xs font-semibold rounded-full"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Global in-memory cache for rendered Mermaid SVGs (Instant 0ms retrieval)
const mermaidSvgCache = new Map<string, string>();

// Live Interactive Mermaid Diagram Renderer with Debounced Async Pipeline & Memory Cache
const MermaidRenderer: React.FC<{
  code: string;
  isFullscreen?: boolean;
  debounceMs?: number;
}> = ({ code, isFullscreen, debounceMs = 350 }) => {
  const trimmed = useMemo(() => (code || '').trim(), [code]);
  const [svgContent, setSvgContent] = useState<string>(() => mermaidSvgCache.get(trimmed) || '');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!trimmed) {
      setSvgContent('');
      setError(null);
      return;
    }

    // 1. Instant Cache Hit: 0ms execution without triggering mermaid.render!
    if (mermaidSvgCache.has(trimmed)) {
      setSvgContent(mermaidSvgCache.get(trimmed)!);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsRendering(true);

    // 2. Debounce complex diagram rendering to prevent main thread blocking while typing
    const timer = setTimeout(async () => {
      try {
        const uniqueId = 'mmd-' + Math.random().toString(36).slice(2, 9);
        const { svg } = await mermaid.render(uniqueId, trimmed);

        // Save to cache
        mermaidSvgCache.set(trimmed, svg);

        // Prevent cache from growing unboundedly (LRU cap at 100 diagrams)
        if (mermaidSvgCache.size > 100) {
          const firstKey = mermaidSvgCache.keys().next().value;
          if (firstKey) mermaidSvgCache.delete(firstKey);
        }

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Syntax Mermaid Diagram tidak valid.');
          setIsRendering(false);
        }
      }
    }, debounceMs);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [trimmed, debounceMs]);

  if (error) {
    return (
      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-mono space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Format Mermaid Diagram Error</span>
        </p>
        <p className="text-[11px] opacity-80 line-clamp-2">{error}</p>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 text-white/55 text-xs italic">
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>Memuat Mermaid Diagram...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex justify-center items-center overflow-x-auto relative w-full ${
        isFullscreen
          ? 'h-full p-6 [&>svg]:w-full [&>svg]:max-w-5xl [&>svg]:h-auto [&>svg]:max-h-[75vh]'
          : 'p-3 flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto'
      }`}
    >
      <div dangerouslySetInnerHTML={{ __html: svgContent }} className="mermaid-glass-svg w-full flex items-center justify-center" />
      {isRendering && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 glass-control px-2.5 py-0.5 rounded-full text-[10px] text-white/85 font-mono">
          <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Rendering...</span>
        </div>
      )}
    </div>
  );
};

// Popular languages for Code Block dropdown
const POPULAR_LANGUAGES = [
  { id: 'auto', label: 'Auto Detect' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'swift', label: 'Swift' },
];

const PRISM_LANG_MAP: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  markup: 'markup',
  css: 'css',
  json: 'json',
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  md: 'markdown',
  markdown: 'markdown',
  java: 'java',
  go: 'go',
  rust: 'rust',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
};

// Line-Numbered Editor Component with PrismJS Syntax Highlighting & VS-Code Keyboard Navigation
const LineNumberedEditor: React.FC<{
  value: string;
  lang?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
  onDeleteIfEmpty?: () => void;
}> = ({ value, lang, onChange, placeholder, onBlur, autoFocus, onDeleteIfEmpty }) => {
  const lines = value.split('\n');
  const lineCount = Math.max(1, lines.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const highlightedHtml = useMemo(() => {
    if (!value) return '';
    const key = PRISM_LANG_MAP[(lang || '').toLowerCase()] || 'javascript';
    const grammar = Prism.languages[key];
    if (grammar) {
      try {
        return Prism.highlight(value, grammar, key);
      } catch {
        return escapeCodeHtml(value);
      }
    }
    return escapeCodeHtml(value);
  }, [value, lang]);

  useEffect(() => {
    if (autoFocus) {
      const focusTextarea = () => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      };
      focusTextarea();
      const t1 = setTimeout(focusTextarea, 20);
      const t2 = setTimeout(focusTextarea, 80);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [autoFocus]);

  return (
    <div
      onClick={() => textareaRef.current?.focus({ preventScroll: true })}
      className="flex w-full bg-[#0b1526]/75 hover:bg-[#0d1a30]/85 rounded-xl border border-white/[0.12] hover:border-white/20 overflow-hidden font-mono text-xs shadow-md relative group/editor cursor-text min-h-[56px] transition-colors"
    >
      {/* Left Line Numbers Column with Clean Vertical Divider */}
      <div className="py-3 px-3 bg-transparent border-r border-white/10 text-zinc-500/80 select-none text-right font-mono text-xs leading-relaxed shrink-0 min-w-[34px]">
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Synchronized PrismJS Highlight Layer + Transparent Interactive Textarea */}
      <div className="flex-1 relative overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          style={{ tabSize: 2 }}
          className="pointer-events-none m-0 p-3 font-mono text-xs leading-relaxed whitespace-pre overflow-hidden text-zinc-100 min-h-[48px] block"
          dangerouslySetInnerHTML={{
            __html: value ? highlightedHtml + (value.endsWith('\n') ? '\n ' : '') : ' ',
          }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (preRef.current) {
              preRef.current.scrollLeft = e.currentTarget.scrollLeft;
              preRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const val = target.value;
              const nextVal = val.substring(0, start) + '  ' + val.substring(end);
              onChange(nextVal);
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              });
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const val = target.value;
              const lineBefore = val.substring(0, start).split('\n').pop() || '';
              const indentMatch = lineBefore.match(/^\s*/);
              const indent = indentMatch ? indentMatch[0] : '';
              const insertStr = '\n' + indent;
              const nextVal = val.substring(0, start) + insertStr + val.substring(target.selectionEnd);
              onChange(nextVal);
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + insertStr.length;
              });
              return;
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && !value.trim() && onDeleteIfEmpty) {
              e.preventDefault();
              onDeleteIfEmpty();
              return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
              e.stopPropagation();
            }
          }}
          placeholder={placeholder || 'Tulis atau tempel kode di sini...'}
          spellCheck={false}
          rows={lineCount}
          style={{ tabSize: 2 }}
          className="absolute inset-0 w-full h-full p-3 m-0 bg-transparent font-mono text-xs text-transparent caret-white focus:outline-none resize-none leading-relaxed whitespace-pre overflow-x-auto overflow-y-hidden block selection:bg-white/20 selection:text-transparent placeholder:text-zinc-500 placeholder:italic border-0 min-h-[48px]"
        />
      </div>
    </div>
  );
};

// Ultra-Clean Craft Code Block Component with Dynamic Auto-Detection
const CodeBlockRenderer: React.FC<{
  block: ChronoBlock & { type: 'code' };
  idx: number;
  isDragging: boolean;
  dropIndicatorState: { index: number; position: 'before' | 'after'; label?: string } | null;
  isAllSelected: boolean;
  isSelected?: boolean;
  onSelectBlock?: (shiftKey: boolean) => void;
  onUpdateCode: (codeId: string, newLang: string, newCode: string) => void;
  onDeleteBlock: (codeId: string) => void;
  onDragStart: (idx: number, e: React.DragEvent) => void;
  onDragOver: (idx: number, e: React.DragEvent) => void;
  onDrop: (idx: number, e?: React.DragEvent) => void;
  onDragEnd: () => void;
}> = ({
  block,
  idx,
  isDragging,
  dropIndicatorState,
  isAllSelected,
  isSelected,
  onSelectBlock,
  onUpdateCode,
  onDeleteBlock,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [localCode, setLocalCode] = useState(() => {
    const c = block.data.code || '';
    if (c.trim() === '// Tulis kode di sini...' || c.trim() === '// Tulis atau tempel kode di sini...') {
      return '';
    }
    return c;
  });
  const [selectedLang, setSelectedLang] = useState<string | null>(() => {
    if (block.data.lang && block.data.lang !== 'code' && block.data.lang !== 'auto' && block.data.lang !== 'typescript') {
      return block.data.lang;
    }
    return null;
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = block.data.code || '';
    if (c.trim() === '// Tulis kode di sini...' || c.trim() === '// Tulis atau tempel kode di sini...') {
      setLocalCode('');
    } else {
      setLocalCode(c);
    }
  }, [block.data.code]);

  // Dynamic Real-time Auto-detect language
  const detectedLang = useMemo(() => {
    if (selectedLang && selectedLang !== 'auto') return selectedLang.toUpperCase();
    const c = localCode.trim();
    if (!c) return 'AUTO';
    if (c.startsWith('<!') || c.startsWith('<html') || (c.startsWith('<') && c.includes('</'))) return 'HTML';
    if (/^(import|export|interface|type|const|let|var|function|class\s+\w+)\s/m.test(c)) return 'JAVASCRIPT';
    if (/^(def|class|import|from)\s/m.test(c) && (c.includes(':') || c.includes('print('))) return 'PYTHON';
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(c)) return 'SQL';
    if (c.startsWith('{') || c.startsWith('[')) return 'JSON';
    if (/^(\.|\#|[a-z0-9_-]+)\s*\{[\s\S]*?\}/m.test(c)) return 'CSS';
    if (/^(curl|npm|yarn|pnpm|git|cd|ls|mkdir|docker|echo)\s/m.test(c)) return 'BASH';
    return 'CODE';
  }, [localCode, selectedLang]);

  const handleCodeChange = (val: string) => {
    setLocalCode(val);
    const langToSave = selectedLang && selectedLang !== 'auto' ? selectedLang : 'auto';
    onUpdateCode(block.data.id, langToSave, val);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group/block relative transition-all my-2 w-full ${isDragging ? 'opacity-30 scale-[0.98]' : ''}`}
      onDragOver={(e) => onDragOver(idx, e)}
      onDrop={(e) => onDrop(idx, e)}
    >
      {dropIndicatorState?.index === idx && (
        <DropIndicatorLine
          position={dropIndicatorState.position}
          label={dropIndicatorState.label}
        />
      )}

      {/* Drag Grip Handle */}
      <div
        draggable
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(e.shiftKey);
        }}
        onDragStart={(e) => onDragStart(idx, e)}
        onDragEnd={onDragEnd}
        className="absolute -left-7 top-2 w-6 h-6 text-white/40 group-hover/block:text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover/block:opacity-100 transition-all z-10 hover:bg-white/10 rounded-lg flex items-center justify-center"
        title="Klik untuk seleksi / geser Code Block"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div
        data-code-id={block.data.id}
        className={`relative group/codecard rounded-xl transition-all ${
        isSelected
          ? 'ring-1 ring-white/40 border border-white/40 shadow-md'
          : isAllSelected
          ? 'ring-1 ring-white/30 border border-white/30'
          : 'border border-transparent'
      }`}>
        {/* Minimal Overlay Action Toolbar (Appears Top Right on Hover - Copy & Delete & Auto Lang Badge) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover/codecard:opacity-100 transition-opacity select-none">
          {/* Language Selector Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLangMenuOpen(!isLangMenuOpen);
              }}
              className="text-[10px] font-semibold text-zinc-300 hover:text-white glass-control px-2 py-1 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
              title="Pilih Bahasa Pemrograman"
            >
              <span>{detectedLang}</span>
              <ChevronRight className={`w-3 h-3 text-zinc-400 transition-transform ${isLangMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Language Popover Dropdown */}
            {isLangMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 w-36 max-h-56 glass-popover rounded-xl overflow-y-auto py-1 text-xs z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {POPULAR_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      const nextLang = l.id === 'auto' ? null : l.id;
                      setSelectedLang(nextLang);
                      onUpdateCode(block.data.id, nextLang || 'auto', localCode);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-between ${
                      (selectedLang === l.id || (!selectedLang && l.id === 'auto')) ? 'text-white font-bold bg-white/[0.12]' : 'text-zinc-300'
                    }`}
                  >
                    <span>{l.label}</span>
                    {(selectedLang === l.id || (!selectedLang && l.id === 'auto')) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="p-1 glass-control rounded-lg text-zinc-400 hover:text-white transition-all shadow-xs"
            title="Copy Kode"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDeleteBlock(block.data.id)}
            className="p-1 glass-control hover:bg-rose-500/20 hover:border-rose-500/30 rounded-lg text-zinc-400 hover:text-rose-400 transition-all shadow-xs"
            title="Hapus Code Block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <LineNumberedEditor
          value={localCode}
          lang={detectedLang.toLowerCase()}
          onChange={handleCodeChange}
          onDeleteIfEmpty={() => onDeleteBlock(block.data.id)}
          placeholder="Tulis atau tempel kode di sini..."
          autoFocus={!localCode || isSelected}
        />
      </div>
    </div>
  );
};

// Craft Mermaid Diagram Component with 1-Click Code/Preview Switcher & Fullscreen Maximize
const MermaidBlockRenderer: React.FC<{
  block: ChronoBlock & { type: 'mermaid' };
  idx: number;
  isDragging: boolean;
  dropIndicatorState: { index: number; position: 'before' | 'after'; label?: string } | null;
  isAllSelected: boolean;
  isSelected?: boolean;
  onSelectBlock?: (shiftKey: boolean) => void;
  onUpdateMermaid: (mermaidId: string, newCode: string) => void;
  onDeleteBlock: (mermaidId: string) => void;
  onDragStart: (idx: number, e: React.DragEvent) => void;
  onDragOver: (idx: number, e: React.DragEvent) => void;
  onDrop: (idx: number, e?: React.DragEvent) => void;
  onDragEnd: () => void;
}> = ({
  block,
  idx,
  isDragging,
  dropIndicatorState,
  isAllSelected,
  isSelected,
  onSelectBlock,
  onUpdateMermaid,
  onDeleteBlock,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>(block.data.code ? 'preview' : 'code');
  const [localCode, setLocalCode] = useState(block.data.code || '');
  const [isMaximized, setIsMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalCode(block.data.code || '');
    if (!block.data.code) setViewMode('code');
  }, [block.data.code]);

  const handleCodeChange = (val: string) => {
    setLocalCode(val);
    onUpdateMermaid(block.data.id, val);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className={`group/block relative transition-all my-3 w-full ${isDragging ? 'opacity-30 scale-[0.98]' : ''}`}
        onDragOver={(e) => onDragOver(idx, e)}
        onDrop={(e) => onDrop(idx, e)}
      >
        {dropIndicatorState?.index === idx && (
          <DropIndicatorLine
            position={dropIndicatorState.position}
            label={dropIndicatorState.label}
          />
        )}

        {/* Drag Grip Handle */}
        <div
          draggable
          onClick={(e) => {
            e.stopPropagation();
            onSelectBlock?.(e.shiftKey);
          }}
          onDragStart={(e) => onDragStart(idx, e)}
          onDragEnd={onDragEnd}
          className="absolute -left-7 top-2 w-6 h-6 text-white/40 group-hover/block:text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover/block:opacity-100 transition-all z-10 hover:bg-white/10 rounded-lg flex items-center justify-center"
          title="Klik untuk seleksi / geser Mermaid Diagram"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div
          data-mmd-id={block.data.id}
          className={`relative group/mmdcard rounded-2xl glass-card transition-all overflow-hidden ${
          isSelected
            ? 'ring-1 ring-white/45 !border-white/40 bg-white/[0.08]'
            : isAllSelected
            ? 'ring-1 ring-white/30 !border-white/30'
            : ''
        }`}>
          {/* Seamless Top Toolbar */}
          <div className="flex items-center justify-between p-2.5 select-none gap-2">
            {/* Left: iOS 26 Liquid Glass View Mode Toggle (Preview vs Code) */}
            <div onClick={(e) => e.stopPropagation()}>
              <LiquidSegmentedControl
                size="xs"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'preview', icon: <Eye className="w-3 h-3" />, label: 'Preview', title: 'Lihat Tampilan Diagram' },
                  { value: 'code', icon: <Code2 className="w-3 h-3" />, label: 'Code', title: 'Edit Kode Diagram' },
                ]}
              />
            </div>

            {/* Right: Action Buttons (Maximize, Copy, Delete) */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized(true);
                  setZoomLevel(1);
                }}
                className="p-1.5 glass-control rounded-lg"
                title="Perbesar Layar Penuh"
              >
                <Expand className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleCopy}
                className="p-1.5 glass-control rounded-lg"
                title="Salin Kode Mermaid"
              >
                {copied ? <Check className="w-3.5 h-3.5 q-text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.data.id);
                }}
                className="p-1.5 glass-control hover:text-rose-400 hover:border-rose-400/35 rounded-lg"
                title="Hapus Mermaid Diagram"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content according to viewMode */}
          {viewMode === 'code' && (
            <div className="p-2 pt-0">
              <LineNumberedEditor
                value={localCode}
                lang="markdown"
                onChange={handleCodeChange}
                onDeleteIfEmpty={() => onDeleteBlock(block.data.id)}
                placeholder="graph TD;\n  A[Mulai] --> B[Proses];\n  B --> C[Selesai];"
                autoFocus
              />
            </div>
          )}

          {viewMode === 'preview' && (
            <div
              onClick={() => onSelectBlock?.(false)}
              className="p-4 pt-1 flex items-center justify-center min-h-[140px] overflow-x-auto bg-transparent"
            >
              <MermaidRenderer code={localCode} />
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN MAXIMIZE MODAL OVERLAY */}
      {isMaximized && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsMaximized(false)}
        >
          {/* Modal Top Bar */}
          <div
            className="flex items-center justify-between pb-4 border-b border-white/10 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 glass-control rounded-lg text-white">
                <GitGraph className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mermaid Diagram (Layar Penuh)</h3>
                <p className="text-[11px] text-zinc-400">Tampilan maksimal & beresolusi tinggi</p>
              </div>
            </div>

            {/* Zoom Controls & Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center glass-control rounded-xl p-1 gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 text-zinc-300 font-bold min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.2))}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset Zoom (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 glass-control rounded-xl text-xs font-semibold text-zinc-200 hover:text-white transition-all"
                title="Salin Kode"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
              </button>

              <button
                onClick={() => setIsMaximized(false)}
                className="p-2 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Canvas Area with Zoomable SVG */}
          <div
            className="flex-1 flex items-center justify-center overflow-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
              className="origin-center w-full max-w-6xl min-h-[500px] flex items-center justify-center p-6 glass-panel rounded-2xl overflow-hidden"
            >
              <MermaidRenderer code={localCode} isFullscreen />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface RichTextBlockProps {
  id?: string;
  content: string;
  className?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelect?: () => void;
  editorRef?: (el: HTMLElement | null) => void;
  onInsertImageBlock?: (blockMarkdown: string) => void;
  onDeleteEmptyBlock?: () => void;
  onSplitBlockAtCaret?: (textBefore: string, textAfter: string) => void;
  onMergeWithPreviousBlock?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onPasteMultiLine?: (rawText: string) => void;
  onIndentChange?: (delta: 1 | -1) => void;
}

const RichTextBlock: React.FC<RichTextBlockProps> = ({
  id,
  content,
  className,
  onChange,
  placeholder,
  onFocus,
  onBlur,
  onSelect,
  editorRef,
  onInsertImageBlock,
  onDeleteEmptyBlock,
  onSplitBlockAtCaret,
  onMergeWithPreviousBlock,
  onDragOver,
  onDrop,
  onPasteMultiLine,
  onIndentChange,
}) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (localRef.current) {
      // If the user is currently actively focused/typing in this exact contentEditable block, DO NOT overwrite DOM innerHTML!
      if (document.activeElement === localRef.current || isTypingRef.current) {
        return;
      }
      const currentMd = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
      if (currentMd !== content) {
        localRef.current.innerHTML = markdownToHtml(content);
      }
    }
  }, [content]);

  const handleInput = () => {
    if (!localRef.current) return;
    isTypingRef.current = true;

    // Purge any div, p, br, or block elements created by browser contentEditable
    const internalBlocks = localRef.current.querySelectorAll('div, p, br, h1, h2, h3, li, blockquote');
    if (internalBlocks.length > 0) {
      internalBlocks.forEach((node) => {
        if (node.tagName.toLowerCase() === 'br') {
          node.remove();
        } else {
          const text = node.textContent || '';
          const textNode = document.createTextNode(text.replace(/[\r\n]+/g, ''));
          node.parentNode?.replaceChild(textNode, node);
        }
      });
    }

    // Purge any empty mark, code, or math tags that have no text content
    localRef.current.querySelectorAll('mark, code, span.bg-indigo-950\\/50').forEach((el) => {
      if (!el.textContent || !el.textContent.trim() || el.textContent === '\u200B') {
        el.remove();
      }
    });

    const md = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
    onChange(md);
  };

  const handleBlurInternal = () => {
    isTypingRef.current = false;
    if (localRef.current) {
      const currentMd = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
      if (currentMd !== content) {
        localRef.current.innerHTML = markdownToHtml(content);
      }
    }
    if (onBlur) onBlur();
  };

  // Handle Ctrl+V Paste of Images and HTML -> Sanitize junk SVG/button elements from AI chats/web
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Direct Image File or Snipping Tool Screenshot
    const items = Array.from(clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (imageItem && onInsertImageBlock) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (!dataUrl) return;

        const attachId = 'img-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const imageName = file.name && file.name !== 'image.png' ? file.name : 'Pasted Image';
        const attachmentBlock = `:::attachment{id="${attachId}" name="${imageName}" size="${formattedSize}" mime="${file.type || 'image/png'}" isInline="true" url="${dataUrl}"}\n:::`;
        onInsertImageBlock(attachmentBlock);
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. HTML with embedded <img> tags (copied from browser / rich editors)
    const htmlData = clipboardData.getData('text/html');
    if (htmlData && htmlData.includes('<img') && onInsertImageBlock) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      const imgs = doc.querySelectorAll('img');

      if (imgs.length > 0) {
        e.preventDefault();
        imgs.forEach((img, idx) => {
          const src = img.getAttribute('src');
          if (src && (src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:'))) {
            const attachId = 'img-paste-' + Date.now().toString(36) + '-' + idx;
            const attachmentBlock = `:::attachment{id="${attachId}" name="Pasted Image" size="Image" mime="image/png" isInline="true" url="${src}"}\n:::`;
            onInsertImageBlock(attachmentBlock);
          }
        });

        imgs.forEach((img) => img.remove());
        doc.querySelectorAll('svg, button, nav, footer, script, style, form, iframe, [aria-hidden="true"], [role="button"]').forEach((node) => node.remove());
        const cleanText = doc.body.textContent || '';
        if (cleanText.trim()) {
          document.execCommand('insertText', false, cleanText);
        }
        return;
      }
    }

    // 3. HTML or Multi-Line Plain Text Paste (ChatGPT, Antigravity, Claude, VS Code, Notepad)
    const plainText = clipboardData.getData('text/plain');
    const resolvedText = htmlData ? (parsePastedHtmlToMarkdown(htmlData) || plainText) : plainText;

    if (resolvedText) {
      const hasMultipleLines = resolvedText.includes('\n') || resolvedText.includes('```');
      if (hasMultipleLines && onPasteMultiLine) {
        e.preventDefault();
        onPasteMultiLine(resolvedText);
        return;
      }

      if (htmlData) {
        e.preventDefault();
        const cleanHtml = markdownToHtml(resolvedText);
        document.execCommand('insertHTML', false, cleanHtml);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 0. Tab / Shift+Tab -> Indent or outdent list / checklist blocks
    if (e.key === 'Tab' && onIndentChange) {
      e.preventDefault();
      e.stopPropagation();
      onIndentChange(e.shiftKey ? -1 : 1);
      return;
    }

    // 1. Enter Key -> Create a NEW BLOCK with its OWN 6-dot grip handle (Shift+Enter inserts soft line break)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      let textBefore = '';
      let textAfter = '';
      const sel = window.getSelection();

      if (sel && sel.rangeCount > 0 && localRef.current) {
        const range = sel.getRangeAt(0);

        try {
          if (localRef.current.contains(range.startContainer)) {
            const preRange = range.cloneRange();
            preRange.selectNodeContents(localRef.current);
            preRange.setEnd(range.startContainer, range.startOffset);
            const preContainer = document.createElement('div');
            preContainer.appendChild(preRange.cloneContents());
            textBefore = htmlToMarkdown(preContainer.innerHTML).replace(/[\r\n]+/g, '');

            const postRange = range.cloneRange();
            postRange.selectNodeContents(localRef.current);
            postRange.setStart(range.endContainer, range.endOffset);
            const postContainer = document.createElement('div');
            postContainer.appendChild(postRange.cloneContents());
            textAfter = htmlToMarkdown(postContainer.innerHTML).replace(/[\r\n]+/g, '');
          } else {
            textBefore = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
            textAfter = '';
          }
        } catch {
          textBefore = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
          textAfter = '';
        }
      } else if (localRef.current) {
        textBefore = htmlToMarkdown(localRef.current.innerHTML).replace(/[\r\n]+/g, '');
        textAfter = '';
      }

      if (localRef.current) {
        localRef.current.innerHTML = markdownToHtml(textBefore);
      }
      isTypingRef.current = false;

      if (onSplitBlockAtCaret) {
        onSplitBlockAtCaret(textBefore, textAfter);
      }
      return;
    }

    // 2. Single Smooth 1-Hit Instant Backspace Deletion / Block Merge
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      // Case A: Text selection active (Ctrl+A or mouse highlight) -> 1 Hit clears all
      if (!sel.isCollapsed) {
        e.preventDefault();
        const range = sel.getRangeAt(0);
        range.deleteContents();

        if (localRef.current) {
          localRef.current.querySelectorAll('mark, code, span.bg-indigo-950\\/50, br').forEach((el) => {
            if (!el.textContent || !el.textContent.trim()) {
              el.remove();
            }
          });
          if (!localRef.current.textContent || !localRef.current.textContent.trim()) {
            localRef.current.innerHTML = '';
          }
        }

        handleInput();
        return;
      }

      // Case B: Collapsed selection (Backspace / Delete)
      if (sel.isCollapsed) {
        const textContent = localRef.current?.textContent || '';
        const rawHtml = localRef.current?.innerHTML || '';
        const isEmpty = textContent.trim() === '' || textContent === '\u200B' || rawHtml === '<br>' || rawHtml === '<br/>' || rawHtml.trim() === '';

        if (isEmpty && (e.key === 'Backspace' || e.key === 'Delete')) {
          e.preventDefault();
          if (onDeleteEmptyBlock) {
            onDeleteEmptyBlock();
          } else {
            if (localRef.current) localRef.current.innerHTML = '';
            handleInput();
          }
          return;
        }

        if (e.key === 'Backspace') {
          const isAtStart =
            sel.anchorOffset === 0 &&
            (sel.anchorNode === localRef.current ||
              sel.anchorNode === localRef.current?.firstChild ||
              (sel.anchorNode?.previousSibling === null && sel.anchorOffset === 0));

          if (isAtStart && onMergeWithPreviousBlock) {
            e.preventDefault();
            onMergeWithPreviousBlock();
            return;
          }
        }

        if (textContent.length === 1) {
          e.preventDefault();
          if (localRef.current) {
            localRef.current.innerHTML = '';
          }
          handleInput();
          return;
        }

        // Inside formatted element (<mark>, <code>, math)
        const parentNode = sel.anchorNode?.parentElement;
        const formattedContainer = parentNode?.closest('mark, code, span.bg-indigo-950\\/50');
        if (formattedContainer) {
          const containerText = formattedContainer.textContent || '';
          if (containerText.length <= 1 || sel.anchorOffset === 0) {
            e.preventDefault();
            const parent = formattedContainer.parentNode;
            const textNode = document.createTextNode(containerText.length === 1 ? '' : containerText);
            parent?.replaceChild(textNode, formattedContainer);

            const newRange = document.createRange();
            newRange.setStart(textNode, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);

            handleInput();
            return;
          }
        }
      }
    }
  };

  return (
    <div
      id={id}
      ref={(el) => {
        localRef.current = el;
        if (editorRef) editorRef(el);
      }}
      contentEditable
      dir="auto"
      spellCheck={false}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onClick={(e) => {
        const anchor = (e.target as HTMLElement | null)?.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href && /^(https?:\/\/|mailto:)/i.test(href)) {
            e.preventDefault();
            e.stopPropagation();
            if (/^mailto:/i.test(href)) {
              window.location.href = href;
            } else {
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }
        }
      }}
      onFocus={() => {
        isTypingRef.current = true;
        if (onFocus) onFocus();
      }}
      onBlur={handleBlurInternal}
      onMouseUp={onSelect}
      onKeyUp={onSelect}
      onDragOver={(e) => {
        if (onDragOver) onDragOver(e);
        else e.preventDefault();
      }}
      onDrop={(e) => {
        if (onDrop) onDrop(e);
      }}
      data-placeholder={placeholder}
      className={`rich-text-editor w-full bg-transparent border-none focus:outline-none resize-none py-0 select-text cursor-text min-h-[26px] empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 empty:before:italic ${
        className || 'text-zinc-200 text-[15px] leading-[26px] tracking-[-0.01em] font-normal'
      }`}
    />
  );
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  allExistingTags: _allExistingTags = [],
  onSave,
  onClose,
  onToggleFavorite: _onToggleFavorite,
  onNewNote = () => {},
  isSidebarOpen = true,
  onToggleSidebar,
  onSubjectChange,
  onFilterChange,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Active focused text block index (and persistent ref to preserve position when clicking toolbar/sidebar)
  const [activeTextBlockIndex, setActiveTextBlockIndex] = useState<number | null>(null);
  const lastFocusedBlockIdxRef = useRef<number | null>(null);

  // Global Document Ctrl+A Selection State
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Drag & Drop Block Reordering & Sidebar Item Insertion
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [draggedSidebarItem, setDraggedSidebarItem] = useState<{ type: string; label: string } | null>(null);
  const [dropIndicatorState, setDropIndicatorState] = useState<{ index: number; position: 'before' | 'after'; label?: string } | null>(null);
  const dropIndicatorStateRef = useRef<{ index: number; position: 'before' | 'after'; label?: string } | null>(null);
  const draggedSidebarItemRef = useRef<{ type: string; label: string } | null>(null);
  const draggedBlockIdxRef = useRef<number | null>(null);
  const targetInsertIndexRef = useRef<number | null>(null);

  // Per-image width tracking for resize
  const [imageWidths, setImageWidths] = useState<Record<string, number>>({});

  // Subpage Navigation Stack State
  const [subPageStack, setSubPageStack] = useState<SubPage[]>([]);
  const activeSubPage = subPageStack.length > 0 ? subPageStack[subPageStack.length - 1] : null;
  const [maxDepthWarning, setMaxDepthWarning] = useState<string | null>(null);

  // Listen for open-subpage-from-toc event from sidebar Page list
  useEffect(() => {
    const handleOpenSubpageFromToc = (e: CustomEvent<{ id: string; title?: string; content?: string }>) => {
      if (e.detail && e.detail.id) {
        const sub: SubPage = {
          id: e.detail.id,
          title: e.detail.title || 'Page Title',
          content: e.detail.content || '',
        };
        setSubPageStack((prev) => [...prev, sub]);
      }
    };
    window.addEventListener('open-subpage-from-toc' as any, handleOpenSubpageFromToc as any);
    return () => window.removeEventListener('open-subpage-from-toc' as any, handleOpenSubpageFromToc as any);
  }, []);

  // Close any open 3-dots popover menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveSubpageMenuId(null);
      setActiveAttachmentMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Subpage 3-Dots Action Menu State
  const [activeSubpageMenuId, setActiveSubpageMenuId] = useState<string | null>(null);
  const [editingSubpageId, setEditingSubpageId] = useState<string | null>(null);

  // Attachment 3-Dots Action Menu State
  const [activeAttachmentMenuId, setActiveAttachmentMenuId] = useState<string | null>(null);

  // In-App Rename Attachment Modal State
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  // In-Note Search Query (Find text in active note only!)
  const [inNoteSearchQuery, setInNoteSearchQuery] = useState('');
  const inNoteSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // File Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<FileAttachment | null>(null);

  // Craft Right Panel State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('insert');

  const titleRef = useRef<HTMLInputElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);
  const imageBlockInputRef = useRef<HTMLInputElement>(null);

  // Floating text selection toolbar
  const [selectionToolbar, setSelectionToolbar] = useState<{
    blockIdx: number;
    top: number;
    left: number;
  } | null>(null);
  const textareaRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Selected block state when 6-dot grip handle is clicked or marquee drag selected
  const [selectedBlockIndices, setSelectedBlockIndices] = useState<number[]>([]);
  const [activeBlockMenuIdx, setActiveBlockMenuIdx] = useState<number | null>(null);

  // Marquee Drag Selection State (Matching Screenshots 2 & 3 - Continuous Auto-Scroll & Infinite Drag)
  const marqueeBoxRef = useRef<HTMLDivElement>(null);
  const selectedBlockIndicesRef = useRef<number[]>([]);
  const dragStartPos = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const isDraggingMarqueeRef = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const autoScrollRaf = useRef<number | null>(null);
  const [blocksCopiedFeedback, setBlocksCopiedFeedback] = useState(false);

  useEffect(() => {
    selectedBlockIndicesRef.current = selectedBlockIndices;
  }, [selectedBlockIndices]);

  // Support Ctrl+C / Cmd+C & Escape when multiple blocks are selected
  useEffect(() => {
    if (selectedBlockIndices.length === 0) return;

    const handleKeyDownSelected = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBlockIndices([]);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const nativeSelection = window.getSelection()?.toString();
        if (nativeSelection) return; // Let native text copy handle active text selection

        e.preventDefault();
        const sorted = [...selectedBlockIndicesRef.current].sort((a, b) => a - b);
        const text = sorted
          .map((i) => {
            const blk = parsedChronologicalBlocks[i];
            if (!blk) return '';
            if (blk.type === 'text') return blk.content;
            if (blk.type === 'code') return blk.data.code;
            if (blk.type === 'mermaid') return blk.data.code;
            if (blk.type === 'subpage') return blk.data.title;
            if (blk.type === 'attachment') return blk.data.name;
            return '';
          })
          .join('\n');
        navigator.clipboard?.writeText(text);
        setBlocksCopiedFeedback(true);
        setTimeout(() => setBlocksCopiedFeedback(false), 1400);
      }
    };

    window.addEventListener('keydown', handleKeyDownSelected);
    return () => window.removeEventListener('keydown', handleKeyDownSelected);
  }, [selectedBlockIndices.length]);

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('[contenteditable="true"]') ||
      target.closest('[draggable="true"]') ||
      target.closest('.floating-selection-toolbar') ||
      target.closest('.block-action-menu')
    ) {
      return;
    }

    if (e.button !== 0) return; // Only left-click drag

    const containerScroll = canvasScrollRef.current ? canvasScrollRef.current.scrollTop : 0;
    isMouseDownRef.current = true;
    isDraggingMarqueeRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY, scrollTop: containerScroll };
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const hideMarqueeBox = () => {
      if (marqueeBoxRef.current) {
        marqueeBoxRef.current.style.display = 'none';
      }
    };

    const updateSelection = (currentX: number, currentY: number) => {
      if (!dragStartPos.current || !canvasScrollRef.current) return;

      const container = canvasScrollRef.current;
      const scrollDiff = container.scrollTop - dragStartPos.current.scrollTop;
      const startX = dragStartPos.current.x;
      const startY = dragStartPos.current.y - scrollDiff;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width > 8 || height > 8 || isDraggingMarqueeRef.current) {
        if (!isDraggingMarqueeRef.current) {
          isDraggingMarqueeRef.current = true;
          window.getSelection()?.removeAllRanges();
          setSelectionToolbar(null);
          setShowColorPicker(false);
        }

        const x = Math.min(currentX, startX);
        const y = Math.min(currentY, startY);

        // Update marquee box directly on DOM for 120fps zero-stutter dragging
        if (marqueeBoxRef.current) {
          marqueeBoxRef.current.style.display = 'block';
          marqueeBoxRef.current.style.left = `${x}px`;
          marqueeBoxRef.current.style.top = `${y}px`;
          marqueeBoxRef.current.style.width = `${width}px`;
          marqueeBoxRef.current.style.height = `${height}px`;
        }

        // Precise overlap detection using explicit data-block-idx (>4px intersection required)
        const blockElements = container.querySelectorAll('[data-block-idx]');
        const newlySelected: number[] = [];
        blockElements.forEach((el) => {
          const idxAttr = el.getAttribute('data-block-idx');
          if (idxAttr === null) return;
          const idx = Number(idxAttr);
          if (!Number.isFinite(idx)) return;

          const rect = el.getBoundingClientRect();
          const overlapX = Math.min(rect.right, x + width) - Math.max(rect.left, x);
          const overlapY = Math.min(rect.bottom, y + height) - Math.max(rect.top, y);
          if (overlapX > 4 && overlapY > 4) {
            newlySelected.push(idx);
          }
        });

        // Only update React state when selected indices actually change
        const prev = selectedBlockIndicesRef.current;
        if (
          prev.length !== newlySelected.length ||
          prev.some((val, i) => val !== newlySelected[i])
        ) {
          selectedBlockIndicesRef.current = newlySelected;
          setSelectedBlockIndices(newlySelected);
        }
      }
    };

    const autoScrollLoop = () => {
      if (!isMouseDownRef.current || !lastMousePos.current || !canvasScrollRef.current) {
        autoScrollRaf.current = null;
        return;
      }

      const container = canvasScrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const mouseY = lastMousePos.current.y;
      const mouseX = lastMousePos.current.x;

      let scrollDelta = 0;
      const topThreshold = containerRect.top + 64;
      const bottomThreshold = containerRect.bottom - 64;

      if (mouseY < topThreshold) {
        const intensity = Math.min(1, (topThreshold - mouseY) / 64);
        scrollDelta = -Math.round(4 + intensity * 20);
      } else if (mouseY > bottomThreshold) {
        const intensity = Math.min(1, (mouseY - bottomThreshold) / 64);
        scrollDelta = Math.round(4 + intensity * 20);
      }

      if (scrollDelta !== 0 && isDraggingMarqueeRef.current) {
        container.scrollTop += scrollDelta;
        updateSelection(mouseX, mouseY);
        autoScrollRaf.current = requestAnimationFrame(autoScrollLoop);
      } else {
        autoScrollRaf.current = null;
      }
    };

    const cancelMarquee = () => {
      isMouseDownRef.current = false;
      dragStartPos.current = null;
      lastMousePos.current = null;
      hideMarqueeBox();
      if (autoScrollRaf.current) {
        cancelAnimationFrame(autoScrollRaf.current);
        autoScrollRaf.current = null;
      }
      setTimeout(() => {
        isDraggingMarqueeRef.current = false;
      }, 60);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !dragStartPos.current) return;
      if ((e.buttons & 1) !== 1) {
        cancelMarquee();
        return;
      }

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      updateSelection(e.clientX, e.clientY);

      if (!autoScrollRaf.current && canvasScrollRef.current) {
        const rect = canvasScrollRef.current.getBoundingClientRect();
        if (e.clientY < rect.top + 64 || e.clientY > rect.bottom - 64) {
          autoScrollRaf.current = requestAnimationFrame(autoScrollLoop);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', cancelMarquee);
    window.addEventListener('blur', cancelMarquee);
    window.addEventListener('dragstart', cancelMarquee);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', cancelMarquee);
      window.removeEventListener('blur', cancelMarquee);
      window.removeEventListener('dragstart', cancelMarquee);
      if (autoScrollRaf.current) cancelAnimationFrame(autoScrollRaf.current);
    };
  }, []);

  // Version History Modal State
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const parseTextToBlocks = useCallback((sourceText: string): ChronoBlock[] => {
    if (!sourceText) return [{ type: 'text', id: 't-root-0', content: '' }];

    const rawBlocks: ChronoBlock[] = [];
    const splitRegex = /(:::(?:subpage|attachment|code|mermaid|collection)\{[\s\S]*?:::)/g;
    const parts = sourceText.split(splitRegex);

    let lastPrecedingId = 'root';
    let textLineIndexUnderBlock = 0;

    parts.forEach((part, partIdx) => {
      if (!part) return;

      const trimmedPart = part.trim();
      if (!trimmedPart) {
        // Pure newline separators between directives or intentional empty lines
        const newlineCount = (part.match(/\n/g) || []).length;
        const extraEmptyLines = partIdx === 0 || partIdx === parts.length - 1 ? newlineCount : Math.max(0, newlineCount - 1);
        for (let k = 0; k < extraEmptyLines; k++) {
          rawBlocks.push({
            type: 'text',
            id: `t-${lastPrecedingId}-${textLineIndexUnderBlock++}`,
            content: '',
          });
        }
        return;
      }

      const subpageMatch = /^:::subpage\{id="([^"]+)" title="([^"]*)"(?: layout="([^"]+)")?\}[\r\n]+([\s\S]*?)[\r\n]+:::$/i.exec(trimmedPart);
      if (subpageMatch) {
        const decodedContent = decodeSubPageContent(subpageMatch[4]);
        const subId = subpageMatch[1];
        rawBlocks.push({
          type: 'subpage',
          id: subId,
          data: {
            id: subId,
            title: unescapeAttr(subpageMatch[2]),
            layout: (subpageMatch[3] as 'small' | 'regular' | 'card') || 'regular',
            content: decodedContent,
          },
        });
        lastPrecedingId = subId;
        textLineIndexUnderBlock = 0;
        return;
      }

      const attMatch = /^:::attachment\{id="([^"]+)" name="([^"]+)" size="([^"]+)" mime="([^"]+)"(?: layout="([^"]+)")?(?: isInline="([^"]+)")?(?: width="([^"]+)")? url="([^"]+)"\}[\r\n]*:::$/i.exec(trimmedPart);
      if (attMatch) {
        const attId = attMatch[1];
        rawBlocks.push({
          type: 'attachment',
          id: attId,
          data: {
            id: attId,
            name: unescapeAttr(attMatch[2]),
            size: attMatch[3],
            mime: attMatch[4],
            layout: (attMatch[5] as 'small' | 'regular' | 'card') || 'regular',
            isInlineImage: attMatch[6] === 'true',
            width: attMatch[7] ? parseInt(attMatch[7], 10) : undefined,
            url: attMatch[8],
          },
        });
        lastPrecedingId = attId;
        textLineIndexUnderBlock = 0;
        return;
      }

      const codeMatch = /^:::code\{id="([^"]+)" lang="([^"]*)"\}[\r\n]*([\s\S]*?)[\r\n]*:::$/i.exec(trimmedPart);
      if (codeMatch) {
        const codeId = codeMatch[1];
        let decodedCode = decodeSubPageContent(codeMatch[3]);
        if (
          decodedCode.trim() === '// Tulis kode di sini...' ||
          decodedCode.trim() === '// Tulis atau tempel kode di sini...'
        ) {
          decodedCode = '';
        }
        const langVal = unescapeAttr(codeMatch[2]) || 'auto';
        rawBlocks.push({
          type: 'code',
          id: codeId,
          data: {
            id: codeId,
            lang: langVal === 'typescript' && !decodedCode ? 'auto' : langVal,
            code: decodedCode,
          },
        });
        lastPrecedingId = codeId;
        textLineIndexUnderBlock = 0;
        return;
      }

      const mermaidMatch = /^:::mermaid\{id="([^"]+)"\}[\r\n]*([\s\S]*?)[\r\n]*:::$/i.exec(trimmedPart);
      if (mermaidMatch) {
        const mmdId = mermaidMatch[1];
        rawBlocks.push({
          type: 'mermaid',
          id: mmdId,
          data: {
            id: mmdId,
            code: decodeSubPageContent(mermaidMatch[2]),
          },
        });
        lastPrecedingId = mmdId;
        textLineIndexUnderBlock = 0;
        return;
      }

      const collectionMatch = /^:::collection\{id="([^"]+)" title="([^"]*)"\}[\r\n]*([\s\S]*?)[\r\n]*:::$/i.exec(trimmedPart);
      if (collectionMatch) {
        const colId = collectionMatch[1];
        const rawJson = decodeSubPageContent(collectionMatch[3]);
        let parsedData: CollectionData;
        try {
          parsedData = JSON.parse(rawJson);
        } catch {
          parsedData = createDefaultCollection('table');
          parsedData.id = colId;
          parsedData.title = unescapeAttr(collectionMatch[2]) || 'Collection';
        }
        rawBlocks.push({
          type: 'collection',
          id: colId,
          data: parsedData,
        });
        lastPrecedingId = colId;
        textLineIndexUnderBlock = 0;
        return;
      }

      // Regular text block:
      let cleanPart = part;
      // Strip leading delimiter \n ONLY if preceding part was a directive
      if (partIdx > 0 && cleanPart.startsWith('\n')) {
        cleanPart = cleanPart.slice(1);
      }
      // Strip trailing delimiter \n ONLY if following part is a directive
      if (partIdx < parts.length - 1 && cleanPart.endsWith('\n')) {
        cleanPart = cleanPart.slice(0, -1);
      }

      const lines = cleanPart.split('\n');
      lines.forEach((line) => {
        const trimmed = line.replace(/[\r\n]+/g, '');
        rawBlocks.push({
          type: 'text',
          id: `t-${lastPrecedingId}-${textLineIndexUnderBlock++}`,
          content: trimmed,
        });
      });
    });

    if (rawBlocks.length === 0) {
      rawBlocks.push({ type: 'text', id: 't-root-0', content: '' });
    }

    // Always ensure the document ends with an editable text line so user can always type below cards
    const lastBlock = rawBlocks[rawBlocks.length - 1];
    if (lastBlock && lastBlock.type !== 'text') {
      rawBlocks.push({ type: 'text', id: `t-${lastBlock.id}-0`, content: '' });
    }

    return rawBlocks;
  }, []);

  const reassembleBlocksToText = useCallback((blocks: ChronoBlock[]): string => {
    const blockStrings = blocks.map((b) => {
      if (b.type === 'text') {
        return b.content.replace(/[\r\n]+/g, '');
      }
      if (b.type === 'subpage') {
        const encodedData = encodeSubPageContent(b.data.content);
        return `:::subpage{id="${b.data.id}" title="${escapeAttr(b.data.title)}" layout="${b.data.layout || 'regular'}"}\n${encodedData}\n:::`;
      }
      if (b.type === 'attachment') {
        const widthAttr = b.data.width ? ` width="${b.data.width}"` : '';
        return `:::attachment{id="${b.data.id}" name="${escapeAttr(b.data.name)}" size="${b.data.size}" mime="${b.data.mime}" layout="${b.data.layout || 'regular'}" isInline="${b.data.isInlineImage ? 'true' : 'false'}"${widthAttr} url="${b.data.url}"}\n:::`;
      }
      if (b.type === 'code') {
        const encodedCode = encodeSubPageContent(b.data.code);
        return `:::code{id="${b.data.id}" lang="${escapeAttr(b.data.lang)}"}\n${encodedCode}\n:::`;
      }
      if (b.type === 'mermaid') {
        const encodedCode = encodeSubPageContent(b.data.code);
        return `:::mermaid{id="${b.data.id}"}\n${encodedCode}\n:::`;
      }
      if (b.type === 'collection') {
        const encodedJson = encodeSubPageContent(JSON.stringify(b.data));
        return `:::collection{id="${b.data.id}" title="${escapeAttr(b.data.title)}"}\n${encodedJson}\n:::`;
      }
      return '';
    });

    return blockStrings.join('\n');
  }, []);

  // Undo / Redo History Stack (Synchronous Ref + Render Trigger)
  const historyRef = useRef<Array<{ title: string; content: string; subject: string; tags: string[] }>>([]);
  const historyIndexRef = useRef<number>(-1);
  const lastHistoryPushTimeRef = useRef<number>(0);
  const [, setHistoryTick] = useState(0);

  // Initialize history when note is loaded
  useEffect(() => {
    if (note) {
      const initialState = {
        title: note.title || '',
        content: note.content || '',
        subject: note.subject || '',
        tags: Array.isArray(note.tags) ? [...note.tags] : [],
      };
      historyRef.current = [initialState];
      historyIndexRef.current = 0;
      lastHistoryPushTimeRef.current = Date.now();
      setHistoryTick((t) => t + 1);
    }
  }, [note?.id]);

  const pushHistory = useCallback((newState: { title: string; content: string; subject: string; tags: string[] }, immediate: boolean = false) => {
    const currentHist = historyRef.current;
    const currentIdx = historyIndexRef.current;
    const current = currentHist[currentIdx];

    // Avoid duplicate pushes
    if (current && current.content === newState.content && current.title === newState.title && current.subject === newState.subject) {
      return;
    }

    const now = Date.now();
    const isRapidTyping = !immediate && (now - lastHistoryPushTimeRef.current < 450);

    if (isRapidTyping && currentIdx > 0) {
      // Update top snapshot in-place for smooth keystroke grouping
      currentHist[currentIdx] = {
        title: newState.title,
        content: newState.content,
        subject: newState.subject,
        tags: [...newState.tags],
      };
    } else {
      // Branch off from current history index (discard any forward redo history) and push
      const truncated = currentHist.slice(0, currentIdx + 1);
      truncated.push({
        title: newState.title,
        content: newState.content,
        subject: newState.subject,
        tags: [...newState.tags],
      });
      const capped = truncated.slice(-80); // Keep up to 80 undo actions
      historyRef.current = capped;
      historyIndexRef.current = capped.length - 1;
      lastHistoryPushTimeRef.current = now;
    }

    setHistoryTick((t) => t + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const state = historyRef.current[historyIndexRef.current];
    if (!state) return;

    setTitle(state.title);
    setContent(state.content);
    setSubject(state.subject);
    setTags(state.tags);

    // If currently viewing a subpage, update its stack from restored content
    if (subPageStack.length > 0) {
      let currContent = state.content;
      const updatedStack = subPageStack.map((sp) => {
        const blocks = parseTextToBlocks(currContent);
        const found = blocks.find((b) => b.type === 'subpage' && b.id === sp.id);
        if (found && found.type === 'subpage') {
          currContent = found.data.content;
          return { id: sp.id, title: found.data.title, content: found.data.content };
        }
        return sp;
      });
      setSubPageStack(updatedStack);
    }

    if (note) {
      const updatedNote: Note = {
        ...note,
        title: state.title,
        content: state.content,
        subject: state.subject,
        tags: state.tags,
        updatedAt: Date.now(),
      };
      onSave(updatedNote);
    }

    setHistoryTick((t) => t + 1);
  }, [note, onSave, subPageStack, parseTextToBlocks]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const state = historyRef.current[historyIndexRef.current];
    if (!state) return;

    setTitle(state.title);
    setContent(state.content);
    setSubject(state.subject);
    setTags(state.tags);

    if (subPageStack.length > 0) {
      let currContent = state.content;
      const updatedStack = subPageStack.map((sp) => {
        const blocks = parseTextToBlocks(currContent);
        const found = blocks.find((b) => b.type === 'subpage' && b.id === sp.id);
        if (found && found.type === 'subpage') {
          currContent = found.data.content;
          return { id: sp.id, title: found.data.title, content: found.data.content };
        }
        return sp;
      });
      setSubPageStack(updatedStack);
    }

    if (note) {
      const updatedNote: Note = {
        ...note,
        title: state.title,
        content: state.content,
        subject: state.subject,
        tags: state.tags,
        updatedAt: Date.now(),
      };
      onSave(updatedNote);
    }

    setHistoryTick((t) => t + 1);
  }, [note, onSave, subPageStack, parseTextToBlocks]);

  // Whenever switching notes or entering subpages:
  // 1. For new / empty notes, ALWAYS show from the top (Judul & Tags visible front and center)
  // 2. For existing notes with long content, position naturally without over-scrolling into deep bottom void
  // 3. Ensure NO input is focused / NOT typing anything (clean view state)
  useEffect(() => {
    if (!note) return;

    setActiveTextBlockIndex(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const timer = setTimeout(() => {
      if (canvasScrollRef.current) {
        const rawContent = (activeSubPage ? activeSubPage.content : note.content) || '';
        const rawTitle = (activeSubPage ? activeSubPage.title : note.title) || '';
        const isNewOrEmpty = !rawContent.trim() && (!rawTitle.trim() || rawTitle === 'Catatan Baru' || rawTitle === 'Page Title');

        if (isNewOrEmpty) {
          canvasScrollRef.current.scrollTop = 0;
        } else {
          const scrollH = canvasScrollRef.current.scrollHeight;
          const clientH = canvasScrollRef.current.clientHeight;
          if (scrollH <= clientH + 120) {
            canvasScrollRef.current.scrollTop = 0;
          } else {
            canvasScrollRef.current.scrollTop = scrollH - clientH;
          }
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [note?.id, subPageStack.length, activeSubPage?.id]);

  // Click-outside listener to close 3-dots action menu automatically
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveSubpageMenuId(null);
      setActiveAttachmentMenuId(null);
    };
    if (activeSubpageMenuId || activeAttachmentMenuId) {
      window.addEventListener('click', handleWindowClick);
    }
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [activeSubpageMenuId, activeAttachmentMenuId]);

  // Click-outside & Escape key listener to close Search Popover Dropdown automatically
  useEffect(() => {
    const handleClickOutsideSearch = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        if (inNoteSearchQuery) {
          setInNoteSearchQuery('');
        }
      }
    };

    const handleKeyDownEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inNoteSearchQuery) {
        setInNoteSearchQuery('');
        inNoteSearchInputRef.current?.blur();
      }
    };

    if (inNoteSearchQuery) {
      window.addEventListener('mousedown', handleClickOutsideSearch);
      window.addEventListener('keydown', handleKeyDownEsc);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutsideSearch);
      window.removeEventListener('keydown', handleKeyDownEsc);
    };
  }, [inNoteSearchQuery]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSubject(note.subject);
      setTags(note.tags);
      setSubPageStack([]);
      setMaxDepthWarning(null);
      setPreviewAttachment(null);
      setIsRightSidebarOpen(true);
      setActiveTextBlockIndex(null);
      setDraggedBlockIdx(null);
      setSelectionToolbar(null);
      setShowColorPicker(false);

      const regex = /:::attachment\{id="([^"]+)" name="([^"]+)" size="([^"]+)" mime="([^"]+)"(?: layout="([^"]+)")?(?: isInline="([^"]+)")?(?: width="([^"]+)")? url="([^"]+)"\}[\r\n]*:::/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        globalAttachmentMap.set(match[1], {
          id: match[1],
          name: match[2],
          size: match[3],
          mime: match[4],
          layout: (match[5] as 'small' | 'regular' | 'card') || 'regular',
          isInlineImage: match[6] === 'true',
          width: match[7] ? parseInt(match[7], 10) : undefined,
          url: match[8],
        });
      }
    }
  }, [note?.id]);


  // Document selection change and scroll listener to auto-hide floating toolbar when selection is cleared or canvas scrolls
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionToolbar(null);
        setShowColorPicker(false);
      }
    };

    const scrollEl = canvasScrollRef.current;
    const handleScroll = () => {
      setSelectionToolbar(null);
      setShowColorPicker(false);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Listen for navigation events from Left Sidebar TOC / Breadcrumbs
  useEffect(() => {
    const handleNavigateRoot = () => {
      setSubPageStack([]);
    };

    const handleOpenSubpageFromToc = (e: Event) => {
      const customEvt = e as CustomEvent<{ id: string; title: string; content?: string }>;
      if (customEvt.detail) {
        const targetSub: SubPage = {
          id: customEvt.detail.id,
          title: customEvt.detail.title,
          content: customEvt.detail.content || '',
        };
        setSubPageStack((prev) => {
          const existingIdx = prev.findIndex((s) => s.id === targetSub.id);
          if (existingIdx >= 0) {
            return prev.slice(0, existingIdx + 1);
          }
          return [...prev, targetSub];
        });
      }
    };

    window.addEventListener('navigate-root-note', handleNavigateRoot);
    window.addEventListener('open-subpage-from-toc', handleOpenSubpageFromToc);

    return () => {
      window.removeEventListener('navigate-root-note', handleNavigateRoot);
      window.removeEventListener('open-subpage-from-toc', handleOpenSubpageFromToc);
    };
  }, []);

  // Global KeyDown listener for Ctrl+A selection, Undo/Redo, and Backspace/Delete wiping!
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z / Cmd+Z, Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && activeEl.tagName === 'INPUT' && !activeEl.classList.contains('subpage-title-input')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && activeEl.tagName === 'INPUT' && !activeEl.classList.contains('subpage-title-input')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // Ctrl+A / Cmd+A Selection logic
        const activeEl = document.activeElement as HTMLElement;
        const activeTag = activeEl?.tagName?.toLowerCase();

        const selectAllDocumentBlocks = () => {
          setIsAllSelected(true);
          const allIndices = Array.from({ length: parsedChronologicalBlocks.length }, (_, i) => i);
          setSelectedBlockIndices(allIndices);
          setSelectionToolbar(null);
          setShowColorPicker(false);
        };

        if (
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          activeEl?.closest('.group\\/editor') ||
          activeEl?.closest('.group\\/codecard') ||
          activeEl?.closest('.group\\/mmdcard')
        ) {
          return;
        }

        if (activeEl && activeEl.isContentEditable) {
          const selection = window.getSelection();
          const selectedText = selection?.toString() || '';
          const elText = activeEl.textContent || '';

          // If line is blank (elText.length === 0) OR text in block is already fully selected -> select all blocks in note!
          if (elText.length === 0 || (selectedText.length > 0 && selectedText.length >= elText.length)) {
            e.preventDefault();
            selectAllDocumentBlocks();
          } else {
            setIsAllSelected(false);
          }
          return;
        }

        // Focused on canvas / outside block -> select all blocks in note!
        e.preventDefault();
        selectAllDocumentBlocks();
      } else if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u', 'e'].includes(e.key.toLowerCase())) {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl && activeEl.isContentEditable) {
          e.preventDefault();
          const key = e.key.toLowerCase();
          if (key === 'b') applyFormatting('**');
          else if (key === 'i') applyFormatting('*');
          else if (key === 'u') applyFormatting('<u>');
          else if (key === 'e') applyFormatting('`');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl && activeEl.isContentEditable) {
          e.preventDefault();
          applyFormatting('~~');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selectedBlockIndices.length > 0) {
        const nativeSelection = window.getSelection()?.toString();
        if (nativeSelection) return;
        e.preventDefault();
        const sorted = [...selectedBlockIndicesRef.current].sort((a, b) => a - b);
        const text = sorted
          .map((i) => {
            const blk = parsedChronologicalBlocks[i];
            if (!blk) return '';
            if (blk.type === 'text') return blk.content;
            if (blk.type === 'code') return blk.data.code;
            if (blk.type === 'mermaid') return blk.data.code;
            if (blk.type === 'subpage') return blk.data.title;
            if (blk.type === 'attachment') return blk.data.name;
            return '';
          })
          .join('\n');
        navigator.clipboard?.writeText(text);
        handleDeleteSelectedBlocks();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && isAllSelected) {
        // Ctrl+C / Cmd+C Copy full note content when all selected
        e.preventDefault();
        const textToCopy = activeSubPage
          ? `${activeSubPage.title}\n\n${activeSubPage.content}`
          : `${title ? title + '\n\n' : ''}${content}`;
        navigator.clipboard.writeText(textToCopy);
      } else if (selectedBlockIndices.length > 0 && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        handleDeleteSelectedBlocks();
      } else if (e.key === 'Escape') {
        setIsAllSelected(false);
        setSelectedBlockIndices([]);
        setActiveBlockMenuIdx(null);
        setSelectionToolbar(null);
        setShowColorPicker(false);
      }
    };

    const handleGlobalMouseDown = (e: MouseEvent) => {
      setIsAllSelected(false);
      const target = e.target as HTMLElement;
      if (!target.closest('.group\\/tblock') && !target.closest('.block-action-menu') && !target.closest('.rich-text-editor')) {
        setSelectedBlockIndices([]);
        setActiveBlockMenuIdx(null);
      }
      if (!target.closest('.floating-selection-toolbar')) {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setSelectionToolbar(null);
          setShowColorPicker(false);
        }
      }
    };

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const activeTag = activeEl?.tagName?.toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeEl?.isContentEditable
      ) {
        return; // Let native / RichTextBlock onPaste handle focused inputs
      }

      const htmlData = e.clipboardData?.getData('text/html');
      const plainText = e.clipboardData?.getData('text/plain') || '';
      const resolvedText = htmlData ? (parsePastedHtmlToMarkdown(htmlData) || plainText) : plainText;
      if (!resolvedText) return;

      e.preventDefault();
      const newBlocks = parsePastedTextToChronoBlocks(resolvedText);

      const updated = [...parsedChronologicalBlocks];
      if (selectedBlockIndicesRef.current.length > 0) {
        const sorted = [...selectedBlockIndicesRef.current].sort((a, b) => a - b);
        const firstIdx = sorted[0];
        const selectedSet = new Set(sorted);
        const filtered = updated.filter((_, idx) => !selectedSet.has(idx));
        const insertAt = Math.min(firstIdx, filtered.length);
        filtered.splice(insertAt, 0, ...newBlocks);
        reassembleAndSaveBlocks(filtered);
        setSelectedBlockIndices([]);
      } else {
        updated.push(...newBlocks);
        reassembleAndSaveBlocks(updated);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('mousedown', handleGlobalMouseDown);
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isAllSelected, selectedBlockIndices, content, handleUndo, handleRedo]);

  // Ref for debounced auto-save timer (butter smooth 60fps typing without IndexedDB disk write lag!)
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNoteRef = useRef<{ t: string; c: string; s: string; tg: string[] }>({
    t: title,
    c: content,
    s: subject,
    tg: tags,
  });

  useEffect(() => {
    latestNoteRef.current = { t: title, c: content, s: subject, tg: tags };
  }, [title, content, subject, tags]);

  // Flush pending auto-save on component unmount / note switch
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current && note) {
        clearTimeout(autoSaveTimeoutRef.current);
        const { t, c, s, tg } = latestNoteRef.current;
        const updatedNote: Note = {
          ...note,
          title: t,
          content: c,
          subject: s,
          tags: tg,
          updatedAt: Date.now(),
        };
        onSave(updatedNote);
      }
    };
  }, [note]);

  if (!note) {
    return <DashboardEmptyEditor onNewNote={onNewNote} />;
  }



  const handleTitleChange = (val: string) => {
    if (activeSubPage) {
      const updatedSub = { ...activeSubPage, title: val };
      const updatedStack = [...subPageStack.slice(0, -1), updatedSub];
      setSubPageStack(updatedStack);
      updateSubPageInContent(updatedSub);
    } else {
      setTitle(val);
      triggerAutoSave(val, content, subject, tags);
    }
  };

  const handleFullContentChange = (val: string) => {
    if (activeSubPage) {
      const updatedSub = { ...activeSubPage, content: val };
      const updatedStack = [...subPageStack.slice(0, -1), updatedSub];
      setSubPageStack(updatedStack);
      updateSubPageInContent(updatedSub);
    } else {
      setContent(val);
      triggerAutoSave(title, val, subject, tags);
    }
  };

  const triggerAutoSave = (t: string, c: string, s: string, tg: string[]) => {
    latestNoteRef.current = { t, c, s, tg };

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!note) return;
      const updatedNote: Note = {
        ...note,
        title: t,
        content: c,
        subject: s,
        tags: tg,
        updatedAt: Date.now(),
      };
      onSave(updatedNote);
      saveVersionLog(updatedNote);
    }, 400); // 400ms debounce prevents disk-write lag on every keystroke!

    pushHistory({ title: t, content: c, subject: s, tags: tg });
  };



  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().slice(0, 25);
    if (cleaned && !tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      const updatedTags = [...tags, cleaned];
      setTags(updatedTags);
      triggerAutoSave(title, content, subject, updatedTags);
    }
    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    setTags(updatedTags);
    triggerAutoSave(title, content, subject, updatedTags);
  };



  const updateSubPageInContent = useCallback((updatedSubPage: SubPage) => {
    if (subPageStack.length === 0) return;

    const newStack = [...subPageStack];
    newStack[newStack.length - 1] = updatedSubPage;

    for (let i = newStack.length - 1; i > 0; i--) {
      const child = newStack[i];
      const parent = newStack[i - 1];

      const parentBlocks = parseTextToBlocks(parent.content);
      const updatedParentBlocks = parentBlocks.map((b) => {
        if (b.type === 'subpage' && b.id === child.id) {
          return { type: 'subpage' as const, id: child.id, data: { id: child.id, title: child.title, content: child.content } };
        }
        return b;
      });

      const updatedParentContent = reassembleBlocksToText(updatedParentBlocks);
      newStack[i - 1] = { ...parent, content: updatedParentContent };
    }

    setSubPageStack(newStack);

    const rootSubPage = newStack[0];
    const rootBlocks = parseTextToBlocks(content);
    const updatedRootBlocks = rootBlocks.map((b) => {
      if (b.type === 'subpage' && b.id === rootSubPage.id) {
        return { type: 'subpage' as const, id: rootSubPage.id, data: { id: rootSubPage.id, title: rootSubPage.title, content: rootSubPage.content } };
      }
      return b;
    });

    const newRootContent = reassembleBlocksToText(updatedRootBlocks);
    if (newRootContent !== content) {
      setContent(newRootContent);
      triggerAutoSave(title, newRootContent, subject, tags);
    }
  }, [subPageStack, content, parseTextToBlocks, reassembleBlocksToText, title, subject, tags]);

  // Chronological Document Parser
  const parsedChronologicalBlocks = useMemo(() => {
    const activeTextSource = activeSubPage ? activeSubPage.content : content;
    return parseTextToBlocks(activeTextSource);
  }, [activeSubPage, content, parseTextToBlocks]);

  // Insert block right after active position without adding extra \n
  const insertBlockAtActivePosition = (snippetText: string) => {
    const currentBlocks = [...parsedChronologicalBlocks];

    let targetIdx = lastFocusedBlockIdxRef.current !== null && lastFocusedBlockIdxRef.current >= 0
      ? Math.min(lastFocusedBlockIdxRef.current, currentBlocks.length - 1)
      : activeTextBlockIndex !== null && activeTextBlockIndex >= 0
      ? activeTextBlockIndex
      : currentBlocks.length - 1;
    if (targetIdx < 0) targetIdx = 0;

    let newBlock: ChronoBlock | null = null;
    const subpageMatch = /^:::subpage\{id="([^"]+)" title="([^"]*)"(?: layout="([^"]+)")?\}[\r\n]+([\s\S]*?)[\r\n]+:::$/.exec(snippetText.trim());
    if (subpageMatch) {
      const decodedContent = decodeSubPageContent(subpageMatch[4]);
      newBlock = {
        type: 'subpage',
        id: subpageMatch[1],
        data: {
          id: subpageMatch[1],
          title: unescapeAttr(subpageMatch[2]),
          layout: (subpageMatch[3] as 'small' | 'regular' | 'card') || 'regular',
          content: decodedContent,
        },
      };
    }

    const attMatch = /^:::attachment\{id="([^"]+)" name="([^"]+)" size="([^"]+)" mime="([^"]+)"(?: layout="([^"]+)")?(?: isInline="([^"]+)")?(?: width="([^"]+)")? url="([^"]+)"\}[\r\n]*:::$/.exec(snippetText.trim());
    if (attMatch) {
      newBlock = {
        type: 'attachment',
        id: attMatch[1],
        data: {
          id: attMatch[1],
          name: unescapeAttr(attMatch[2]),
          size: attMatch[3],
          mime: attMatch[4],
          layout: (attMatch[5] as 'small' | 'regular' | 'card') || 'regular',
          isInlineImage: attMatch[6] === 'true',
          width: attMatch[7] ? parseInt(attMatch[7], 10) : undefined,
          url: attMatch[8],
        },
      };
    }

    const codeMatch = /^:::code\{id="([^"]+)" lang="([^"]*)"\}[\r\n]*([\s\S]*?)[\r\n]*:::$/.exec(snippetText.trim());
    if (codeMatch) {
      let decoded = decodeSubPageContent(codeMatch[3]);
      if (
        decoded.trim() === '// Tulis kode di sini...' ||
        decoded.trim() === '// Tulis atau tempel kode di sini...'
      ) {
        decoded = '';
      }
      const langVal = unescapeAttr(codeMatch[2]) || 'auto';
      newBlock = {
        type: 'code',
        id: codeMatch[1],
        data: {
          id: codeMatch[1],
          lang: langVal === 'typescript' && !decoded ? 'auto' : langVal,
          code: decoded,
        },
      };
    }

    const mermaidMatch = /^:::mermaid\{id="([^"]+)"\}[\r\n]*([\s\S]*?)[\r\n]*:::$/.exec(snippetText.trim());
    if (mermaidMatch) {
      newBlock = {
        type: 'mermaid',
        id: mermaidMatch[1],
        data: {
          id: mermaidMatch[1],
          code: decodeSubPageContent(mermaidMatch[2]),
        },
      };
    }

    if (newBlock) {
      const currentAtTarget = currentBlocks[targetIdx];
      let insertedIdx = targetIdx + 1;
      // If user is on an empty text block, replace it directly without creating extra spacing!
      if (currentAtTarget && currentAtTarget.type === 'text' && !currentAtTarget.content.trim()) {
        currentBlocks[targetIdx] = newBlock;
        insertedIdx = targetIdx;
        if (targetIdx === currentBlocks.length - 1) {
          currentBlocks.push({ type: 'text', id: `t-after-${newBlock.id}`, content: '' });
        }
      } else {
        currentBlocks.splice(targetIdx + 1, 0, newBlock);
        insertedIdx = targetIdx + 1;
        if (targetIdx + 2 >= currentBlocks.length || currentBlocks[targetIdx + 2].type !== 'text') {
          currentBlocks.splice(targetIdx + 2, 0, { type: 'text', id: `t-after-${newBlock.id}`, content: '' });
        }
      }
      setSelectedBlockIndices([insertedIdx]);
      lastFocusedBlockIdxRef.current = insertedIdx;
    } else {
      const targetBlock = currentBlocks[targetIdx];
      if (targetBlock && targetBlock.type === 'text') {
        const joined = targetBlock.content ? `${targetBlock.content}\n${snippetText}` : snippetText;
        currentBlocks[targetIdx] = { ...targetBlock, content: joined };
      } else {
        currentBlocks.push({ type: 'text', id: 'text-' + Date.now(), content: snippetText });
      }
    }

    reassembleAndSaveBlocks(currentBlocks);
  };

  // Reassemble blocks cleanly
  const reassembleAndSaveBlocks = (blocks: ChronoBlock[], immediate: boolean = true) => {
    const reassembled = reassembleBlocksToText(blocks);
    handleFullContentChange(reassembled);
    pushHistory({ title, content: reassembled, subject, tags }, immediate);
  };

  const handleSplitBlockAtCaret = (index: number, textBefore: string, textAfter: string) => {
    const updated = [...parsedChronologicalBlocks];
    const target = updated[index];
    if (!target || target.type !== 'text') return;

    const cleanBefore = textBefore.replace(/[\r\n]+/g, '');
    const cleanAfter = textAfter.replace(/[\r\n]+/g, '');
    const targetIdx = index + 1;
    const newBlockId = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    updated[index] = { ...target, content: cleanBefore };
    updated.splice(targetIdx, 0, { type: 'text', id: newBlockId, content: cleanAfter });

    // Calculate the exact index among .rich-text-editor DOM elements
    const textBlocksBeforeTarget = updated.slice(0, targetIdx + 1).filter((b) => b.type === 'text').length;
    const targetTextEditorIndex = textBlocksBeforeTarget - 1;

    // Synchronously commit state to DOM without any frame delay
    flushSync(() => {
      reassembleAndSaveBlocks(updated);
      setActiveTextBlockIndex(targetIdx);
      lastFocusedBlockIdxRef.current = targetIdx;
    });

    // Synchronously focus the newly created line in the EXACT same tick (0ms delay)
    const allEditors = Array.from(document.querySelectorAll<HTMLElement>('.rich-text-editor'));
    const nextEl =
      targetTextEditorIndex >= 0 && allEditors[targetTextEditorIndex]
        ? allEditors[targetTextEditorIndex]
        : allEditors[targetIdx] || allEditors[allEditors.length - 1];

    if (nextEl) {
      nextEl.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(nextEl);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const handleMergeBlockWithPrevious = (index: number) => {
    if (index <= 0) return;
    const updated = [...parsedChronologicalBlocks];
    const currentBlock = updated[index];
    const prevBlock = updated[index - 1];

    if (!currentBlock || !prevBlock) return;

    if (prevBlock.type === 'text' && currentBlock.type === 'text') {
      const prevText = prevBlock.content || '';
      const currentText = currentBlock.content || '';
      const prevTextLen = prevText.length;
      const mergedText = prevText ? `${prevText}${currentText}` : currentText;
      const targetIdx = index - 1;

      updated[targetIdx] = { ...prevBlock, content: mergedText };
      updated.splice(index, 1);

      const textBlocksBeforeTarget = updated.slice(0, targetIdx + 1).filter((b) => b.type === 'text').length;
      const targetTextEditorIndex = textBlocksBeforeTarget - 1;

      flushSync(() => {
        reassembleAndSaveBlocks(updated);
        setActiveTextBlockIndex(targetIdx);
        lastFocusedBlockIdxRef.current = targetIdx;
      });

      const allEditors = Array.from(document.querySelectorAll<HTMLElement>('.rich-text-editor'));
      const targetEl =
        targetTextEditorIndex >= 0 && allEditors[targetTextEditorIndex]
          ? allEditors[targetTextEditorIndex]
          : allEditors[targetIdx] || allEditors[allEditors.length - 1];

      if (targetEl) {
        targetEl.focus({ preventScroll: true });
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          if (targetEl.firstChild && prevTextLen > 0) {
            const textNode = targetEl.firstChild;
            const offset = Math.min(prevTextLen, textNode.textContent?.length || 0);
            range.setStart(textNode, offset);
            range.collapse(true);
          } else {
            range.selectNodeContents(targetEl);
            range.collapse(prevTextLen > 0 ? false : true);
          }
          sel.removeAllRanges();
          sel?.addRange(range);
        }
      }
    } else {
      updated.splice(index, 1);
      reassembleAndSaveBlocks(updated);
    }
  };

  const focusNeighborTextBlock = (deletedChronoIdx: number, currentRemainingBlocks: ChronoBlock[]) => {
    if (currentRemainingBlocks.length === 0) return;

    // Find nearest text block before deleted index, or after if none before
    const targetNeighbor =
      currentRemainingBlocks.slice(0, deletedChronoIdx).reverse().find((b) => b.type === 'text') ||
      currentRemainingBlocks.slice(deletedChronoIdx).find((b) => b.type === 'text');

    if (!targetNeighbor) return;

    setTimeout(() => {
      const targetEl = document.getElementById(`editor-${targetNeighbor.id}`) as HTMLElement | null;
      if (targetEl) {
        const neighborIdx = currentRemainingBlocks.findIndex((b) => b.id === targetNeighbor.id);
        if (neighborIdx !== -1) {
          setActiveTextBlockIndex(neighborIdx);
          lastFocusedBlockIdxRef.current = neighborIdx;
        }
        targetEl.focus({ preventScroll: true });
        const range = document.createRange();
        range.selectNodeContents(targetEl);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 20);
  };

  const handleDeleteBlockAtIndex = (idx: number) => {
    if (parsedChronologicalBlocks.length <= 1) {
      handleTextBlockUpdate(0, '');
      return;
    }
    const updated = [...parsedChronologicalBlocks];
    updated.splice(idx, 1);
    reassembleAndSaveBlocks(updated);
    setSelectedBlockIndices([]);
    setActiveBlockMenuIdx(null);
    focusNeighborTextBlock(idx, updated);
  };

  const handleDeleteSelectedBlocks = () => {
    if (selectedBlockIndices.length === 0 && !isAllSelected) return;

    let remaining: ChronoBlock[] = [];
    if (isAllSelected || selectedBlockIndices.length >= parsedChronologicalBlocks.length) {
      remaining = [];
    } else {
      remaining = parsedChronologicalBlocks.filter((_, idx) => !selectedBlockIndices.includes(idx));
    }

    const firstDeletedIdx = selectedBlockIndices.length > 0 ? Math.min(...selectedBlockIndices) : 0;

    if (remaining.length === 0) {
      handleFullContentChange('');
    } else {
      reassembleAndSaveBlocks(remaining);
    }

    setSelectedBlockIndices([]);
    setIsAllSelected(false);
    setActiveBlockMenuIdx(null);
    setSelectionToolbar(null);

    focusNeighborTextBlock(firstDeletedIdx, remaining);
  };

  // Global Keyboard Shortcuts: Delete selected block(s) with Backspace or Delete key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.tagName === 'INPUT') return;
      if (activeEl && activeEl.tagName === 'TEXTAREA' && selectedBlockIndices.length === 0) return;

      if (selectedBlockIndices.length > 0 || isAllSelected) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteSelectedBlocks();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedBlockIndices, isAllSelected, parsedChronologicalBlocks, handleDeleteSelectedBlocks]);

  const handleDuplicateBlockByIdx = (idx: number) => {
    const updated = [...parsedChronologicalBlocks];
    const target = updated[idx];
    if (!target) return;

    if (target.type === 'text') {
      updated.splice(idx + 1, 0, { ...target, id: `text-block-dup-${Date.now()}` });
    } else if (target.type === 'subpage') {
      const newId = 'sub-' + Date.now();
      updated.splice(idx + 1, 0, {
        type: 'subpage',
        id: newId,
        data: { ...target.data, id: newId, title: `${target.data.title} (Salinan)` },
      });
    } else if (target.type === 'code') {
      const newId = 'code-' + Date.now();
      updated.splice(idx + 1, 0, {
        type: 'code',
        id: newId,
        data: { ...target.data, id: newId },
      });
    } else if (target.type === 'mermaid') {
      const newId = 'mmd-' + Date.now();
      updated.splice(idx + 1, 0, {
        type: 'mermaid',
        id: newId,
        data: { ...target.data, id: newId },
      });
    } else if (target.type === 'attachment') {
      const newId = 'att-' + Date.now();
      updated.splice(idx + 1, 0, {
        type: 'attachment',
        id: newId,
        data: { ...target.data, id: newId },
      });
    }

    reassembleAndSaveBlocks(updated);
    setSelectedBlockIndices([idx + 1]);
    setActiveBlockMenuIdx(null);
  };

  const handleMoveBlockUp = (idx: number) => {
    if (idx <= 0) return;
    const updated = [...parsedChronologicalBlocks];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    reassembleAndSaveBlocks(updated);
    setSelectedBlockIndices([idx - 1]);
    setActiveBlockMenuIdx(null);
  };

  const handleMoveBlockDown = (idx: number) => {
    if (idx >= parsedChronologicalBlocks.length - 1) return;
    const updated = [...parsedChronologicalBlocks];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    reassembleAndSaveBlocks(updated);
    setSelectedBlockIndices([idx + 1]);
    setActiveBlockMenuIdx(null);
  };

  const handleTextBlockUpdate = (index: number, val: string) => {
    const updated = [...parsedChronologicalBlocks];
    if (updated[index] && updated[index].type === 'text') {
      updated[index] = { ...updated[index], content: val };
    }
    reassembleAndSaveBlocks(updated);
  };

  // Update Code Block
  const handleUpdateCodeBlock = (codeId: string, newLang: string, newCode: string) => {
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'code' && b.data.id === codeId) {
        return {
          ...b,
          data: {
            ...b.data,
            lang: newLang,
            code: newCode,
          },
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Update Mermaid Block
  const handleUpdateMermaidBlock = (mermaidId: string, newCode: string) => {
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'mermaid' && b.data.id === mermaidId) {
        return {
          ...b,
          data: {
            ...b.data,
            code: newCode,
          },
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Remove Code Block
  const handleDeleteCodeBlock = (codeId: string) => {
    const targetIdx = parsedChronologicalBlocks.findIndex((b) => b.type === 'code' && b.data.id === codeId);
    const filtered = parsedChronologicalBlocks.filter((b) => b.type !== 'code' || b.data.id !== codeId);
    reassembleAndSaveBlocks(filtered);
    setSelectedBlockIndices([]);
    focusNeighborTextBlock(targetIdx >= 0 ? targetIdx : 0, filtered);
  };

  // Remove Mermaid Block
  const handleDeleteMermaidBlock = (mermaidId: string) => {
    const targetIdx = parsedChronologicalBlocks.findIndex((b) => b.type === 'mermaid' && b.data.id === mermaidId);
    const filtered = parsedChronologicalBlocks.filter((b) => b.type !== 'mermaid' || b.data.id !== mermaidId);
    reassembleAndSaveBlocks(filtered);
    setSelectedBlockIndices([]);
    focusNeighborTextBlock(targetIdx >= 0 ? targetIdx : 0, filtered);
  };

  // Update Collection Block
  const handleUpdateCollectionBlock = (colId: string, updatedData: CollectionData) => {
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'collection' && b.id === colId) {
        return {
          ...b,
          data: updatedData,
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Remove Collection Block
  const handleDeleteCollectionBlock = (colId: string) => {
    const targetIdx = parsedChronologicalBlocks.findIndex((b) => b.type === 'collection' && b.id === colId);
    const filtered = parsedChronologicalBlocks.filter((b) => !(b.type === 'collection' && b.id === colId));
    reassembleAndSaveBlocks(filtered);
    setSelectedBlockIndices([]);
    focusNeighborTextBlock(targetIdx >= 0 ? targetIdx : 0, filtered);
  };

  // Insert Text Block at Active Position with Direct Auto-Focus
  const handleInsertTextBlock = () => {
    const currentBlocks = [...parsedChronologicalBlocks];
    let targetIdx = lastFocusedBlockIdxRef.current !== null && lastFocusedBlockIdxRef.current >= 0
      ? Math.min(lastFocusedBlockIdxRef.current, currentBlocks.length - 1)
      : activeTextBlockIndex !== null && activeTextBlockIndex >= 0
      ? activeTextBlockIndex
      : currentBlocks.length - 1;
    if (targetIdx < 0) targetIdx = 0;

    const currentAtTarget = currentBlocks[targetIdx];
    let insertIdx = targetIdx + 1;
    if (currentAtTarget && currentAtTarget.type === 'text' && !currentAtTarget.content.trim()) {
      insertIdx = targetIdx;
    } else {
      currentBlocks.splice(targetIdx + 1, 0, { type: 'text', id: `text-${Date.now()}`, content: '' });
      insertIdx = targetIdx + 1;
    }

    reassembleAndSaveBlocks(currentBlocks);
    const textBlockIndex = currentBlocks.slice(0, insertIdx + 1).filter((b) => b.type === 'text').length - 1;
    setActiveTextBlockIndex(insertIdx);
    lastFocusedBlockIdxRef.current = insertIdx;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const allEditors = document.querySelectorAll('.rich-text-editor');
        const targetEl = allEditors[Math.max(0, textBlockIndex)] as HTMLElement | undefined;
        if (targetEl) {
          targetEl.focus({ preventScroll: true });
        }
      }, 35);
    });
  };

  // Insert Collection Block
  const handleInsertCollection = (type: 'table' | 'gallery' | 'kanban' = 'table') => {
    const colData = createDefaultCollection(type);
    const encodedJson = encodeSubPageContent(JSON.stringify(colData));
    const blockMd = `:::collection{id="${colData.id}" title="${colData.title}"}\n${encodedJson}\n:::`;
    insertBlockAtActivePosition(blockMd);
  };

  // Insert Code Block with Immediate Auto-Focus
  const handleInsertCodeBlock = () => {
    const codeId = 'code-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const initialCode = '';
    const codeBlock = `:::code{id="${codeId}" lang="auto"}\n${encodeSubPageContent(initialCode)}\n:::`;
    insertBlockAtActivePosition(codeBlock);

    requestAnimationFrame(() => {
      setTimeout(() => {
        const codeEl = document.querySelector(`[data-code-id="${codeId}"] textarea`) as HTMLTextAreaElement | null;
        if (codeEl) {
          codeEl.focus({ preventScroll: true });
        } else {
          const allCodeTextareas = document.querySelectorAll('.group\\/codecard textarea');
          const lastTextarea = allCodeTextareas[allCodeTextareas.length - 1] as HTMLTextAreaElement | null;
          lastTextarea?.focus({ preventScroll: true });
        }
      }, 35);
    });
  };

  // Insert Mermaid Block with Immediate Auto-Focus
  const handleInsertMermaidBlock = () => {
    const mmdId = 'mmd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const initialMermaid = '';
    const mermaidBlock = `:::mermaid{id="${mmdId}"}\n${encodeSubPageContent(initialMermaid)}\n:::`;
    insertBlockAtActivePosition(mermaidBlock);

    requestAnimationFrame(() => {
      setTimeout(() => {
        const mmdEl = document.querySelector(`[data-mmd-id="${mmdId}"] textarea`) as HTMLTextAreaElement | null;
        if (mmdEl) {
          mmdEl.focus({ preventScroll: true });
        } else {
          const allMmdTextareas = document.querySelectorAll('.group\\/mmdcard textarea');
          const lastTextarea = allMmdTextareas[allMmdTextareas.length - 1] as HTMLTextAreaElement | null;
          lastTextarea?.focus({ preventScroll: true });
        }
      }, 35);
    });
  };

  const handleDuplicateSelectedBlocks = () => {
    if (selectedBlockIndices.length === 0) return;
    const indicesToDup = selectedBlockIndices.slice(0, 50);
    const sortedIndices = [...indicesToDup].sort((a, b) => a - b);
    const lastIdx = sortedIndices[sortedIndices.length - 1];

    const updated = [...parsedChronologicalBlocks];
    const duplicates: ChronoBlock[] = [];

    sortedIndices.forEach((idx) => {
      const target = parsedChronologicalBlocks[idx];
      if (!target) return;
      if (target.type === 'text') {
        duplicates.push({ ...target, id: `text-block-dup-${Date.now()}-${idx}` });
      } else if (target.type === 'subpage') {
        const newId = 'sub-' + Date.now() + '-' + idx;
        duplicates.push({
          type: 'subpage',
          id: newId,
          data: { ...target.data, id: newId, title: `${target.data.title} (Salinan)` },
        });
      } else if (target.type === 'code') {
        const newId = 'code-' + Date.now() + '-' + idx;
        duplicates.push({
          type: 'code',
          id: newId,
          data: { ...target.data, id: newId },
        });
      } else if (target.type === 'mermaid') {
        const newId = 'mmd-' + Date.now() + '-' + idx;
        duplicates.push({
          type: 'mermaid',
          id: newId,
          data: { ...target.data, id: newId },
        });
      } else if (target.type === 'attachment') {
        const newId = 'att-' + Date.now() + '-' + idx;
        duplicates.push({
          type: 'attachment',
          id: newId,
          data: { ...target.data, id: newId },
        });
      }
    });

    updated.splice(lastIdx + 1, 0, ...duplicates);
    reassembleAndSaveBlocks(updated);

    const newSelected = Array.from({ length: duplicates.length }, (_, i) => lastIdx + 1 + i);
    setSelectedBlockIndices(newSelected);
  };

  // Start dragging a new item from the right sidebar Insert panel
  const handleSidebarDragStart = (type: string, label: string, e: React.DragEvent) => {
    draggedSidebarItemRef.current = { type, label };
    draggedBlockIdxRef.current = null;
    setDraggedSidebarItem({ type, label });
    setDraggedBlockIdx(null);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.setData('application/instantnotes-insert-type', type);
  };

  const handleDragStartBlock = (index: number, e: React.DragEvent) => {
    draggedBlockIdxRef.current = index;
    draggedSidebarItemRef.current = null;
    setDraggedBlockIdx(index);
    setDraggedSidebarItem(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `block-${index}`);
    e.dataTransfer.setData('application/instantnotes-block-idx', String(index));
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.4';
    setTimeout(() => { el.style.opacity = '1'; }, 0);
  };

  const handleDragOverBlock = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sidebarItem = draggedSidebarItemRef.current || draggedSidebarItem;
    const blockIdx = draggedBlockIdxRef.current !== null ? draggedBlockIdxRef.current : draggedBlockIdx;

    e.dataTransfer.dropEffect = sidebarItem ? 'copy' : 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const isTopHalf = e.clientY < rect.top + rect.height / 2;
    const position: 'before' | 'after' = isTopHalf ? 'before' : 'after';

    // Prevent redundant state updates & re-renders if hovering in the exact same target zone
    if (
      dropIndicatorStateRef.current &&
      dropIndicatorStateRef.current.index === index &&
      dropIndicatorStateRef.current.position === position
    ) {
      return;
    }

    let label = '';
    if (sidebarItem) {
      label = sidebarItem.label;
    } else if (blockIdx !== null) {
      label = 'Pindah Blok';
    }

    const nextState = { index, position, label };
    dropIndicatorStateRef.current = nextState;
    setDropIndicatorState(nextState);
  };

  const handleDropOnBlock = (targetIndex: number, e?: React.DragEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const sidebarItem = draggedSidebarItemRef.current || draggedSidebarItem;
    let blockIdx = draggedBlockIdxRef.current !== null ? draggedBlockIdxRef.current : draggedBlockIdx;
    const rawDataTransferType = e?.dataTransfer?.getData('application/instantnotes-insert-type') || e?.dataTransfer?.getData('text/plain');
    const rawBlockIdxData = e?.dataTransfer?.getData('application/instantnotes-block-idx');

    if (blockIdx === null && rawBlockIdxData) {
      const parsed = parseInt(rawBlockIdxData, 10);
      if (!isNaN(parsed)) blockIdx = parsed;
    } else if (blockIdx === null && rawDataTransferType?.startsWith('block-')) {
      const parsed = parseInt(rawDataTransferType.replace('block-', ''), 10);
      if (!isNaN(parsed)) blockIdx = parsed;
    }

    const pos = dropIndicatorStateRef.current?.position || dropIndicatorState?.position || 'before';
    const insertIdx = pos === 'after' ? targetIndex + 1 : targetIndex;

    const resolvedType = sidebarItem?.type || (rawDataTransferType && !rawDataTransferType.startsWith('block-') ? rawDataTransferType : null);

    // CASE 1: Dragged from Sidebar (New Feature Block Insertion)
    if (resolvedType) {
      const type = resolvedType;
      const updated = [...parsedChronologicalBlocks];

      if (type === 'text') {
        const currentAtInsert = updated[insertIdx];
        let targetBlockIdx = insertIdx;
        if (currentAtInsert && currentAtInsert.type === 'text' && !currentAtInsert.content.trim()) {
          // Keep existing empty text line
        } else {
          updated.splice(insertIdx, 0, { type: 'text', id: `text-${Date.now()}`, content: '' });
        }
        reassembleAndSaveBlocks(updated);
        draggedSidebarItemRef.current = null;
        dropIndicatorStateRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);

        const textBlockIndex = updated.slice(0, targetBlockIdx + 1).filter((b) => b.type === 'text').length - 1;
        setActiveTextBlockIndex(targetBlockIdx);
        lastFocusedBlockIdxRef.current = targetBlockIdx;

        requestAnimationFrame(() => {
          setTimeout(() => {
            const allEditors = document.querySelectorAll('.rich-text-editor');
            const targetEl = allEditors[Math.max(0, textBlockIndex)] as HTMLElement | undefined;
            if (targetEl) {
              targetEl.focus({ preventScroll: true });
            }
          }, 35);
        });
        return;
      }

      if (type === 'subpage') {
        if (subPageStack.length >= 4) {
          setMaxDepthWarning('Maksimal kedalaman sub-halaman adalah 4 tingkat.');
          draggedSidebarItemRef.current = null;
          setDraggedSidebarItem(null);
          setDropIndicatorState(null);
          return;
        }
        const newSubId = 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const subBlock: ChronoBlock = {
          type: 'subpage',
          id: newSubId,
          data: { id: newSubId, title: '', content: '' },
        };
        const currentAtInsert = updated[insertIdx];
        if (currentAtInsert && currentAtInsert.type === 'text' && !currentAtInsert.content.trim()) {
          updated[insertIdx] = subBlock;
        } else {
          updated.splice(insertIdx, 0, subBlock);
        }
        reassembleAndSaveBlocks(updated);
        setEditingSubpageId(newSubId);
        draggedSidebarItemRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        return;
      }

      if (type === 'code') {
        const codeId = 'code-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const codeBlock: ChronoBlock = {
          type: 'code',
          id: codeId,
          data: { id: codeId, lang: 'typescript', code: '' },
        };
        const currentAtInsert = updated[insertIdx];
        if (currentAtInsert && currentAtInsert.type === 'text' && !currentAtInsert.content.trim()) {
          updated[insertIdx] = codeBlock;
        } else {
          updated.splice(insertIdx, 0, codeBlock);
        }
        reassembleAndSaveBlocks(updated);
        draggedSidebarItemRef.current = null;
        dropIndicatorStateRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        setSelectedBlockIndices([insertIdx]);
        lastFocusedBlockIdxRef.current = insertIdx;

        requestAnimationFrame(() => {
          setTimeout(() => {
            const codeEl = document.querySelector(`[data-code-id="${codeId}"] textarea`) as HTMLTextAreaElement | null;
            codeEl?.focus({ preventScroll: true });
          }, 35);
        });
        return;
      }

      if (type === 'mermaid') {
        const mmdId = 'mmd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const mmdBlock: ChronoBlock = {
          type: 'mermaid',
          id: mmdId,
          data: { id: mmdId, code: 'graph TD\n  A[Mulai] --> B[Proses]\n  B --> C[Selesai]' },
        };
        const currentAtInsert = updated[insertIdx];
        if (currentAtInsert && currentAtInsert.type === 'text' && !currentAtInsert.content.trim()) {
          updated[insertIdx] = mmdBlock;
        } else {
          updated.splice(insertIdx, 0, mmdBlock);
        }
        reassembleAndSaveBlocks(updated);
        draggedSidebarItemRef.current = null;
        dropIndicatorStateRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        setSelectedBlockIndices([insertIdx]);
        lastFocusedBlockIdxRef.current = insertIdx;

        requestAnimationFrame(() => {
          setTimeout(() => {
            const mmdEl = document.querySelector(`[data-mmd-id="${mmdId}"] textarea`) as HTMLTextAreaElement | null;
            mmdEl?.focus({ preventScroll: true });
          }, 35);
        });
        return;
      }

      if (type === 'table' || type === 'gallery' || type === 'kanban') {
        const customType: 'table' | 'gallery' | 'kanban' = type as any;
        const colData = createDefaultCollection(customType);
        const colBlock: ChronoBlock = {
          type: 'collection',
          id: colData.id,
          data: colData,
        };
        const currentAtInsert = updated[insertIdx];
        if (currentAtInsert && currentAtInsert.type === 'text' && !currentAtInsert.content.trim()) {
          updated[insertIdx] = colBlock;
        } else {
          updated.splice(insertIdx, 0, colBlock);
        }
        reassembleAndSaveBlocks(updated);
        draggedSidebarItemRef.current = null;
        dropIndicatorStateRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        return;
      }

      if (type === 'attachment') {
        targetInsertIndexRef.current = insertIdx;
        draggedSidebarItemRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        fileAttachmentInputRef.current?.click();
        return;
      }

      if (type === 'image') {
        targetInsertIndexRef.current = insertIdx;
        draggedSidebarItemRef.current = null;
        setDraggedSidebarItem(null);
        setDropIndicatorState(null);
        imageBlockInputRef.current?.click();
        return;
      }
    }

    // CASE 2: Dragging existing block(s) for reorder
    if (blockIdx !== null) {
      if (selectedBlockIndices.length > 1 && selectedBlockIndices.includes(blockIdx)) {
        const indicesToMove = [...selectedBlockIndices].sort((a, b) => a - b);
        const blocksToMove = indicesToMove.map((i) => parsedChronologicalBlocks[i]).filter(Boolean);
        const remaining = parsedChronologicalBlocks.filter((_, i) => !indicesToMove.includes(i));

        let insertPos = insertIdx;
        const countBefore = indicesToMove.filter((i) => i < insertIdx).length;
        insertPos = Math.max(0, insertIdx - countBefore);

        remaining.splice(insertPos, 0, ...blocksToMove);
        draggedBlockIdxRef.current = null;
        setDraggedBlockIdx(null);
        setDropIndicatorState(null);
        reassembleAndSaveBlocks(remaining);

        const newSelected = Array.from({ length: blocksToMove.length }, (_, i) => insertPos + i);
        setSelectedBlockIndices(newSelected);
        return;
      }

      if (blockIdx === targetIndex) {
        draggedBlockIdxRef.current = null;
        setDraggedBlockIdx(null);
        setDropIndicatorState(null);
        return;
      }

      const updated = [...parsedChronologicalBlocks];
      const [draggedItem] = updated.splice(blockIdx, 1);
      const adjustedTarget = insertIdx > blockIdx ? insertIdx - 1 : insertIdx;
      updated.splice(adjustedTarget, 0, draggedItem);
      draggedBlockIdxRef.current = null;
      setDraggedBlockIdx(null);
      setDropIndicatorState(null);
      reassembleAndSaveBlocks(updated);
      setSelectedBlockIndices([adjustedTarget]);
    }
  };

  const handleDragEnd = () => {
    draggedSidebarItemRef.current = null;
    draggedBlockIdxRef.current = null;
    dropIndicatorStateRef.current = null;
    setDraggedBlockIdx(null);
    setDraggedSidebarItem(null);
    setDropIndicatorState(null);
  };

  // Image resize via mouse drag with ultra-smooth 60-144fps direct DOM update + RAF
  const handleImageResize = (attId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const container = (e.currentTarget as HTMLElement).closest('[data-img-container]') as HTMLElement;
    if (!container) return;
    const startWidth = container.offsetWidth;

    // Remove transition and disable selection during drag to eliminate jitter
    container.style.transition = 'none';
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';

    let finalWidth = startWidth;
    let rafId: number | null = null;

    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      const newWidth = Math.round(Math.max(140, Math.min(startWidth + diff, 820)));
      finalWidth = newWidth;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          container.style.width = `${newWidth}px`;
          rafId = null;
        });
      }
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      container.style.transition = '';

      setImageWidths((prev) => ({ ...prev, [attId]: finalWidth }));

      // Persist width to document markdown
      const updated = parsedChronologicalBlocks.map((b) => {
        if (b.type === 'attachment' && b.data.id === attId) {
          return {
            ...b,
            data: {
              ...b.data,
              width: finalWidth,
            },
          };
        }
        return b;
      });
      reassembleAndSaveBlocks(updated);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
  };

  // Focus text editor at end of content immediately on canvas click
  const focusEditorAtEnd = useCallback((targetIndex?: number) => {
    let idx = targetIndex !== undefined ? targetIndex : parsedChronologicalBlocks.length - 1;
    if (idx < 0) idx = 0;

    const lastBlock = parsedChronologicalBlocks[parsedChronologicalBlocks.length - 1];
    // If the document ends with a non-text block (Subpage, Code, Mermaid, Attachment, etc.)
    // Create a new text block at the bottom so user can immediately type below it!
    if (!lastBlock || lastBlock.type !== 'text') {
      const newId = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const updated = [...parsedChronologicalBlocks, { type: 'text' as const, id: newId, content: '' }];
      reassembleAndSaveBlocks(updated);
      setActiveTextBlockIndex(updated.length - 1);
      setTimeout(() => {
        const el = textareaRefs.current.get(newId) || document.getElementById(`editor-${newId}`);
        if (el) {
          el.focus();
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 25);
      return;
    }

    const targetBlock = parsedChronologicalBlocks[idx];
    let el = targetBlock && targetBlock.type === 'text' ? textareaRefs.current.get(targetBlock.id) || document.getElementById(`editor-${targetBlock.id}`) : null;

    if (!el) {
      for (let i = parsedChronologicalBlocks.length - 1; i >= 0; i--) {
        const b = parsedChronologicalBlocks[i];
        if (b && b.type === 'text') {
          const found = textareaRefs.current.get(b.id) || document.getElementById(`editor-${b.id}`);
          if (found) {
            el = found;
            idx = i;
            break;
          }
        }
      }
    }

    if (el) {
      setActiveTextBlockIndex(idx);
      el.focus();

      // Place caret at the very end of text content
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [parsedChronologicalBlocks]);

  // Click anywhere on empty canvas area immediately focuses text editor & places blinking caret
  const handleEmptyCanvasClick = (e: React.MouseEvent) => {
    if (isDraggingMarqueeRef.current) return;
    if (selectedBlockIndices.length > 1) {
      setSelectedBlockIndices([]);
      return;
    }
    const target = e.target as HTMLElement;
    if (
      target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('[data-img-container]') ||
      target.closest('.group\\/block') ||
      target.closest('.rich-text-editor')
    ) {
      return;
    }

    focusEditorAtEnd();
  };

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lastUsedColor, setLastUsedColor] = useState<string>('yellow');

  const applyColor = useCallback((colorId: string) => {
    if (!selectionToolbar) return;
    const selection = window.getSelection();

    if (selection && !selection.isCollapsed) {
      const parentNode = selection.anchorNode?.parentElement;
      const existingMark = parentNode?.closest('mark');

      if (colorId === 'default') {
        if (existingMark) {
          const parent = existingMark.parentNode;
          while (existingMark.firstChild) {
            parent?.insertBefore(existingMark.firstChild, existingMark);
          }
          parent?.removeChild(existingMark);
        }
      } else {
        const preset = NOTION_COLORS.find((c) => c.id === colorId) || NOTION_COLORS[0];
        setLastUsedColor(preset.id);
        if (existingMark) {
          existingMark.setAttribute('data-color', preset.id);
          existingMark.className = `${preset.bgClass} ${preset.textClass} px-1.5 py-0.5 rounded-md font-medium font-sans`;
        } else {
          const range = selection.getRangeAt(0);
          const mark = document.createElement('mark');
          mark.setAttribute('data-color', preset.id);
          mark.className = `${preset.bgClass} ${preset.textClass} px-1.5 py-0.5 rounded-md font-medium font-sans`;
          try {
            range.surroundContents(mark);
          } catch {
            // fallback
          }
        }
      }

      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.isContentEditable) {
        activeEl.querySelectorAll('mark').forEach((m) => {
          if (!m.textContent || !m.textContent.trim()) m.remove();
        });
        const md = htmlToMarkdown(activeEl.innerHTML);
        handleTextBlockUpdate(selectionToolbar.blockIdx, md);
      }
    }
    setShowColorPicker(false);
    setSelectionToolbar(null);
  }, [selectionToolbar, handleTextBlockUpdate]);

  const applyTextColor = useCallback((colorId: string) => {
    if (!selectionToolbar) return;
    if (colorId === 'default') {
      document.execCommand('foreColor', false, '#e4e4e7');
    } else {
      const preset = NOTION_COLORS.find((c) => c.id === colorId) || NOTION_COLORS[0];
      document.execCommand('foreColor', false, preset.dotColor);
    }

    const activeEl = document.activeElement as HTMLElement;
    if (activeEl && activeEl.isContentEditable) {
      const md = htmlToMarkdown(activeEl.innerHTML);
      handleTextBlockUpdate(selectionToolbar.blockIdx, md);
    }
    setShowColorPicker(false);
    setSelectionToolbar(null);
  }, [selectionToolbar, handleTextBlockUpdate]);

  // Active formats state for floating toolbar purple button highlights
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    code: boolean;
    math: boolean;
    highlight: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    math: false,
    highlight: false,
  });

  // Floating toolbar: detect text selection in text block
  const handleTextSelect = useCallback((blockIdx: number) => {
    // Don't show B/I/U toolbar when Ctrl+A all-selected â€” only show when user highlights specific text
    if (isAllSelected) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim() || selection.rangeCount === 0) {
      setSelectionToolbar(null);
      setShowColorPicker(false);
      return;
    }

    // Clear 6-dot block selection when highlighting text to avoid double selection!
    setSelectedBlockIndices([]);

    const range = selection.getRangeAt(0);
    const selRect = range.getBoundingClientRect();
    if (!selRect || (selRect.width === 0 && selRect.height === 0)) return;

    // Fixed screen coordinates: Exactly 42px directly above highlighted text line (perfect 12px floating breathing gap)
    const calculatedTop = Math.max(12, selRect.top - 42);
    const calculatedLeft = Math.max(12, Math.min(selRect.left, window.innerWidth - 300));

    const parentEl = selection.anchorNode?.parentElement;
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      highlight: parentEl?.tagName.toLowerCase() === 'mark',
      code: parentEl?.tagName.toLowerCase() === 'code',
      math: parentEl?.classList.contains('bg-indigo-950/50') ?? false,
    });

    setShowColorPicker(false); // ALWAYS HIDE color picker menu by default!
    setSelectionToolbar({
      blockIdx,
      top: calculatedTop,
      left: calculatedLeft,
    });
  }, [isAllSelected]);

  // Apply rich markdown formatting around selected text with toggle-off (unwrap) support
  const applyFormatting = useCallback((wrapper: string) => {
    const selection = window.getSelection();
    const targetBlockIdx = selectionToolbar?.blockIdx ?? lastFocusedBlockIdxRef.current ?? 0;

    if (selection && (!selection.isCollapsed || wrapper === '**' || wrapper === '*' || wrapper === '<u>' || wrapper === '~~')) {
      const parentNode = selection.anchorNode?.parentElement;
      const targetTag = wrapper === '==' ? 'mark' : wrapper === '`' ? 'code' : wrapper === '$' ? 'span' : null;

      // TOGGLE OFF / UNWRAP if already active
      if (targetTag) {
        const existingContainer = parentNode?.closest(targetTag);
        if (existingContainer && (targetTag !== 'span' || existingContainer.classList.contains('bg-indigo-950/50'))) {
          const textContent = existingContainer.textContent || '';
          const textNode = document.createTextNode(textContent);
          existingContainer.parentNode?.replaceChild(textNode, existingContainer);

          const activeEl = document.activeElement as HTMLElement;
          if (activeEl && activeEl.isContentEditable) {
            const md = htmlToMarkdown(activeEl.innerHTML);
            handleTextBlockUpdate(targetBlockIdx, md);
          }
          setSelectionToolbar(null);
          return;
        }
      }

      if (wrapper === '**') {
        document.execCommand('bold');
      } else if (wrapper === '*') {
        document.execCommand('italic');
      } else if (wrapper === '<u>') {
        document.execCommand('underline');
      } else if (wrapper === '~~') {
        document.execCommand('strikeThrough');
      } else if (wrapper === 'clear') {
        document.execCommand('removeFormat');
      } else if (wrapper === '==') {
        const range = selection.getRangeAt(0);
        const mark = document.createElement('mark');
        mark.className = 'bg-amber-500/25 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded-md font-medium font-sans';
        try {
          range.surroundContents(mark);
        } catch {
          document.execCommand('backColor', false, 'rgba(245, 158, 11, 0.3)');
        }
      } else if (wrapper === '`') {
        const range = selection.getRangeAt(0);
        const code = document.createElement('code');
        code.className = 'bg-[#22232b] text-rose-400 border border-white/10 font-mono text-[13px] px-1.5 py-0.5 rounded-md font-medium shadow-sm';
        try {
          range.surroundContents(code);
        } catch {
          // fallback
        }
      } else if (wrapper === '$') {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'inline-flex items-center px-1.5 py-0.5 bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 rounded-md font-serif italic text-sm shadow-sm select-all';
        try {
          range.surroundContents(span);
        } catch {
          // fallback
        }
      }

      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.isContentEditable) {
        const md = htmlToMarkdown(activeEl.innerHTML);
        handleTextBlockUpdate(targetBlockIdx, md);
      }

      // For B/I/U/S: keep toolbar open & refresh active format states so toggle is visible
      if (['**', '*', '<u>', '~~'].includes(wrapper)) {
        const pNode = selection.anchorNode?.parentElement;
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikeThrough'),
          highlight: pNode?.tagName.toLowerCase() === 'mark',
          code: pNode?.tagName.toLowerCase() === 'code',
          math: pNode?.classList.contains('bg-indigo-950/50') ?? false,
        });
        return; // Don't close toolbar â€” keep it open for further toggling
      }
    }
    setSelectionToolbar(null);
  }, [selectionToolbar, handleTextBlockUpdate]);

  // Upload via File Attachment
  const handleFileAttachmentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const attachId = 'att-' + Date.now().toString(36);
      const attachmentBlock = `:::attachment{id="${attachId}" name="${file.name}" size="${formattedSize}" mime="${file.type}" isInline="false" url="${dataUrl}"}\n:::`;
      if (targetInsertIndexRef.current !== null) {
        const idx = targetInsertIndexRef.current;
        targetInsertIndexRef.current = null;
        const currentBlocks = [...parsedChronologicalBlocks];
        const newBlock: ChronoBlock = {
          type: 'attachment',
          id: attachId,
          data: {
            id: attachId,
            name: file.name,
            size: formattedSize,
            mime: file.type,
            isInlineImage: false,
            url: dataUrl,
          },
        };
        currentBlocks.splice(idx, 0, newBlock);
        if (idx + 1 >= currentBlocks.length || currentBlocks[idx + 1].type !== 'text') {
          currentBlocks.splice(idx + 1, 0, { type: 'text', id: `t-after-${attachId}`, content: '' });
        }
        reassembleAndSaveBlocks(currentBlocks);
      } else {
        insertBlockAtActivePosition(attachmentBlock);
      }
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Upload via Image with smart aspect-ratio default sizing
  const handleImageBlockSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const attachId = 'img-' + Date.now().toString(36);

      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth || 1;
        const naturalHeight = img.naturalHeight || 1;
        const ratio = naturalWidth / naturalHeight;

        // Aspect ratio intelligent default sizing:
        // - 9:16 vertical portrait (ratio < 0.75): width = 240px
        // - 3:4 portrait (0.75 <= ratio < 0.95): width = 300px
        // - 1:1 square (0.95 <= ratio <= 1.2): width = 380px (pas)
        // - 16:9 widescreen landscape (ratio > 1.2): width = 460px (sedikit lebih ramping)
        let calculatedWidth = 380;
        if (ratio < 0.75) {
          calculatedWidth = 240;
        } else if (ratio < 0.95) {
          calculatedWidth = 300;
        } else if (ratio <= 1.2) {
          calculatedWidth = 380;
        } else {
          calculatedWidth = 460;
        }

        const attachmentBlock = `:::attachment{id="${attachId}" name="${file.name}" size="${formattedSize}" mime="${file.type}" isInline="true" width="${calculatedWidth}" url="${dataUrl}"}\n:::`;
        if (targetInsertIndexRef.current !== null) {
          const idx = targetInsertIndexRef.current;
          targetInsertIndexRef.current = null;
          const currentBlocks = [...parsedChronologicalBlocks];
          const newBlock: ChronoBlock = {
            type: 'attachment',
            id: attachId,
            data: {
              id: attachId,
              name: file.name,
              size: formattedSize,
              mime: file.type,
              isInlineImage: true,
              width: calculatedWidth,
              url: dataUrl,
            },
          };
          currentBlocks.splice(idx, 0, newBlock);
          if (idx + 1 >= currentBlocks.length || currentBlocks[idx + 1].type !== 'text') {
            currentBlocks.splice(idx + 1, 0, { type: 'text', id: `t-after-${attachId}`, content: '' });
          }
          reassembleAndSaveBlocks(currentBlocks);
        } else {
          insertBlockAtActivePosition(attachmentBlock);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Insert Subpage Block â€” Create inline block directly inside document box without pop-up modal jumpscare!
  const handleInsertPage = () => {
    if (subPageStack.length >= 4) {
      setMaxDepthWarning('Mencapai batas maksimal sub-halaman (Maksimal 4 tingkat).');
      setTimeout(() => setMaxDepthWarning(null), 3500);
      return;
    }

    const subPageId = 'page-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const defaultTitle = '';
    const initialContent = '';
    const subPageBlock = `:::subpage{id="${subPageId}" title="${escapeAttr(defaultTitle)}"}\n${encodeSubPageContent(initialContent)}\n:::`;

    insertBlockAtActivePosition(subPageBlock);
    setEditingSubpageId(subPageId);
  };

  const handleUpdateSubpageTitle = (subId: string, newTitle: string) => {
    const titleToUse = newTitle.trim();
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'subpage' && b.data.id === subId) {
        return {
          ...b,
          data: {
            ...b.data,
            title: titleToUse,
          },
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Update Subpage Layout ('small' | 'regular' | 'card')
  const handleUpdateSubpageLayout = (subId: string, newLayout: 'small' | 'regular' | 'card') => {
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'subpage' && b.data.id === subId) {
        return {
          ...b,
          data: {
            ...b.data,
            layout: newLayout,
          },
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Remove Subpage Block
  const handleDeleteSubpageBlock = (subId: string) => {
    const targetIdx = parsedChronologicalBlocks.findIndex((b) => b.type === 'subpage' && b.data.id === subId);
    const filtered = parsedChronologicalBlocks.filter((b) => b.type !== 'subpage' || b.data.id !== subId);
    reassembleAndSaveBlocks(filtered);
    setSelectedBlockIndices([]);
    focusNeighborTextBlock(targetIdx >= 0 ? targetIdx : 0, filtered);
  };

  // Remove Attachment
  const handleDeleteAttachment = (attId: string) => {
    const targetIdx = parsedChronologicalBlocks.findIndex((b) => b.type === 'attachment' && b.data.id === attId);
    const filtered = parsedChronologicalBlocks.filter((b) => b.type !== 'attachment' || b.data.id !== attId);
    globalAttachmentMap.delete(attId);
    reassembleAndSaveBlocks(filtered);
    setSelectedBlockIndices([]);
    focusNeighborTextBlock(targetIdx >= 0 ? targetIdx : 0, filtered);
  };

  // Update Attachment Layout (Small | Regular | Card)
  const handleUpdateAttachmentLayout = (attId: string, newLayout: 'small' | 'regular' | 'card') => {
    const updated = parsedChronologicalBlocks.map((b) => {
      if (b.type === 'attachment' && b.data.id === attId) {
        return {
          ...b,
          data: {
            ...b.data,
            layout: newLayout,
          },
        };
      }
      return b;
    });
    reassembleAndSaveBlocks(updated);
  };

  // Open In-App Rename Attachment Modal (No native browser prompt!)
  const handleRenameAttachment = (attId: string, currentName: string) => {
    setRenameTarget({ id: attId, name: currentName });
  };

  // Save Renamed Attachment from In-App Modal
  const handleSaveRenamedAttachment = (newName: string) => {
    if (renameTarget && newName && newName.trim() !== renameTarget.name) {
      const updated = parsedChronologicalBlocks.map((b) => {
        if (b.type === 'attachment' && b.data.id === renameTarget.id) {
          return {
            ...b,
            data: {
              ...b.data,
              name: newName.trim(),
            },
          };
        }
        return b;
      });
      reassembleAndSaveBlocks(updated);
    }
    setRenameTarget(null);
  };

  // Download File Attachment
  const handleDownloadAttachment = (att: FileAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name;
    a.click();
  };

  // Helper for human readable file type label
  const getReadableFileTypeLabel = (mime: string, name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    if (mime.includes('pdf') || ext === 'PDF') return 'PDF Document';
    if (mime.includes('spreadsheet') || ['XLSX', 'XLS', 'CSV'].includes(ext)) return 'Excel Spreadsheet';
    if (mime.includes('word') || ['DOCX', 'DOC'].includes(ext)) return 'Word Document';
    if (ext === 'TXT') return 'Text Document';
    if (['ZIP', 'RAR', '7Z'].includes(ext)) return 'Zip Archive';
    if (mime.startsWith('image/')) return `${ext} File`;
    return `${ext} File`;
  };

  // Word, Character & Reading Time Stats
  const activeText = activeSubPage ? activeSubPage.content : content;



  const wordCount = useMemo(() => {
    const trimmed = activeText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [activeText]);

  const charCount = useMemo(() => activeText.length, [activeText]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Extract Markdown Headings Outline
  const outlineHeadings = useMemo(() => {
    const lines = activeText.split('\n');
    const headings: { level: number; text: string }[] = [];
    lines.forEach((line: string) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const cleanTitle = match[2]
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/~~([^~]+)~~/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/<\/?(?:u|sup|sub)>/gi, '')
          .trim();
        headings.push({
          level: match[1].length,
          text: cleanTitle,
        });
      }
    });
    return headings;
  }, [activeText]);

  // Helper to clean raw block syntax (:::subpage...:::, :::attachment...:::) from subpage preview text and join lines with ' - '
  const cleanSubpagePreview = (rawContent: string) => {
    if (!rawContent) return '';
    const cleaned = rawContent
      .replace(/:::[a-zA-Z0-9_-]+(?:\{[^}]*\})?[\s\S]*?:::/g, '')
      .replace(/:::[^\n]+/g, '');

    const lines = cleaned
      .split('\n')
      .map((line) => line.replace(/^[#>\s-]+/g, '').replace(/[*_`~]/g, '').trim())
      .filter((line) => line.length > 0);

    return lines.join(' - ');
  };

  // Render a single media block â€” uniform left alignment, smooth drag, real image resize
  const renderSingleMediaBlock = (block: ChronoBlock, idx: number) => {
    const isDragging = draggedBlockIdx === idx;

    if (block.type === 'subpage') {
      const sub = block.data;
      const subLayout = sub.layout || 'regular';
      const preview = cleanSubpagePreview(sub.content || '');
      const isMenuOpen = activeSubpageMenuId === sub.id;

      const wordCountSub = sub.content.trim() ? sub.content.trim().split(/\s+/).filter(Boolean).length : 0;

      return (
        <div
          key={block.id}
          className={`group/block relative transition-all ${isDragging ? 'opacity-30 scale-[0.98]' : ''} ${
            subLayout === 'small' ? 'inline-block mr-2 my-1' : subLayout === 'card' ? 'w-full my-2.5' : 'w-full my-1.5'
          }`}
          onDragOver={(e) => handleDragOverBlock(idx, e)}
          onDrop={(e) => handleDropOnBlock(idx, e)}
        >
          {dropIndicatorState?.index === idx && (
            <DropIndicatorLine
              position={dropIndicatorState.position}
              label={dropIndicatorState.label}
            />
          )}
          
          {/* 6-dot grip â€” symmetrical left gutter rail */}
          <div
            draggable
            onDragStart={(e) => handleDragStartBlock(idx, e)}
            onDragEnd={handleDragEnd}
            className="absolute -left-7 top-2 w-6 h-6 text-white/40 group-hover/block:text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover/block:opacity-100 transition-all z-10 hover:bg-white/10 rounded-lg flex items-center justify-center"
            title="Klik untuk seleksi / geser Subpage"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* LAYOUT VARIANT 1: SMALL (Uniform Fixed Width - Matching File Attachment Small) */}
          {subLayout === 'small' ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (editingSubpageId === sub.id) return;
                setSubPageStack([...subPageStack, sub]);
              }}
              className={`relative w-[380px] max-w-full px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-3 select-none border ${
                selectedBlockIndices.includes(idx)
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.12] text-white'
                  : isAllSelected
                  ? 'ring-1 ring-white/30 border-white/30 bg-white/[0.09] text-white'
                  : 'glass-card'
              }`}
            >
              <CraftPageBadge />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {editingSubpageId === sub.id ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={sub.title || ''}
                    placeholder="Beri nama page..."
                    onFocus={(e) => {
                      if (e.target.value) e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUpdateSubpageTitle(sub.id, e.currentTarget.value);
                        setEditingSubpageId(null);
                      }
                    }}
                    onBlur={(e) => {
                      handleUpdateSubpageTitle(sub.id, e.target.value);
                      setEditingSubpageId(null);
                    }}
                    className="w-full bg-transparent border-0 outline-none p-0 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-bold text-white truncate">
                    {sub.title || 'Page Tanpa Judul'}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 font-normal shrink-0">
                {wordCountSub} Kata
              </span>

              {/* 3-Dots Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAttachmentMenuId(null);
                  setActiveSubpageMenuId(isMenuOpen ? null : sub.id);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors shrink-0"
                title="Opsi Subpage"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : subLayout === 'card' ? (
            /* LAYOUT VARIANT 2: CRAFT DOCS PAGE CARD (Cover Gradient Banner, Overlapping Floating Icon, Large Title, Clean Multi-line Excerpt, and Document Portal Footer) */
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (editingSubpageId === sub.id) return;
                setSubPageStack([...subPageStack, sub]);
              }}
              className={`relative w-full rounded-2xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-2xl overflow-hidden border select-none group/craftcard ${
                selectedBlockIndices.includes(idx)
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.12]'
                  : isAllSelected
                  ? 'ring-1 ring-white/30 border-white/30 bg-white/[0.09]'
                  : 'glass-card'
              }`}
            >
              {/* Top Monochrome Tempered Glass Cover Banner */}
              <div className="h-20 w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent border-b border-white/10 relative overflow-hidden flex items-start justify-between p-3.5">
                <div className="absolute -right-4 -top-6 w-32 h-32 bg-white/[0.06] rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-16 -bottom-8 w-24 h-24 bg-white/[0.04] rounded-full blur-xl pointer-events-none" />

                {/* Subpage Document Tag */}
                <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-bold text-indigo-200 tracking-wide">
                  <FileText className="w-3 h-3 text-indigo-300" />
                  <span>SUBPAGE</span>
                </div>

                {/* 3-Dots Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAttachmentMenuId(null);
                    setActiveSubpageMenuId(isMenuOpen ? null : sub.id);
                  }}
                  className="relative z-10 p-1.5 text-zinc-300 hover:text-white rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all shadow-md"
                  title="Opsi Subpage"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Overlapping Floating Page Icon */}
              <div className="relative -mt-6 ml-5 z-10 w-12 h-12 rounded-xl glass-control border-2 border-white/20 shadow-xl flex items-center justify-center text-white group-hover/craftcard:scale-105 group-hover/craftcard:border-white/40 transition-all">
                <FileText className="w-5 h-5 text-white stroke-[2.1]" />
              </div>

              {/* Card Body */}
              <div className="px-5 pt-2.5 pb-4 space-y-2">
                {editingSubpageId === sub.id ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={sub.title || ''}
                    placeholder="Beri judul halaman..."
                    onFocus={(e) => {
                      if (e.target.value) e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUpdateSubpageTitle(sub.id, e.currentTarget.value);
                        setEditingSubpageId(null);
                      }
                    }}
                    onBlur={(e) => {
                      handleUpdateSubpageTitle(sub.id, e.target.value);
                      setEditingSubpageId(null);
                    }}
                    className="w-full bg-transparent border-b border-white/45 pb-1 outline-none text-base font-extrabold text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                ) : (
                  <h3 className="text-base font-extrabold text-white tracking-tight group-hover/craftcard:text-white transition-colors">
                    {sub.title || 'Page Tanpa Judul'}
                  </h3>
                )}

                {preview ? (
                  <p className="text-xs text-zinc-300/85 line-clamp-3 leading-relaxed font-normal">
                    {preview}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 italic font-normal">Halaman catatan ini masih kosong. Klik untuk mulai menulis...</p>
                )}

                {/* Footer Metadata & Document Portal Affordance */}
                <div className="pt-3 mt-1 flex items-center justify-between border-t border-white/[0.08] text-[11px] text-zinc-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white/80 font-semibold">
                      ðŸ“„ {wordCountSub} Kata
                    </span>
                    <span>â€¢</span>
                    <span className="text-zinc-400">Sub-halaman</span>
                  </div>
                  <span className="text-white/80 group-hover/craftcard:text-white group-hover/craftcard:translate-x-0.5 transition-all inline-flex items-center gap-1 font-semibold text-xs">
                    Buka Halaman <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* LAYOUT VARIANT 3: REGULAR (Full-Width Horizontal Bar - Matching File Attachment Regular) */
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (editingSubpageId === sub.id) return;
                if (e.shiftKey && selectedBlockIndices.length > 0) {
                  const start = selectedBlockIndices[0];
                  const min = Math.min(start, idx);
                  const max = Math.max(start, idx);
                  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                  setSelectedBlockIndices(range);
                } else {
                  setSubPageStack([...subPageStack, sub]);
                }
              }}
              className={`relative p-3 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-3 select-none border w-full ${
                selectedBlockIndices.includes(idx)
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.10] text-white'
                  : isAllSelected
                  ? 'ring-1 ring-white/30 border-white/30 bg-white/[0.08] text-white'
                  : 'glass-card'
              }`}
            >
              <CraftPageBadge />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {editingSubpageId === sub.id ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={sub.title || ''}
                    placeholder="Beri nama page..."
                    onFocus={(e) => {
                      if (e.target.value) e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUpdateSubpageTitle(sub.id, e.currentTarget.value);
                        setEditingSubpageId(null);
                      }
                    }}
                    onBlur={(e) => {
                      handleUpdateSubpageTitle(sub.id, e.target.value);
                      setEditingSubpageId(null);
                    }}
                    className="w-full bg-transparent border-0 outline-none p-0 text-xs font-bold text-white placeholder:text-zinc-500 placeholder:font-normal focus:outline-none focus:ring-0 focus:border-0"
                  />
                ) : (
                  <h4
                    className={`text-xs font-bold truncate ${
                      sub.title ? 'text-white' : 'text-zinc-400 font-medium italic'
                    }`}
                  >
                    {sub.title || 'Page Tanpa Judul'}
                  </h4>
                )}
                {preview ? (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                    {preview}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 font-normal">
                    Sub-halaman Â· {wordCountSub} Kata
                  </p>
                )}
              </div>

              {/* 3-Dots Action Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAttachmentMenuId(null);
                  setActiveSubpageMenuId(isMenuOpen ? null : sub.id);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors shrink-0"
                title="Opsi Subpage"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 3-DOTS ACTION POPOVER DROPDOWN MENU FOR SUBPAGE */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-10 z-50 w-44 glass-popover rounded-2xl p-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150 select-none"
            >
              {/* Display Mode Option 1: Small */}
              <button
                onClick={() => {
                  handleUpdateSubpageLayout(sub.id, 'small');
                  setActiveSubpageMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  subLayout === 'small' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 text-zinc-400" />
                <span>Small</span>
              </button>

              {/* Display Mode Option 2: Regular */}
              <button
                onClick={() => {
                  handleUpdateSubpageLayout(sub.id, 'regular');
                  setActiveSubpageMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  subLayout === 'regular' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Square className="w-3.5 h-3.5 text-zinc-400" />
                <span>Regular</span>
              </button>

              {/* Display Mode Option 3: Card */}
              <button
                onClick={() => {
                  handleUpdateSubpageLayout(sub.id, 'card');
                  setActiveSubpageMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  subLayout === 'card' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
                <span>Card</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              {/* Option 4: Open Page */}
              <button
                onClick={() => {
                  setActiveSubpageMenuId(null);
                  setSubPageStack([...subPageStack, sub]);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-zinc-300 transition-colors text-left"
              >
                <FileText className="w-3.5 h-3.5 text-white/75" />
                <span>Open Page</span>
              </button>

              {/* Option 5: Rename */}
              <button
                onClick={() => {
                  setActiveSubpageMenuId(null);
                  setEditingSubpageId(sub.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-zinc-300 transition-colors text-left"
              >
                <CraftRenameIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Rename</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              {/* Option 6: Delete */}
              <button
                onClick={() => {
                  setActiveSubpageMenuId(null);
                  handleDeleteSubpageBlock(sub.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    if (block.type === 'attachment') {
      const att = block.data;
      const initialWidth = att.width || imageWidths[att.id] || 380;
      const currentWidth = imageWidths[att.id] || initialWidth;

      // Inline Image Block â€” resizable via corner drag handle
      if (att.isInlineImage) {
        return (
          <div
            key={block.id}
            data-img-container
            className={`group/block relative ${isDragging ? 'opacity-30 scale-[0.98]' : ''}`}
            style={{ width: `${currentWidth}px`, maxWidth: '100%' }}
            onDragOver={(e) => handleDragOverBlock(idx, e)}
            onDrop={(e) => handleDropOnBlock(idx, e)}
          >
            {dropIndicatorState?.index === idx && (
              <DropIndicatorLine
                position={dropIndicatorState.position}
                label={dropIndicatorState.label}
              />
            )}
            
            {/* Drag grip handle â€” symmetrical left gutter rail */}
            <div
              draggable
              onDragStart={(e) => handleDragStartBlock(idx, e)}
              onDragEnd={handleDragEnd}
              className="absolute -left-7 top-2 w-6 h-6 opacity-0 group-hover/block:opacity-100 transition-all text-white/40 group-hover/block:text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center"
              title="Geser Gambar"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <div
              className={`relative rounded-xl overflow-hidden shadow-xl transition-all ${
                isAllSelected
                  ? 'ring-1 ring-white/45 border border-white/40 bg-white/[0.10]'
                  : 'glass-card'
              }`}
            >
              <img
                src={att.url}
                alt={att.name}
                className="w-full h-auto object-cover rounded-xl"
                draggable={false}
                onLoad={(e) => {
                  if (!att.width && !imageWidths[att.id]) {
                    const imgEl = e.currentTarget;
                    const naturalWidth = imgEl.naturalWidth || 1;
                    const naturalHeight = imgEl.naturalHeight || 1;
                    const ratio = naturalWidth / naturalHeight;
                    let calculatedWidth = 380;
                    if (ratio < 0.75) {
                      calculatedWidth = 240; // 9:16 portrait
                    } else if (ratio < 0.95) {
                      calculatedWidth = 300; // 3:4 portrait
                    } else if (ratio <= 1.2) {
                      calculatedWidth = 380; // 1:1 square
                    } else {
                      calculatedWidth = 460; // 16:9 landscape
                    }
                    setImageWidths((prev) => ({ ...prev, [att.id]: calculatedWidth }));
                  }
                }}
              />

              {/* Floating Overlay Toolbar */}
              <div className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 transition-opacity bg-black/70 backdrop-blur-md rounded-lg p-1 flex items-center gap-1 border border-white/10 shadow-2xl z-10">
                <button
                  onClick={() => setPreviewAttachment(att)}
                  className="p-1 hover:bg-white/20 rounded-md text-zinc-300 hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRenameAttachment(att.id, att.name)}
                  className="p-1 hover:bg-white/20 rounded-md text-zinc-300 hover:text-white transition-colors"
                  title="Rename"
                >
                  <CraftRenameIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteAttachment(att.id)}
                  className="p-1 hover:bg-rose-600/60 rounded-md text-zinc-300 hover:text-white transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Corner Drag Resize Handle */}
            <div
              onMouseDown={(e) => handleImageResize(att.id, e)}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white/90 border-2 border-[#0B1830] rounded-full cursor-se-resize opacity-0 group-hover/block:opacity-100 transition-opacity shadow-lg z-30 flex items-center justify-center hover:scale-125"
              title="Tarik untuk ubah ukuran gambar"
            />
          </div>
        );
      }

      // File Attachment Block â€” Craft Docs layout modes: 'small' | 'regular' | 'card'
      const layoutMode = att.layout || 'regular';
      const isAudio = att.mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].some((ext) => att.name.toLowerCase().endsWith('.' + ext));
      const isMenuOpen = activeAttachmentMenuId === att.id;

      return (
        <div
          key={block.id}
          className={`group/block relative transition-all ${isDragging ? 'opacity-30 scale-[0.98]' : ''} ${
            layoutMode === 'small' ? 'inline-block mr-2 my-1' : layoutMode === 'card' ? 'inline-block mr-3 my-2' : 'w-full my-2'
          }`}
          onDragOver={(e) => handleDragOverBlock(idx, e)}
          onDrop={(e) => handleDropOnBlock(idx, e)}
        >
          {dropIndicatorState?.index === idx && (
            <DropIndicatorLine
              position={dropIndicatorState.position}
              label={dropIndicatorState.label}
            />
          )}
          
          {/* Drag grip handle â€” symmetrical left gutter rail */}
          <div
            draggable
            onDragStart={(e) => handleDragStartBlock(idx, e)}
            onDragEnd={handleDragEnd}
            className="absolute -left-7 top-2 w-6 h-6 text-white/40 group-hover/block:text-white/80 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover/block:opacity-100 transition-all z-10 hover:bg-white/10 rounded-lg flex items-center justify-center"
            title="Geser Attachment"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* LAYOUT VARIANT 1: SMALL (Uniform Fixed Width - Matching Subpage Small) */}
          {layoutMode === 'small' ? (
            <div
              onClick={() => setPreviewAttachment(att)}
              className={`relative w-[380px] max-w-full px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-3 select-none border ${
                isAllSelected
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.12] text-white'
                  : 'glass-card'
              }`}
            >
              <CraftFileTypeBadge mime={att.mime} name={att.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {att.name}
                </p>
              </div>
              <span className="text-[11px] text-zinc-400 font-normal shrink-0">
                {att.size}
              </span>

              {/* 3-Dots Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSubpageMenuId(null);
                  setActiveAttachmentMenuId(isMenuOpen ? null : att.id);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors shrink-0"
                title="Opsi Attachment"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : layoutMode === 'card' ? (
            /* LAYOUT VARIANT 2: CARD (Large Vertical Card - Screenshot 3) */
            <div
              onClick={() => setPreviewAttachment(att)}
              className={`relative w-52 p-4 rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center text-center select-none border ${
                isAllSelected
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.12] text-white'
                  : 'glass-card'
              }`}
            >
              {/* 3-Dots Action Button Top Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSubpageMenuId(null);
                  setActiveAttachmentMenuId(isMenuOpen ? null : att.id);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Opsi Attachment"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              <LargeCraftFileTypeBadge mime={att.mime} name={att.name} />

              <p className="text-xs font-bold text-white max-w-full truncate mt-3 leading-tight">
                {att.name}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-1 font-normal">
                {getReadableFileTypeLabel(att.mime, att.name)} Â· {att.size}
              </p>

              {/* Inline Audio Player if Audio */}
              {isAudio && (
                <div className="w-full mt-3 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                  <audio controls src={att.url} className="w-full h-7 rounded-lg" />
                </div>
              )}
            </div>
          ) : (
            /* LAYOUT VARIANT 3: REGULAR (Full-Width Horizontal Bar - Default - Screenshot 5) */
            <div
              onClick={() => setPreviewAttachment(att)}
              className={`relative p-3 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-3 select-none border w-full ${
                isAllSelected
                  ? 'ring-1 ring-white/45 border-white/40 bg-white/[0.10] text-white'
                  : 'glass-card'
              }`}
            >
              <CraftFileTypeBadge mime={att.mime} name={att.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {att.name}
                </p>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                  {getReadableFileTypeLabel(att.mime, att.name)} Â· {att.size}
                </p>

                {/* Inline Audio Player if Audio */}
                {isAudio && (
                  <div className="mt-2 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                    <audio controls src={att.url} className="w-full h-8 rounded-lg" />
                  </div>
                )}
              </div>

              {/* 3-Dots Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSubpageMenuId(null);
                  setActiveAttachmentMenuId(isMenuOpen ? null : att.id);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors shrink-0"
                title="Opsi Attachment"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 3-DOTS ACTION POPOVER DROPDOWN MENU (Craft Docs Screenshot 2) */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-10 z-40 w-44 glass-popover rounded-2xl p-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150 select-none"
            >
              {/* Display Mode Option 1: Small */}
              <button
                onClick={() => {
                  handleUpdateAttachmentLayout(att.id, 'small');
                  setActiveAttachmentMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  layoutMode === 'small' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 text-zinc-400" />
                <span>Small</span>
              </button>

              {/* Display Mode Option 2: Regular */}
              <button
                onClick={() => {
                  handleUpdateAttachmentLayout(att.id, 'regular');
                  setActiveAttachmentMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  layoutMode === 'regular' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Square className="w-3.5 h-3.5 text-zinc-400" />
                <span>Regular</span>
              </button>

              {/* Display Mode Option 3: Card */}
              <button
                onClick={() => {
                  handleUpdateAttachmentLayout(att.id, 'card');
                  setActiveAttachmentMenuId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${
                  layoutMode === 'card' ? 'liquid-lens-active text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
                <span>Card</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              {/* Option 4: Rename */}
              <button
                onClick={() => {
                  setActiveAttachmentMenuId(null);
                  handleRenameAttachment(att.id, att.name);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-zinc-300 transition-colors text-left"
              >
                <CraftRenameIcon className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>

              <div className="my-1 border-t border-white/5" />

              {/* Option 5: Download */}
              <button
                onClick={(e) => {
                  setActiveAttachmentMenuId(null);
                  handleDownloadAttachment(att, e);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-zinc-300 transition-colors text-left"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Download</span>
              </button>

              {/* Option 6: Delete */}
              <button
                onClick={() => {
                  setActiveAttachmentMenuId(null);
                  handleDeleteAttachment(att.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors text-left font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    if (block.type === 'code') {
      return (
        <CodeBlockRenderer
          key={block.id}
          block={block}
          idx={idx}
          isDragging={isDragging}
          dropIndicatorState={dropIndicatorState}
          isAllSelected={isAllSelected}
          isSelected={selectedBlockIndices.includes(idx)}
          onSelectBlock={(shiftKey) => {
            if (shiftKey && selectedBlockIndices.length > 0) {
              const start = selectedBlockIndices[0];
              const min = Math.min(start, idx);
              const max = Math.max(start, idx);
              setSelectedBlockIndices(Array.from({ length: max - min + 1 }, (_, i) => min + i));
            } else {
              setSelectedBlockIndices([idx]);
            }
          }}
          onUpdateCode={handleUpdateCodeBlock}
          onDeleteBlock={handleDeleteCodeBlock}
          onDragStart={handleDragStartBlock}
          onDragOver={handleDragOverBlock}
          onDrop={handleDropOnBlock}
          onDragEnd={handleDragEnd}
        />
      );
    }

    if (block.type === 'mermaid') {
      return (
        <MermaidBlockRenderer
          key={block.id}
          block={block}
          idx={idx}
          isDragging={isDragging}
          dropIndicatorState={dropIndicatorState}
          isAllSelected={isAllSelected}
          isSelected={selectedBlockIndices.includes(idx)}
          onSelectBlock={(shiftKey) => {
            if (shiftKey && selectedBlockIndices.length > 0) {
              const start = selectedBlockIndices[0];
              const min = Math.min(start, idx);
              const max = Math.max(start, idx);
              setSelectedBlockIndices(Array.from({ length: max - min + 1 }, (_, i) => min + i));
            } else {
              setSelectedBlockIndices([idx]);
            }
          }}
          onUpdateMermaid={handleUpdateMermaidBlock}
          onDeleteBlock={handleDeleteMermaidBlock}
          onDragStart={handleDragStartBlock}
          onDragOver={handleDragOverBlock}
          onDrop={handleDropOnBlock}
          onDragEnd={handleDragEnd}
        />
      );
    }

    if (block.type === 'collection') {
      return (
        <CollectionBlockRenderer
          key={block.id}
          data={block.data}
          idx={idx}
          isDragging={isDragging}
          dropIndicatorState={dropIndicatorState}
          isAllSelected={isAllSelected}
          isSelected={selectedBlockIndices.includes(idx)}
          onSelectBlock={(shiftKey) => {
            if (shiftKey && selectedBlockIndices.length > 0) {
              const start = selectedBlockIndices[0];
              const min = Math.min(start, idx);
              const max = Math.max(start, idx);
              setSelectedBlockIndices(Array.from({ length: max - min + 1 }, (_, i) => min + i));
            } else {
              setSelectedBlockIndices([idx]);
            }
          }}
          onUpdate={(updatedData) => handleUpdateCollectionBlock(block.id, updatedData)}
          onDelete={() => handleDeleteCollectionBlock(block.id)}
          onDragStart={handleDragStartBlock}
          onDragOver={handleDragOverBlock}
          onDrop={handleDropOnBlock}
          onDragEnd={handleDragEnd}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden font-sans relative select-text">
      {/* Hidden Native File Inputs */}
      <input
        ref={fileAttachmentInputRef}
        type="file"
        onChange={handleFileAttachmentSelected}
        className="hidden"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.png,.jpg,.jpeg,.webp,.svg,.zip,.rar,.txt,.csv,.json,.mp4,.mp3"
      />
      <input
        ref={imageBlockInputRef}
        type="file"
        onChange={handleImageBlockSelected}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
      />

      {/* Top Floating Tempered Glass Editor Header Dock (Breadcrumb Path + In-Note Word Search + Actions) */}
      <div className="mx-3 sm:mx-5 mt-3 mb-1 px-4 h-13 rounded-2xl glass-sidebar flex items-center justify-between gap-4 shrink-0 select-none">
        {/* Left: Folder Path Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 overflow-x-auto max-w-[42%] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {!isSidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl glass-control shrink-0 mr-1 flex items-center"
              title="Tampilkan Sidebar Navigasi Kiri"
            >
              <svg className="w-4 h-3.5" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="1.5" width="17" height="13" rx="2.5" />
                <line x1="6.5" y1="1.5" x2="6.5" y2="14.5" />
              </svg>
            </button>
          )}
          {/* Home Icon Button */}
          <button
            onClick={() => {
              if (onSubjectChange) onSubjectChange(null);
              if (onFilterChange) onFilterChange('all');
              if (onClose) onClose(note);
            }}
            className="p-1.5 text-white/65 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 flex items-center"
            title="Kembali ke Beranda (Dashboard)"
          >
            <Home className="w-4 h-4 stroke-[2]" />
          </button>

          {subject ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <button
                onClick={() => {
                  if (onSubjectChange) onSubjectChange(subject);
                  if (onClose) onClose(note);
                }}
                className="flex items-center gap-1.5 text-white/65 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 font-medium shrink-0"
                title={`Ke Folder ${subject}`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">{subject}</span>
              </button>
            </>
          ) : null}

          <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <button
            onClick={() => setSubPageStack([])}
            className={`font-semibold transition-colors truncate shrink-0 max-w-[140px] sm:max-w-[200px] leading-none px-2 py-1 rounded-lg hover:bg-white/10 ${
              subPageStack.length === 0 ? 'text-white' : 'text-white/65 hover:text-white'
            }`}
            title="Catatan Utama"
          >
            {title || 'Catatan Tanpa Judul'}
          </button>

          {/* Render Subpage Stack Breadcrumbs */}
          {subPageStack.map((sub, index) => (
            <React.Fragment key={sub.id || index}>
              <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <button
                onClick={() => setSubPageStack(subPageStack.slice(0, index + 1))}
                className={`flex items-center gap-1.5 transition-colors truncate shrink-0 max-w-[120px] sm:max-w-[160px] font-semibold px-2 py-1 rounded-lg hover:bg-white/10 ${
                  index === subPageStack.length - 1 ? 'text-white' : 'text-white/65 hover:text-white'
                }`}
                title={`Navigasi ke subpage ${sub.title || 'Page'}`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">{sub.title || 'Page Title'}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Center: Embedded In-Note Word Search Pill */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xs relative items-center">
          <Search className="w-3.5 h-3.5 text-white/45 absolute left-3 pointer-events-none" />
          <input
            ref={inNoteSearchInputRef}
            type="text"
            value={inNoteSearchQuery}
            onChange={(e) => setInNoteSearchQuery(e.target.value)}
            placeholder="Cari kata di catatan..."
            className="w-full h-8 pl-8 pr-7 glass-input rounded-full text-xs text-white placeholder:text-white/40 focus:outline-none transition-all"
          />
          {inNoteSearchQuery && (
            <button
              onClick={() => setInNoteSearchQuery('')}
              className="absolute right-2 p-0.5 text-white/50 hover:text-white rounded-full"
              title="Hapus pencarian kata"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Top Right Editor Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
          {/* Undo / Redo Tempered Glass Pill */}
          <div className="flex items-center glass-control rounded-full p-0.5 gap-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndexRef.current <= 0}
              aria-label="Undo / Batalkan"
              className="p-1.5 q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-full transition-colors disabled:opacity-25 disabled:hover:bg-transparent"
              title="Batalkan / Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndexRef.current >= historyRef.current.length - 1}
              aria-label="Redo / Ulangi"
              className="p-1.5 q-text-secondary hover:q-text-primary hover:bg-white/10 rounded-full transition-colors disabled:opacity-25 disabled:hover:bg-transparent"
              title="Ulangi / Redo (Ctrl+Y atau Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Version History Log Button */}
          <button
            onClick={() => setIsVersionHistoryOpen(true)}
            aria-label="Log Riwayat Versi"
            className="p-2 glass-control rounded-xl transition-all"
            title="Log Riwayat Versi / Restore Progress"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* PanelRight Toggle Icon (At the Very Corner / Paling Pojok Kanan) */}
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            aria-label="Toggle Sidebar Kanan"
            className={`p-2 rounded-xl transition-all border ${
              isRightSidebarOpen
                ? 'liquid-lens-active q-text-primary'
                : 'glass-control'
            }`}
            title={isRightSidebarOpen ? 'Tutup Sidebar Kanan' : 'Buka Sidebar Kanan (Craft Panel)'}
          >
            <svg className="w-4 h-3.5" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="1.5" width="17" height="13" rx="2.5" />
              <line x1="13.5" y1="1.5" x2="13.5" y2="14.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Max Depth Alert Banner */}
      {maxDepthWarning && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs font-semibold text-amber-300 animate-in fade-in duration-200 z-10 select-none">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{maxDepthWarning}</span>
          </div>
          <button onClick={() => setMaxDepthWarning(null)} className="hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Body Area: Central Inset Tempered Glass Editor Card + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden bg-transparent px-2 sm:px-4 pt-2 pb-3 gap-3">
        {/* Main Editor Canvas Inset Card */}
        <div
          ref={canvasScrollRef}
          onClick={handleEmptyCanvasClick}
          onMouseDown={handleMouseDownCanvas}
          className="flex-1 flex flex-col p-6 sm:p-10 overflow-y-auto space-y-1 max-w-[860px] w-full mx-auto pb-32 cursor-text select-text glass-editor-sheet rounded-3xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Title Input */}
          <input
            ref={titleRef}
            type="text"
            maxLength={150}
            spellCheck={false}
            value={activeSubPage ? activeSubPage.title : title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={activeSubPage ? 'Page Title' : 'Judul catatan...'}
            className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent text-white placeholder:text-slate-500 border-none focus:outline-none tracking-tight leading-tight select-text mb-3"
          />

          {/* Seamless Floating Tags Bar (Monochrome) */}
          <div className="flex flex-wrap items-center gap-2 py-1 text-xs font-medium mb-5 select-none">
            {/* Simple Tag Icon (Right-facing) */}
            <svg className="w-4 h-4 text-white/55 shrink-0 -scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l5.58-5.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-slate-100 text-[11px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                {t}
                <button
                  onClick={() => handleRemoveTag(t)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Hapus tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Add Tag Input */}
            <input
              type="text"
              spellCheck={false}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="+ Tag (Enter)..."
              className="bg-transparent text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none w-24 py-0.5"
            />
          </div>

          {/* Floating iOS 26 Liquid Glass Text Selection Toolbar */}
          {selectionToolbar && (
            <div
              className="floating-selection-toolbar fixed z-[100] flex items-center gap-0.5 liquid-pill rounded-full px-1.5 py-1 text-white select-none transition-all h-8"
              style={{ top: `${selectionToolbar.top}px`, left: `${Math.max(8, selectionToolbar.left)}px` }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {/* Highlight / Color Picker */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.highlight || showColorPicker
                    ? 'liquid-lens-active q-text-primary'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Warna Teks & Highlight"
              >
                <Highlighter className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              {/* Bold */}
              <button
                onClick={() => applyFormatting('**')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.bold
                    ? 'liquid-lens-active q-text-primary'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Bold (Tebal)"
              >
                <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Italic */}
              <button
                onClick={() => applyFormatting('*')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.italic
                    ? 'liquid-lens-active q-text-primary'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Italic (Miring)"
              >
                <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Pure Underline */}
              <button
                onClick={() => applyFormatting('<u>')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.underline
                    ? 'liquid-lens-active q-text-primary'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Underline (Garis Bawah)"
              >
                <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => applyFormatting('~~')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.strikethrough
                    ? 'liquid-lens-active q-text-primary'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Strikethrough (Coret Tengah)"
              >
                <Strikethrough className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Pure Inline Code */}
              <button
                onClick={() => applyFormatting('`')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.code
                    ? 'liquid-lens-active text-white'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Inline Code (Kode Pill)"
              >
                <Code className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Pure Math Equation */}
              <button
                onClick={() => applyFormatting('$')}
                className={`px-1.5 py-1 rounded-full transition-all flex items-center justify-center ${
                  activeFormats.math
                    ? 'liquid-lens-active text-white'
                    : 'q-text-secondary hover:q-text-primary hover:bg-white/10'
                }`}
                title="Persamaan Matematika (Math Equation)"
              >
                <Sigma className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Pure Clear Format */}
              <button
                onClick={() => applyFormatting('clear')}
                className="px-1.5 py-1 rounded-full q-text-muted hover:text-rose-400 hover:bg-rose-500/15 transition-all flex items-center justify-center"
                title="Hapus Format (Clear Formatting)"
              >
                <Eraser className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              {/* Color Palette Dropdown Menu */}
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 z-50 glass-popover rounded-2xl p-3 w-[220px] text-xs font-sans animate-in fade-in zoom-in-95 duration-150 select-none">
                  {/* Baru digunakan / Hapus highlight section */}
                  <div className="mb-2.5">
                    <div className="text-[12px] font-medium text-zinc-300 mb-1.5 px-0.5">
                      {activeFormats.highlight ? 'Hapus highlight' : 'Baru digunakan'}
                    </div>
                    {activeFormats.highlight ? (
                      <button
                        onClick={() => applyColor('default')}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 w-full font-medium transition-all text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hapus highlight</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => applyColor(lastUsedColor)}
                        className={`w-7 h-7 rounded-lg border border-white/20 hover:scale-105 transition-all flex items-center justify-center ${
                          NOTION_COLORS.find((c) => c.id === lastUsedColor)?.bgClass || 'bg-[#3f3214]'
                        }`}
                        title={`Gunakan lagi: ${lastUsedColor}`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NOTION_COLORS.find((c) => c.id === lastUsedColor)?.dotColor || '#f2c94c' }} />
                      </button>
                    )}
                  </div>

                  {/* Warna teks (5-column grid) */}
                  <div className="mb-3">
                    <div className="text-[12px] font-medium text-zinc-300 mb-1.5 px-0.5">
                      Warna teks
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => applyTextColor('default')}
                        className="w-7 h-7 rounded-lg bg-[#2e2e32] border border-white/10 hover:border-white/40 flex items-center justify-center text-white font-bold text-xs transition-all"
                        title="Default Teks"
                      >
                        A
                      </button>
                      {NOTION_COLORS.map((c) => (
                        <button
                          key={`txt-${c.id}`}
                          onClick={() => applyTextColor(c.id)}
                          className={`w-7 h-7 rounded-lg bg-[#2e2e32] border border-white/10 hover:border-white/40 flex items-center justify-center font-bold text-xs transition-all ${c.textClass}`}
                          title={`Teks ${c.name}`}
                        >
                          A
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warna latar belakang (5-column grid) */}
                  <div>
                    <div className="text-[12px] font-medium text-zinc-300 mb-1.5 px-0.5">
                      Warna latar belakang
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => applyColor('default')}
                        className="w-7 h-7 rounded-lg bg-[#2e2e32] border border-white/10 hover:border-white/40 flex items-center justify-center text-zinc-400 text-xs transition-all"
                        title="Tanpa Highlight"
                      >
                        âœ•
                      </button>
                      {NOTION_COLORS.map((c) => (
                        <button
                          key={`bg-${c.id}`}
                          onClick={() => {
                            setLastUsedColor(c.id);
                            applyColor(c.id);
                          }}
                          className={`w-7 h-7 rounded-lg ${c.bgClass} border border-white/10 hover:border-white/40 hover:scale-105 flex items-center justify-center transition-all`}
                          title={c.name}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dotColor }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC CHRONOLOGICAL BLOCK FLOW */}
          <div className="flex-1 flex flex-col select-text">
            {(() => {
              const elements: React.ReactNode[] = [];
              let imageGroupBuffer: { block: ChronoBlock; index: number }[] = [];

              const flushImageBuffer = () => {
                if (imageGroupBuffer.length === 0) return;
                if (imageGroupBuffer.length === 1) {
                  elements.push(
                    <div key={`img-solo-${imageGroupBuffer[0].index}`} className="my-1">
                      {renderSingleMediaBlock(imageGroupBuffer[0].block, imageGroupBuffer[0].index)}
                    </div>
                  );
                } else {
                  elements.push(
                    <div key={`img-row-${imageGroupBuffer[0].index}`} className="flex flex-wrap items-start gap-2.5 my-1 w-full">
                      {imageGroupBuffer.map(({ block, index }) => renderSingleMediaBlock(block, index))}
                    </div>
                  );
                }
                imageGroupBuffer = [];
              };

              parsedChronologicalBlocks.forEach((block, idx) => {
                if (block.type === 'text') {
                  flushImageBuffer();

                  const isSelected = selectedBlockIndices.includes(idx);

                  const isPrevSelected = selectedBlockIndices.includes(idx - 1);
                  const isNextSelected = selectedBlockIndices.includes(idx + 1);
                  const selectedRadiusClass = isSelected
                    ? !isPrevSelected && !isNextSelected
                      ? 'rounded-lg'
                      : !isPrevSelected && isNextSelected
                      ? 'rounded-t-lg rounded-b-none'
                      : isPrevSelected && isNextSelected
                      ? 'rounded-none'
                      : 'rounded-b-lg rounded-t-none'
                    : 'rounded-lg';

                  elements.push(
                    <div
                      key={block.id}
                      data-block-idx={idx}
                      className={`group/tblock relative transition-colors duration-75 w-full leading-[25px] px-1.5 py-[3px] ${selectedRadiusClass} ${
                        isSelected
                          ? 'bg-white/[0.08] text-white'
                          : 'hover:bg-white/[0.025]'
                      } ${draggedBlockIdx === idx ? 'opacity-30 scale-[0.98]' : ''}`}
                      onDragOver={(e) => handleDragOverBlock(idx, e)}
                      onDrop={(e) => handleDropOnBlock(idx, e)}
                    >
                      {dropIndicatorState?.index === idx && (
                        <DropIndicatorLine
                          position={dropIndicatorState.position}
                          label={dropIndicatorState.label}
                        />
                      )}

                      {/* 6-dot Grip Handle â€” Identical -left-7 w-6 h-6 Rail */}
                      <div
                        className={`absolute -left-7 top-[1px] w-6 h-[28px] flex items-center justify-center select-none transition-all duration-75 z-20 ${
                          isSelected
                            ? 'opacity-100'
                            : 'opacity-0 group-hover/tblock:opacity-100'
                        }`}
                      >
                        <div
                          draggable
                          onClick={(e) => {
                            e.stopPropagation();
                            // Clear text selection range & toolbar to prevent double highlight!
                            window.getSelection()?.removeAllRanges();
                            setSelectionToolbar(null);
                            setShowColorPicker(false);

                            if (e.shiftKey && selectedBlockIndices.length > 0) {
                              const start = selectedBlockIndices[0];
                              const min = Math.min(start, idx);
                              const max = Math.max(start, idx);
                              const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                              setSelectedBlockIndices(range);
                            } else {
                              setSelectedBlockIndices(isSelected && selectedBlockIndices.length === 1 ? [] : [idx]);
                            }
                          }}
                          onDragStart={(e) => handleDragStartBlock(idx, e)}
                          onDragEnd={handleDragEnd}
                          className="w-6 h-6 text-white/45 hover:text-white hover:bg-white/10 rounded-lg cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
                          title="Klik (atau Shift+Klik) untuk seleksi / geser blok"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </div>

                      {/* 3-Dots Action Menu Button on Right - Mathematically Centered via Flexbox Line Height */}
                      <div
                        className={`absolute right-1 top-0 h-[30px] flex items-center transition-opacity duration-75 z-20 ${
                          isSelected || activeBlockMenuIdx === idx
                            ? 'opacity-100'
                            : 'opacity-0 group-hover/tblock:opacity-100'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlockIndices([idx]);
                            setActiveBlockMenuIdx(activeBlockMenuIdx === idx ? null : idx);
                          }}
                          className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                          title="Opsi Blok"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                          {/* Popover Dropdown Menu for Block */}
                          {activeBlockMenuIdx === idx && (
                            <div className="absolute right-0 top-7 w-44 glass-popover rounded-2xl z-50 overflow-hidden p-1.5 text-xs font-semibold q-text-secondary space-y-0.5">
                              <button
                                onClick={() => handleDuplicateBlockByIdx(idx)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:q-text-primary text-left transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 q-text-muted" />
                                <span>Duplikat Blok</span>
                              </button>
                              <button
                                onClick={() => handleMoveBlockUp(idx)}
                                disabled={idx === 0}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:q-text-primary text-left transition-colors disabled:opacity-30"
                              >
                                <ArrowUp className="w-3.5 h-3.5 q-text-muted" />
                                <span>Geser Ke Atas</span>
                              </button>
                              <button
                                onClick={() => handleMoveBlockDown(idx)}
                                disabled={idx === parsedChronologicalBlocks.length - 1}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 hover:q-text-primary text-left transition-colors disabled:opacity-30"
                              >
                                <ArrowDown className="w-3.5 h-3.5 q-text-muted" />
                                <span>Geser Ke Bawah</span>
                              </button>
                              <div className="my-1 border-t q-border" />
                              <button
                                onClick={() => handleDeleteSelectedBlocks()}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-500/15 text-rose-400 text-left transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus Blok</span>
                              </button>
                            </div>
                          )}
                        </div>

                      {(() => {
                        const raw = block.content || '';
                        const classified = classifyTextBlock(raw);

                        if (classified.kind === 'divider') {
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlockIndices([idx]);
                              }}
                              className="py-3 w-full flex items-center cursor-pointer group/hr"
                              title="Divider â€” klik lalu tekan Backspace/Delete untuk hapus"
                            >
                              <hr className="w-full border-0 border-t border-white/15 group-hover/hr:border-white/35 transition-colors" />
                            </div>
                          );
                        }

                        const displayContent = classified.content;
                        const blockPrefix = classified.prefix;
                        const rtl = isRtlText(displayContent);

                        let editorClassName = '';
                        if (classified.kind === 'heading') {
                          switch (classified.level) {
                            case 1:
                              editorClassName = 'text-[30px] font-extrabold text-white tracking-[-0.025em] leading-[1.24] pt-3.5 pb-1';
                              break;
                            case 2:
                              editorClassName = 'text-[24px] font-bold text-white tracking-[-0.02em] leading-[1.28] pt-3 pb-0.5';
                              break;
                            case 3:
                              editorClassName = 'text-[19.5px] font-bold text-white/95 tracking-[-0.015em] leading-[1.34] pt-2.5 pb-0.5';
                              break;
                            case 4:
                              editorClassName = 'text-[17px] font-semibold text-white/90 tracking-[-0.01em] leading-[1.38] pt-2';
                              break;
                            case 5:
                              editorClassName = 'text-[15px] font-semibold text-white/75 tracking-[0em] leading-[1.42] pt-1.5';
                              break;
                            case 6:
                              editorClassName = 'text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white/55 leading-[1.45] pt-1.5';
                              break;
                          }
                        } else if (classified.kind === 'checklist') {
                          editorClassName = classified.checked
                            ? 'text-white/45 line-through text-[15px] leading-[26px] tracking-[-0.01em] font-normal'
                            : 'text-zinc-200 text-[15px] leading-[26px] tracking-[-0.01em] font-normal';
                        } else if (classified.kind === 'blockquote') {
                          editorClassName = 'text-white/85 text-[15px] leading-[26px] tracking-[-0.01em] font-normal';
                        }

                        if (rtl) {
                          editorClassName = `${editorClassName || 'text-zinc-200 text-[15px] leading-[26px] tracking-[-0.01em] font-normal'} text-right`;
                        }

                        const handleListIndent =
                          classified.kind === 'checklist' || classified.kind === 'bullet' || classified.kind === 'ordered'
                            ? (delta: 1 | -1) => {
                                const currentSpaces = classified.indent.replace(/\t/g, '  ').length;
                                const nextSpaces = Math.max(0, Math.min(12, currentSpaces + delta * 2));
                                const nextIndent = ' '.repeat(nextSpaces);
                                if (classified.kind === 'checklist') {
                                  handleTextBlockUpdate(idx, `${nextIndent}- [${classified.checked ? 'x' : ' '}] ${classified.content}`);
                                } else if (classified.kind === 'bullet') {
                                  handleTextBlockUpdate(idx, `${nextIndent}â€¢ ${classified.content}`);
                                } else {
                                  handleTextBlockUpdate(idx, `${nextIndent}${classified.ordinal}. ${classified.content}`);
                                }
                              }
                            : undefined;

                        const richEditorEl = (
                          <RichTextBlock
                            id={`editor-${block.id}`}
                            className={editorClassName}
                            editorRef={(el) => {
                              if (el) textareaRefs.current.set(block.id, el);
                              else textareaRefs.current.delete(block.id);
                            }}
                            content={displayContent}
                            onFocus={() => {
                              lastFocusedBlockIdxRef.current = idx;
                              setActiveTextBlockIndex(idx);
                              setSelectedBlockIndices([]);
                              setSelectionToolbar(null);
                            }}
                            onBlur={() => {
                              if (activeTextBlockIndex === idx) setActiveTextBlockIndex(null);
                            }}
                            onChange={(newMd) => {
                              lastFocusedBlockIdxRef.current = idx;
                              handleTextBlockUpdate(idx, blockPrefix ? `${blockPrefix}${newMd}` : newMd);
                            }}
                            onSelect={() => {
                              lastFocusedBlockIdxRef.current = idx;
                              handleTextSelect(idx);
                            }}
                            onIndentChange={handleListIndent}
                            onInsertImageBlock={(blockMd) => insertBlockAtActivePosition(blockMd)}
                            onDeleteEmptyBlock={() => {
                              if (blockPrefix) {
                                handleTextBlockUpdate(idx, '');
                              } else {
                                handleDeleteBlockAtIndex(idx);
                              }
                            }}
                            onSplitBlockAtCaret={(before, after) => {
                              if (classified.kind === 'checklist') {
                                if (!before.trim() && !after.trim()) {
                                  handleTextBlockUpdate(idx, '');
                                  return;
                                }
                                handleSplitBlockAtCaret(idx, `${blockPrefix}${before}`, `${classified.indent}- [ ] ${after}`);
                                return;
                              }
                              if (classified.kind === 'bullet') {
                                if (!before.trim() && !after.trim()) {
                                  handleTextBlockUpdate(idx, '');
                                  return;
                                }
                                handleSplitBlockAtCaret(idx, `${blockPrefix}${before}`, `${classified.indent}â€¢ ${after}`);
                                return;
                              }
                              if (classified.kind === 'ordered') {
                                if (!before.trim() && !after.trim()) {
                                  handleTextBlockUpdate(idx, '');
                                  return;
                                }
                                const numVal = parseInt(classified.ordinal, 10);
                                const nextOrd = !Number.isNaN(numVal) ? `${numVal + 1}` : classified.ordinal;
                                handleSplitBlockAtCaret(idx, `${blockPrefix}${before}`, `${classified.indent}${nextOrd}. ${after}`);
                                return;
                              }
                              if (blockPrefix) {
                                handleSplitBlockAtCaret(idx, `${blockPrefix}${before}`, after);
                                return;
                              }
                              handleSplitBlockAtCaret(idx, before, after);
                            }}
                            onMergeWithPreviousBlock={() => {
                              if (blockPrefix) {
                                handleTextBlockUpdate(idx, displayContent);
                              } else {
                                handleMergeBlockWithPrevious(idx);
                              }
                            }}
                            onDragOver={(e) => handleDragOverBlock(idx, e)}
                            onDrop={(e) => handleDropOnBlock(idx, e)}
                            onPasteMultiLine={(rawText) => {
                              const pastedBlocks = parsePastedTextToChronoBlocks(rawText);
                              if (pastedBlocks.length === 0) return;
                              const updated = [...parsedChronologicalBlocks];
                              const currentBlock = updated[idx];
                              const isCurrentEmpty = currentBlock?.type === 'text' && !currentBlock.content.trim();
                              if (isCurrentEmpty) {
                                updated.splice(idx, 1, ...pastedBlocks);
                              } else {
                                updated.splice(idx + 1, 0, ...pastedBlocks);
                              }
                              reassembleAndSaveBlocks(updated);
                            }}
                            placeholder={
                              classified.kind === 'checklist'
                                ? 'Item checklist...'
                                : classified.kind === 'blockquote'
                                ? 'Kutipan...'
                                : classified.kind === 'heading'
                                ? `Heading ${classified.level}...`
                                : idx === 0
                                ? activeSubPage
                                  ? 'Mulai ketik isi subpage di sini...'
                                  : 'Mulai ketik catatan di sini...'
                                : ''
                            }
                          />
                        );

                        if (classified.kind === 'checklist') {
                          const indentPx = classified.depth * 22;
                          return (
                            <div
                              className="flex items-start gap-2.5 w-full"
                              style={{ paddingLeft: indentPx > 0 ? `${indentPx}px` : undefined }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextMark = classified.checked ? ' ' : 'x';
                                  handleTextBlockUpdate(idx, `${classified.indent}- [${nextMark}] ${classified.content}`);
                                }}
                                className={`mt-[4px] w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${
                                  classified.checked
                                    ? 'bg-white/90 border-white text-[#071124] shadow-xs'
                                    : 'bg-white/[0.05] border-white/25 hover:border-white/50 text-transparent'
                                }`}
                                title={classified.checked ? 'Tandai belum selesai' : 'Tandai selesai'}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                              <div className="flex-1 min-w-0">{richEditorEl}</div>
                            </div>
                          );
                        }

                        if (classified.kind === 'bullet') {
                          const indentPx = classified.depth * 22;
                          return (
                            <div
                              className="flex items-start gap-2 w-full"
                              style={{ paddingLeft: `${indentPx + 4}px` }}
                            >
                              <span className="select-none text-white/55 text-[15px] leading-[26px] w-4 text-center shrink-0">
                                {classified.marker}
                              </span>
                              <div className="flex-1 min-w-0">{richEditorEl}</div>
                            </div>
                          );
                        }

                        if (classified.kind === 'ordered') {
                          const indentPx = classified.depth * 22;
                          return (
                            <div
                              className="flex items-start gap-2 w-full"
                              style={{ paddingLeft: `${indentPx + 4}px` }}
                            >
                              <span className="select-none text-white/55 text-[14px] font-medium leading-[26px] min-w-[20px] text-right shrink-0 tabular-nums">
                                {classified.ordinal}.
                              </span>
                              <div className="flex-1 min-w-0">{richEditorEl}</div>
                            </div>
                          );
                        }

                        if (classified.kind === 'blockquote') {
                          const quoteBorders = [
                            'border-l-[2.5px] border-white/30',
                            'border-l-[2.5px] border-white/22',
                            'border-l-[2.5px] border-white/16',
                            'border-l-[2.5px] border-white/12',
                          ];
                          let nested: React.ReactNode = richEditorEl;
                          for (let d = classified.depth - 1; d >= 0; d--) {
                            nested = (
                              <div
                                key={d}
                                className={`${quoteBorders[Math.min(d, quoteBorders.length - 1)]} pl-3.5 py-0.5`}
                              >
                                {nested}
                              </div>
                            );
                          }
                          return nested;
                        }

                        return richEditorEl;
                      })()}
                    </div>
                  );
                } else if (block.type === 'attachment' && block.data.isInlineImage) {
                  imageGroupBuffer.push({ block, index: idx });
                } else {
                  flushImageBuffer();
                  elements.push(
                    <div
                      key={`media-${idx}`}
                      data-block-idx={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedBlockIndices([idx]); }}
                      className={`group/tblock relative my-1 rounded-xl transition-colors border ${
                        selectedBlockIndices.includes(idx)
                          ? 'bg-white/[0.08] border-white/25'
                          : 'border-transparent'
                      }`}
                    >
                      {renderSingleMediaBlock(block, idx)}
                    </div>
                  );
                }
              });

              flushImageBuffer();
              return elements;
            })()}
          </div>

          {/* Canvas Bottom Padding Zone */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              focusEditorAtEnd();
            }}
            className="canvas-bottom-pad h-24 w-full cursor-text relative"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = draggedSidebarItemRef.current ? 'copy' : 'move';
              if (parsedChronologicalBlocks.length > 0) {
                const lastIdx = parsedChronologicalBlocks.length - 1;
                if (
                  dropIndicatorStateRef.current &&
                  dropIndicatorStateRef.current.index === lastIdx &&
                  dropIndicatorStateRef.current.position === 'after'
                ) {
                  return;
                }
                const nextState = {
                  index: lastIdx,
                  position: 'after' as const,
                  label: draggedSidebarItemRef.current?.label || 'Pindah Blok',
                };
                dropIndicatorStateRef.current = nextState;
                setDropIndicatorState(nextState);
              }
            }}
            onDrop={(e) => {
              if (parsedChronologicalBlocks.length > 0) {
                const lastIdx = parsedChronologicalBlocks.length - 1;
                handleDropOnBlock(lastIdx, e);
              } else {
                handleDropOnBlock(0, e);
              }
            }}
          />
        </div>

        {/* Tempered Glass Right Sidebar Panel */}
        {isRightSidebarOpen && (
          <aside className="w-56 sm:w-60 glass-sidebar border-t border-l rounded-tl-3xl px-3 py-3 flex flex-col justify-between shrink-0 overflow-y-auto animate-in slide-in-from-right duration-200 select-none font-sans relative">
            <div className="space-y-4">
              {/* True iOS 26 Liquid Glass Sliding Lens Panel Tabs */}
              <div className="py-1.5 overflow-visible">
                <LiquidSegmentedControl
                  fullWidth
                  size="xs"
                  value={activeRightTab}
                  onChange={setActiveRightTab}
                  options={[
                    { value: 'insert', label: 'Insert' },
                    { value: 'format', label: 'Format' },
                    { value: 'style', label: 'Style' },
                    { value: 'info', label: 'Info' },
                  ]}
                />
              </div>

              {/* TAB 1: INSERT PANEL */}
              {activeRightTab === 'insert' && (
                <div className="space-y-4">
                  <p className="text-[10px] q-text-muted font-medium px-1">
                    Klik atau tarik blok ke dalam catatan
                  </p>

                  <div className="space-y-1.5">
                    {/* 1. Text */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('text', 'Text Block', e)}
                      onDragEnd={handleDragEnd}
                      onClick={handleInsertTextBlock}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan Teks"
                    >
                      <div className="flex items-center gap-2.5">
                        <Type className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">Text</span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>

                    {/* 2. Page */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('subpage', 'Subpage', e)}
                      onDragEnd={handleDragEnd}
                      onClick={handleInsertPage}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan Halaman baru"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">
                          Page {subPageStack.length >= 4 ? '(Maks 4)' : ''}
                        </span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>

                    {/* 3. File Attachment */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('attachment', 'File Attachment', e)}
                      onDragEnd={handleDragEnd}
                      onClick={() => fileAttachmentInputRef.current?.click()}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan File"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileUp className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">File Attachment</span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>

                    {/* 4. Image */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('image', 'Image Block', e)}
                      onDragEnd={handleDragEnd}
                      onClick={() => imageBlockInputRef.current?.click()}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan Gambar"
                    >
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">Image</span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>

                    {/* 5. Code Block */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('code', 'Code Block', e)}
                      onDragEnd={handleDragEnd}
                      onClick={handleInsertCodeBlock}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan Code Block"
                    >
                      <div className="flex items-center gap-2.5">
                        <Code2 className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">Code Block</span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>

                    {/* 6. Mermaid Diagram */}
                    <div
                      draggable
                      onDragStart={(e) => handleSidebarDragStart('mermaid', 'Mermaid Diagram', e)}
                      onDragEnd={handleDragEnd}
                      onClick={handleInsertMermaidBlock}
                      className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                      title="Klik atau tarik ke dokumen untuk menyisipkan Diagram Mermaid"
                    >
                      <div className="flex items-center gap-2.5">
                        <GitGraph className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                        <span className="text-xs font-semibold q-text-primary">Mermaid Diagram</span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                    </div>
                  </div>

                  {/* Collections Section */}
                  <div className="space-y-2 pt-2 border-t q-border">
                    <p className="text-[10px] font-semibold q-text-muted uppercase tracking-wider px-1">Collections</p>
                    <div className="space-y-1.5">
                      <div
                        draggable
                        onDragStart={(e) => handleSidebarDragStart('table', 'Table Collection', e)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleInsertCollection('table')}
                        className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                        title="Sisipkan Database Tabel"
                      >
                        <div className="flex items-center gap-2.5">
                          <Table className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                          <span className="text-xs font-semibold q-text-primary">Table</span>
                        </div>
                        <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                      </div>

                      <div
                        draggable
                        onDragStart={(e) => handleSidebarDragStart('gallery', 'Gallery Collection', e)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleInsertCollection('gallery')}
                        className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                        title="Sisipkan Database Galeri"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutGrid className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                          <span className="text-xs font-semibold q-text-primary">Gallery</span>
                        </div>
                        <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                      </div>

                      <div
                        draggable
                        onDragStart={(e) => handleSidebarDragStart('kanban', 'Kanban Collection', e)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleInsertCollection('kanban')}
                        className="w-full flex items-center justify-between py-2 px-3 glass-control rounded-xl group cursor-grab active:cursor-grabbing select-none"
                        title="Sisipkan Papan Kanban"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layout className="w-4 h-4 q-text-primary group-hover:scale-105 transition-transform" />
                          <span className="text-xs font-semibold q-text-primary">Kanban</span>
                        </div>
                        <GripVertical className="w-3.5 h-3.5 q-text-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FORMAT PANEL */}
              {activeRightTab === 'format' && (
                <div className="space-y-4">
                  <p className="text-[10px] q-text-muted font-semibold px-1">Format Teks Cepat</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => insertBlockAtActivePosition('**Teks Tebal**')}
                      className="flex items-center gap-2 py-2 px-2.5 glass-control rounded-xl text-xs font-semibold q-text-primary"
                    >
                      <Bold className="w-4 h-4 q-text-muted" />
                      <span>Bold</span>
                    </button>
                    <button
                      onClick={() => insertBlockAtActivePosition('*Teks Miring*')}
                      className="flex items-center gap-2 py-2 px-2.5 glass-control rounded-xl text-xs font-semibold q-text-primary"
                    >
                      <Italic className="w-4 h-4 q-text-muted" />
                      <span>Italic</span>
                    </button>
                    <button
                      onClick={() => insertBlockAtActivePosition('~~Teks Coret~~')}
                      className="flex items-center gap-2 py-2 px-2.5 glass-control rounded-xl text-xs font-semibold q-text-primary"
                    >
                      <Strikethrough className="w-4 h-4 q-text-muted" />
                      <span>Strike</span>
                    </button>
                    <button
                      onClick={() => insertBlockAtActivePosition('`code inline`')}
                      className="flex items-center gap-2 py-2 px-2.5 glass-control rounded-xl text-xs font-semibold q-text-primary"
                    >
                      <Code2 className="w-4 h-4 q-text-muted" />
                      <span>Code</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: STYLE PANEL */}
              {activeRightTab === 'style' && (
                <div className="space-y-4">
                  <p className="text-[10px] q-text-muted font-semibold px-1">Tipografi Dokumen</p>
                  <div className="p-3 bg-white/[0.05] border border-white/[0.12] rounded-xl space-y-1">
                    <p className="text-xs font-semibold q-text-primary">Font Utama</p>
                    <p className="text-xs q-text-muted">Inter â€” Clean Sans</p>
                  </div>
                </div>
              )}

              {/* TAB 4: INFO PANEL */}
              {activeRightTab === 'info' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold q-text-muted uppercase tracking-wider">Statistik</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.05] border border-white/[0.12] p-2.5 rounded-xl">
                        <p className="q-text-muted text-[10px]">Kata</p>
                        <p className="text-base font-bold q-text-primary mt-0.5 tracking-tight">{wordCount}</p>
                      </div>
                      <div className="bg-white/[0.05] border border-white/[0.12] p-2.5 rounded-xl">
                        <p className="q-text-muted text-[10px]">Karakter</p>
                        <p className="text-base font-bold q-text-primary mt-0.5 tracking-tight">{charCount}</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.12] p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <span className="q-text-muted text-[11px]">Waktu Baca</span>
                      <span className="font-semibold q-text-primary">{readingTimeMinutes} mnt</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold q-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <ListTree className="w-3.5 h-3.5" />
                      <span>Daftar Isi</span>
                    </p>
                    {outlineHeadings.length === 0 ? (
                      <p className="text-xs q-text-muted italic px-1">Belum ada heading (# Judul)</p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {outlineHeadings.map((h, i) => (
                          <div
                            key={i}
                            className={`text-xs truncate font-medium q-text-secondary hover:q-text-primary transition-colors cursor-pointer ${
                              h.level === 1 ? 'pl-0 font-semibold q-text-primary' : h.level === 2 ? 'pl-3' : 'pl-6 q-text-muted'
                            }`}
                          >
                            {h.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick Action: Export Document */}
            <div className="pt-3 flex items-center justify-between">
              <button
                onClick={() => exportNoteAsTXT(note)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 glass-btn-primary text-xs font-semibold rounded-full group active:scale-[0.98]"
              >
                <FileDown className="w-4 h-4 transition-transform group-hover:scale-105" />
                <span>Ekspor Catatan</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* File Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 select-none"
          style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-3xl glass-panel rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b q-border bg-white/[0.04]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <CraftFileTypeBadge mime={previewAttachment.mime} name={previewAttachment.name} />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold q-text-primary truncate">{previewAttachment.name}</h3>
                  <p className="text-[10px] q-text-muted">{previewAttachment.size} â€¢ {previewAttachment.mime || 'File'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleDownloadAttachment(previewAttachment, e)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 glass-btn-primary text-xs font-semibold rounded-full transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview Area */}
            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center glass-recessed min-h-[300px]">
              {previewAttachment.mime.startsWith('image/') ||
              ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].some((ext) => previewAttachment.name.toLowerCase().endsWith('.' + ext)) ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border q-border"
                />
              ) : previewAttachment.mime.startsWith('audio/') ||
                ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].some((ext) => previewAttachment.name.toLowerCase().endsWith('.' + ext)) ? (
                <div className="w-full max-w-md p-6 glass-card rounded-2xl flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 glass-control rounded-full flex items-center justify-center q-text-primary">
                    <Music className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold q-text-primary truncate max-w-xs">{previewAttachment.name}</h4>
                    <p className="text-xs q-text-muted mt-0.5">{previewAttachment.size} â€¢ File Audio</p>
                  </div>
                  <audio controls autoPlay src={previewAttachment.url} className="w-full mt-2 rounded-xl" />
                </div>
              ) : previewAttachment.mime.startsWith('video/') ||
                ['mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi'].some((ext) => previewAttachment.name.toLowerCase().endsWith('.' + ext)) ? (
                <div className="w-full max-w-2xl flex flex-col items-center gap-3">
                  <video
                    controls
                    autoPlay
                    src={previewAttachment.url}
                    className="max-h-[60vh] max-w-full rounded-2xl shadow-2xl border q-border"
                  />
                  <span className="text-xs q-text-muted font-medium flex items-center gap-1.5">
                    <Video className="w-4 h-4 q-text-muted shrink-0" />
                    <span>{previewAttachment.name} ({previewAttachment.size})</span>
                  </span>
                </div>
              ) : previewAttachment.mime.includes('pdf') || previewAttachment.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[60vh] rounded-xl border q-border bg-white"
                />
              ) : previewAttachment.url.startsWith('data:text') ||
                ['txt', 'json', 'csv', 'js', 'ts', 'html', 'css', 'py'].some((ext) => previewAttachment.name.toLowerCase().endsWith('.' + ext)) ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[50vh] rounded-xl border q-border bg-white/[0.04] q-text-primary p-4 font-mono text-xs"
                />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto glass-control rounded-2xl flex items-center justify-center">
                    <CraftFileTypeBadge mime={previewAttachment.mime} name={previewAttachment.name} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold q-text-primary">{previewAttachment.name}</h4>
                    <p className="text-xs q-text-muted mt-1 max-w-md mx-auto">
                      Format file ini dapat diunduh langsung untuk dibuka di aplikasi perangkat Anda.
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDownloadAttachment(previewAttachment, e)}
                    className="inline-flex items-center gap-2 px-4 py-2 glass-btn-primary text-xs font-semibold rounded-full transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Sekarang ({previewAttachment.size})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Log Modal */}
      <VersionHistoryModal
        noteId={note.id}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestore={(snapshot) => {
          setTitle(snapshot.title);
          setContent(snapshot.content);
          setSubject(snapshot.subject);
          setTags(snapshot.tags);
          triggerAutoSave(snapshot.title, snapshot.content, snapshot.subject, snapshot.tags);
        }}
      />

      {/* In-App Rename Attachment Modal (Replaces crude browser prompt!) */}
      {renameTarget && (
        <RenameAttachmentModal
          isOpen={!!renameTarget}
          initialName={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onSave={handleSaveRenamedAttachment}
        />
      )}


      {/* Marquee Drag Selection Box Overlay (Direct DOM 120fps) */}
      <div
        ref={marqueeBoxRef}
        style={{ display: 'none' }}
        className="fixed z-50 pointer-events-none bg-white/[0.07] border border-white/25 rounded-xl"
      />

      {/* Multi-Block Selection Floating Liquid Glass Action Bar */}
      {selectedBlockIndices.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 liquid-pill rounded-full px-5 py-2 flex items-center gap-2.5 z-50 text-xs font-semibold q-text-primary animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2 pr-3 border-r q-border text-white font-semibold">
            <GripVertical className="w-4 h-4" />
            <span>{selectedBlockIndices.length} Blok Terpilih</span>
          </div>
          <button
            onClick={() => {
              const sorted = [...selectedBlockIndices].sort((a, b) => a - b);
              const text = sorted
                .map((i) => {
                  const blk = parsedChronologicalBlocks[i];
                  if (!blk) return '';
                  if (blk.type === 'text') return blk.content;
                  if (blk.type === 'code') return blk.data.code;
                  if (blk.type === 'mermaid') return blk.data.code;
                  if (blk.type === 'subpage') return blk.data.title;
                  if (blk.type === 'attachment') return blk.data.name;
                  return '';
                })
                .filter((line) => line !== undefined)
                .join('\n');
              navigator.clipboard?.writeText(text);
              setBlocksCopiedFeedback(true);
              setTimeout(() => setBlocksCopiedFeedback(false), 1400);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/10 q-text-secondary hover:q-text-primary transition-colors"
            title="Salin Teks Blok Terpilih (Ctrl+C)"
          >
            {blocksCopiedFeedback ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 q-text-muted" />}
            <span>{blocksCopiedFeedback ? 'Tersalin!' : 'Salin'}</span>
          </button>
          <button
            onClick={handleDuplicateSelectedBlocks}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/10 q-text-secondary hover:q-text-primary transition-colors"
            title="Duplikat Semua Blok Terpilih"
          >
            <FilePlus className="w-3.5 h-3.5 q-text-muted" />
            <span>Duplikat</span>
          </button>
          <button
            onClick={handleDeleteSelectedBlocks}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-rose-500/15 text-rose-400 transition-colors"
            title="Hapus Semua Blok Terpilih"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
          <button
            onClick={() => setSelectedBlockIndices([])}
            className="p-1.5 rounded-full q-text-muted hover:q-text-primary hover:bg-white/10 transition-colors ml-1"
            title="Batal Seleksi (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
