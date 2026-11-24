import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  Star,
  Trash2,
  Plus,
  History,
  Settings,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Check,
  SquarePen,
  FilePlus,
  FolderPlus,
  FolderInput,
  List,
  CheckCircle2,
  Circle,
  Paperclip,
  Link2,
  ArrowUpRight,
  Folder,
  Code,
  Image as ImageIcon,
  Home,
} from 'lucide-react';
import type { FilterCategory, Note } from '../types/note';
import { ConfirmModal } from './ConfirmModal';
import { CreateFolderModal } from './CreateFolderModal';
import { BrandLogo } from './BrandLogo';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { LiquidVerticalNav } from './LiquidVerticalNav';
import { getFolderIconComponent } from '../lib/folderIcons';

const SIDEBAR_WIDTH_STORAGE_KEY = 'seenote_sidebar_width';
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;
const DEFAULT_SIDEBAR_WIDTH = 280;

interface FilterBarProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  selectedSubject: string | null;
  onSubjectChange: (subject: string | null) => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  subjects: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  totalNotes: number;
  favoriteCount: number;
  trashCount: number;
  onNewNote: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  filteredNotes: Note[];
  onToggleSidebar: () => void;
  onOpenBackup: () => void;
  onOpenCreateFolderModal?: (parentPath?: string) => void;
  onNewDocInFolder?: (folderPath: string) => void;
  onRenameFolder?: (oldPath: string, newPath: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onMoveFolder?: (sourceFolderPath: string, targetParentFolderPath: string) => void;
  folderMetaMap?: Record<string, { color?: string; icon?: string }>;
  language?: 'id' | 'en';
}

const PINNED_TAGS_KEY = 'instant_notes_pinned_tags';

interface FolderNode {
  name: string;
  fullPath: string;
  count: number;
  children: Map<string, FolderNode>;
  documents: Note[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  selectedSubject,
  onSubjectChange,
  selectedTag,
  onTagChange,
  subjects,
  tags,
  totalNotes,
  favoriteCount,
  trashCount,
  onNewNote,
  onOpenSettings,
  onToggleSidebar,
  notes = [],
  selectedNoteId,
  onSelectNote = () => {},
  onOpenCreateFolderModal,
  onNewDocInFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  folderMetaMap = {},
  language = 'id',
}) => {
  const isEn = language === 'en';
  const [isFoldersSectionCollapsed, setIsFoldersSectionCollapsed] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);
  const [isPinTagPopoverOpen, setIsPinTagPopoverOpen] = useState(false);
  const [activeFolderMenuPath, setActiveFolderMenuPath] = useState<string | null>(null);
  const [isMoveFolderPopoverOpen, setIsMoveFolderPopoverOpen] = useState(false);

  // Custom Modal States (No native window alert/confirm!)
  const [folderToDelete, setFolderToDelete] = useState<{ path: string; name: string } | null>(null);
  const [folderToRename, setFolderToRename] = useState<{ path: string; name: string } | null>(null);

  const [expandedFolderPaths, setExpandedFolderPaths] = useState<string[]>([]);
  // Track expanded folder paths for document list limit (>4)
  const [expandedDocListFolderPaths, setExpandedDocListFolderPaths] = useState<string[]>([]);

  const toggleExpandDocListFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedDocListFolderPaths.includes(path)) {
      setExpandedDocListFolderPaths(expandedDocListFolderPaths.filter((p) => p !== path));
    } else {
      setExpandedDocListFolderPaths([...expandedDocListFolderPaths, path]);
    }
  };

  const tagPopoverRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const [pinnedTags, setPinnedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_TAGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load pinned tags:', e);
    }
    return tags.map((t) => t.name);
  });

  const togglePinTag = (tagName: string) => {
    let updated: string[];
    if (pinnedTags.includes(tagName)) {
      updated = pinnedTags.filter((t) => t !== tagName);
    } else {
      updated = [...pinnedTags, tagName];
    }
    setPinnedTags(updated);
    localStorage.setItem(PINNED_TAGS_KEY, JSON.stringify(updated));
  };

  const toggleFolderPathExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedFolderPaths.includes(path)) {
      setExpandedFolderPaths(expandedFolderPaths.filter((p) => p !== path));
    } else {
      setExpandedFolderPaths([...expandedFolderPaths, path]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPopoverRef.current && !tagPopoverRef.current.contains(e.target as Node)) {
        setIsPinTagPopoverOpen(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setActiveFolderMenuPath(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const asideRef = useRef<HTMLElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
      if (Number.isFinite(saved) && saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    let latestWidth = sidebarWidth;
    const handleMouseMove = (e: MouseEvent) => {
      const leftEdge = asideRef.current?.getBoundingClientRect().left ?? 12;
      const nextWidth = Math.round(
        Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX - leftEdge))
      );
      latestWidth = nextWidth;
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(latestWidth));
      } catch {
        // ignore storage errors
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleCreateFolderPrompt = (parentPath = '') => {
    if (onOpenCreateFolderModal) {
      onOpenCreateFolderModal(parentPath);
    }
  };

  const folderTree = React.useMemo(() => {
    const root = new Map<string, FolderNode>();

    notes.filter((n) => !n.isTrash && n.subject).forEach((note) => {
      const pathParts = note.subject.split('/').map((p) => p.trim()).filter(Boolean);
      let currentMap = root;
      let accumulatedPath = '';

      pathParts.forEach((part, index) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        if (!currentMap.has(part)) {
          currentMap.set(part, {
            name: part,
            fullPath: accumulatedPath,
            count: 0,
            children: new Map(),
            documents: [],
          });
        }
        const node = currentMap.get(part)!;
        node.count++;
        if (index === pathParts.length - 1) {
          node.documents.push(note);
        }
        currentMap = node.children;
      });
    });

    subjects.forEach(({ name }) => {
      const pathParts = name.split('/').map((p) => p.trim()).filter(Boolean);
      let currentMap = root;
      let accumulatedPath = '';

      pathParts.forEach((part) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        if (!currentMap.has(part)) {
          currentMap.set(part, {
            name: part,
            fullPath: accumulatedPath,
            count: 0,
            children: new Map(),
            documents: [],
          });
        }
        const node = currentMap.get(part)!;
        currentMap = node.children;
      });
    });

    return root;
  }, [notes, subjects]);

  const [showAllFolders, setShowAllFolders] = useState(false);

  // TOC Sidebar Mode & Tabs State (3-Tab: Outline | Tasks | Links & Media)
  const [sidebarView, setSidebarView] = useState<'folders' | 'toc'>('folders');
  const [tocTab, setTocTab] = useState<'list' | 'tasks' | 'attachments'>('list');

  // Automatically switch to TOC view when inside a note
  useEffect(() => {
    if (selectedNoteId) {
      setSidebarView('toc');
    } else {
      setSidebarView('folders');
    }
  }, [selectedNoteId]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId);
  }, [notes, selectedNoteId]);

  // Extract Table of Contents (Pages, Headings, Code blocks) from active note
  const tocItems = useMemo(() => {
    if (!activeNote || !activeNote.content) return [];
    const items: { id: string; type: 'page' | 'heading' | 'code'; title: string; subpageId?: string; level?: number; rawContent?: string }[] = [];
    const foundSubpageIds = new Set<string>();

    // 1. Extract subpage blocks :::subpage{id="id" title="title"}...:::
    const subpageRegex = /:::subpage\{id="([^"]+)" title="([^"]*)"\}[\r\n]+([\s\S]*?)[\r\n]+:::/gi;
    let match: RegExpExecArray | null;
    while ((match = subpageRegex.exec(activeNote.content)) !== null) {
      const subpageId = match[1];
      const rawTitle = match[2] ? match[2].replace(/&quot;/g, '"').replace(/\\"/g, '"') : '';
      const title = rawTitle.trim() || 'Untitled Page';
      const content = match[3] || '';
      foundSubpageIds.add(subpageId);
      items.push({
        id: subpageId,
        type: 'page',
        title,
        subpageId,
        rawContent: content,
      });
    }

    // 2. Extract inline markdown subpage links, headings, and code blocks line by line
    const lines = activeNote.content.split('\n');
    lines.forEach((line: string, index: number) => {
      const trimmed = line.trim();

      // Check subpage link: [page:subpageId|Page Title] or [Title](page:subpageId)
      const pageMatch = trimmed.match(/\[([^\]]+)\]\(page:([^\)]+)\)/i) || trimmed.match(/\[page:([^\|]+)\|([^\]]+)\]/i);
      if (pageMatch) {
        const title = pageMatch[1] || pageMatch[2];
        const subpageId = pageMatch[2] || pageMatch[1];
        if (!foundSubpageIds.has(subpageId)) {
          foundSubpageIds.add(subpageId);
          items.push({ id: subpageId, type: 'page', title, subpageId });
        }
        return;
      }

      // Check heading (# Heading 1, ## Heading 2, etc.)
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2]
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/~~([^~]+)~~/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/<\/?(?:u|sup|sub)>/gi, '')
          .trim();
        items.push({ id: `line-${index}`, type: 'heading', title, level });
        return;
      }

      // Check code block
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        if (lang) {
          items.push({ id: `line-${index}`, type: 'code', title: `Code (${lang})` });
        }
      }
    });

    return items;
  }, [activeNote]);

  // Extract tasks/TODO checkboxes grouped per distinct to-do list block
  const extractedTaskGroups = useMemo(() => {
    if (!activeNote || !activeNote.content) {
      return {
        groups: [] as {
          id: string;
          title: string;
          tasks: { id: string; lineIndex: number; text: string; completed: boolean; depth: number }[];
        }[],
        totalCount: 0,
        completedCount: 0,
      };
    }

    const cleanInlineMd = (raw: string) =>
      raw
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/<\/?(?:u|sup|sub|span|mark)[^>]*>/gi, '')
        .trim();

    const groups: {
      id: string;
      title: string;
      tasks: { id: string; lineIndex: number; text: string; completed: boolean; depth: number }[];
    }[] = [];

    const lines = activeNote.content.split('\n');
    let insideFence = false;
    let currentHeading = '';
    let pendingLabel = '';
    let activeGroup: (typeof groups)[number] | null = null;
    let totalCount = 0;
    let completedCount = 0;

    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        insideFence = !insideFence;
        activeGroup = null;
        return;
      }
      if (insideFence) return;

      // Directives break task groups
      if (trimmed.startsWith(':::')) {
        activeGroup = null;
        pendingLabel = '';
        return;
      }

      // Check for checklist line
      const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (taskMatch) {
        const cleanText = cleanInlineMd(taskMatch[3]);
        if (!cleanText) return;

        if (!activeGroup) {
          const fallbackName = isEn ? `Checklist ${groups.length + 1}` : `Daftar ${groups.length + 1}`;
          const groupTitle = pendingLabel || currentHeading || fallbackName;
          activeGroup = {
            id: `task-group-${idx}`,
            title: groupTitle.length > 48 ? `${groupTitle.slice(0, 45)}...` : groupTitle,
            tasks: [],
          };
          groups.push(activeGroup);
          pendingLabel = '';
        }

        const indent = taskMatch[1].replace(/\t/g, '  ');
        const depth = Math.min(3, Math.floor(indent.length / 2));
        const completed = taskMatch[2].toLowerCase() === 'x';

        activeGroup.tasks.push({
          id: `task-${idx}`,
          lineIndex: idx,
          completed,
          text: cleanText,
          depth,
        });
        totalCount += 1;
        if (completed) completedCount += 1;
        return;
      }

      // Non-checklist line ends the current contiguous to-do list group
      activeGroup = null;

      if (!trimmed) {
        return;
      }

      // Heading updates current section context
      const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch) {
        currentHeading = cleanInlineMd(headingMatch[1]);
        pendingLabel = currentHeading;
        return;
      }

      // Ignore dividers and plain bullet/ordered items as group labels
      if (/^([-*_=.])\1{2,}$/.test(trimmed) || /^(?:•|◦|▪|[-*+]|\d+\.)\s+/.test(trimmed)) {
        pendingLabel = '';
        return;
      }

      // Short descriptive line right above a checklist (e.g. "Daily Tasks:" or "**To-Do:**")
      const candidateLabel = cleanInlineMd(trimmed).replace(/:$/, '').trim();
      if (candidateLabel.length > 0 && candidateLabel.length <= 64) {
        pendingLabel = candidateLabel;
      } else {
        pendingLabel = '';
      }
    });

    return { groups, totalCount, completedCount };
  }, [activeNote, isEn]);

  // Extract links, attachments, and images from active note
  const extractedLinksAndMedia = useMemo(() => {
    if (!activeNote || !activeNote.content) {
      return { links: [] as { id: string; title: string; url: string; host: string }[], media: [] as { id: string; title: string; type: 'image' | 'file' }[] };
    }
    const links: { id: string; title: string; url: string; host: string }[] = [];
    const media: { id: string; title: string; type: 'image' | 'file' }[] = [];
    const seenUrls = new Set<string>();

    const parseHost = (rawUrl: string) => {
      try {
        return new URL(rawUrl).hostname.replace(/^www\./, '');
      } catch {
        return rawUrl;
      }
    };

    // 1. Extract :::attachment{...} blocks
    const attRegex = /:::attachment\{([^}]+)\}/gi;
    let attMatch: RegExpExecArray | null;
    let attCounter = 0;
    while ((attMatch = attRegex.exec(activeNote.content)) !== null) {
      const attrs = attMatch[1];
      const nameMatch = attrs.match(/name="([^"]+)"/i);
      const isInlineMatch = attrs.match(/isInline="(true|false)"/i);
      const mimeMatch = attrs.match(/mime="([^"]+)"/i);
      const isImg = isInlineMatch?.[1] === 'true' || (mimeMatch?.[1]?.startsWith('image/') ?? false);
      const name = nameMatch?.[1] || (isImg ? (isEn ? 'Image' : 'Gambar') : (isEn ? 'Attachment' : 'Lampiran'));
      media.push({ id: `blk-att-${attCounter++}`, title: name, type: isImg ? 'image' : 'file' });
    }

    // 2. Scan lines for Markdown images, Markdown links, and bare URLs
    const lines = activeNote.content.split('\n');
    let insideFence = false;
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('```') || trimmed.startsWith(':::whiteboard') || trimmed.startsWith(':::attachment')) {
        if (trimmed.startsWith('```')) insideFence = !insideFence;
        return;
      }
      if (insideFence) return;

      // Markdown images ![alt](url)
      const imgRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
      let im: RegExpExecArray | null;
      let imIdx = 0;
      while ((im = imgRegex.exec(line)) !== null) {
        media.push({ id: `img-${idx}-${imIdx++}`, title: im[1] || (isEn ? 'Image' : 'Gambar'), type: 'image' });
      }

      // Remove markdown images before scanning links so image URLs aren't treated as web links
      const lineWithoutImages = line.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '');

      // Markdown links [Label](https://...)
      const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let lm: RegExpExecArray | null;
      let lmIdx = 0;
      while ((lm = mdLinkRegex.exec(lineWithoutImages)) !== null) {
        const url = lm[2];
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          links.push({
            id: `link-${idx}-${lmIdx++}`,
            title: lm[1].trim() || parseHost(url),
            url,
            host: parseHost(url),
          });
        }
      }

      // Bare URLs https://...
      const lineWithoutMdLinks = lineWithoutImages.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '');
      const bareUrlRegex = /(https?:\/\/[^\s<>()[\]"']+)/g;
      let bm: RegExpExecArray | null;
      let bmIdx = 0;
      while ((bm = bareUrlRegex.exec(lineWithoutMdLinks)) !== null) {
        const url = bm[1].replace(/[.,;:!?]+$/, '');
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          links.push({
            id: `bare-${idx}-${bmIdx++}`,
            title: parseHost(url),
            url,
            host: parseHost(url),
          });
        }
      }
    });

    return { links, media };
  }, [activeNote, isEn]);

  const renderFolderNode = (node: FolderNode, depth = 0) => {
    // Limit subfolder nesting depth to 3 levels max
    if (depth > 2) return null;

    const isExpanded = expandedFolderPaths.includes(node.fullPath);
    const isSelected = selectedSubject?.toLowerCase() === node.fullPath.toLowerCase();
    const isMenuOpen = activeFolderMenuPath === node.fullPath;

    const meta = folderMetaMap?.[node.fullPath];
    const CustomFolderIcon = getFolderIconComponent(meta?.icon);

    return (
      <div key={node.fullPath} className="space-y-0.5 relative">
        <div
          onClick={() => {
            onFilterChange('all');
            onSubjectChange(isSelected ? null : node.fullPath);
            onTagChange(null);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveFolderMenuPath(node.fullPath);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer group/item relative ${
            isSelected
              ? 'liquid-lens-active text-white font-semibold'
              : 'q-text-secondary hover:bg-white/[0.06] hover:text-white border border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <button
              onClick={(e) => toggleFolderPathExpand(node.fullPath, e)}
              className="p-0.5 q-text-muted hover:q-text-primary rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <CustomFolderIcon
              className={`w-[17px] h-[17px] shrink-0 ${isSelected ? 'text-white' : 'text-white/60'}`}
            />
            <span className="truncate flex-1 min-w-0">{node.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveFolderMenuPath(isMenuOpen ? null : node.fullPath);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity"
              title="Opsi / Edit Folder"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tempered Glass Folder Context Menu */}
        {isMenuOpen && (
          <div
            ref={folderMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-6 top-8 w-44 glass-popover rounded-2xl p-1.5 z-50 space-y-0.5 font-sans"
          >
            <button
              onClick={() => {
                setFolderToRename({ path: node.fullPath, name: node.name });
                setActiveFolderMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <SquarePen className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit...</span>
            </button>

            {onNewDocInFolder && (
              <button
                onClick={() => {
                  onNewDocInFolder(node.fullPath);
                  setActiveFolderMenuPath(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5 text-slate-400" />
                <span>New Doc</span>
              </button>
            )}

            <button
              onClick={() => {
                handleCreateFolderPrompt(node.fullPath);
                setActiveFolderMenuPath(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
              <span>New Folder</span>
            </button>

            {/* Move Folder to Subfolder Submenu */}
            <div className="relative">
              <button
                onClick={() => setIsMoveFolderPopoverOpen(!isMoveFolderPopoverOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                  <span>Move to...</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isMoveFolderPopoverOpen && (
                <div className="absolute left-full top-0 ml-1.5 w-44 glass-popover rounded-2xl p-1.5 z-50 max-h-40 overflow-y-auto space-y-0.5 font-sans">
                  <button
                    onClick={() => {
                      if (onMoveFolder) onMoveFolder(node.fullPath, '');
                      setIsMoveFolderPopoverOpen(false);
                      setActiveFolderMenuPath(null);
                    }}
                    className="w-full text-left px-2 py-1 text-xs truncate rounded-lg text-white hover:bg-white/10 font-bold"
                  >
                    [ Root Level ]
                  </button>
                  {subjects
                    .filter((s) => s.name !== node.fullPath && !s.name.startsWith(`${node.fullPath}/`))
                    .map(({ name }) => (
                      <button
                        key={name}
                        onClick={() => {
                          if (onMoveFolder) onMoveFolder(node.fullPath, name);
                          setIsMoveFolderPopoverOpen(false);
                          setActiveFolderMenuPath(null);
                        }}
                        className="w-full text-left px-2 py-1 text-xs truncate rounded-lg text-slate-200 hover:text-white hover:bg-white/10"
                      >
                        {name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {onDeleteFolder && (
              <button
                onClick={() => {
                  setFolderToDelete({ path: node.fullPath, name: node.name });
                  setActiveFolderMenuPath(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="space-y-0.5">
            {Array.from(node.children.values()).map((childNode) =>
              renderFolderNode(childNode, depth + 1)
            )}

            {/* Nested Documents (Max 4 visible by default) */}
            {(expandedDocListFolderPaths.includes(node.fullPath)
              ? node.documents
              : node.documents.slice(0, 4)
            ).map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectNote(doc.id)}
                className={`w-full text-left py-1.5 text-[13px] truncate block rounded-lg transition-colors ${
                  selectedNoteId === doc.id
                    ? 'text-white font-semibold bg-white/[0.12]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
              >
                {doc.title || 'Catatan Tanpa Judul'}
              </button>
            ))}

            {node.documents.length > 4 && (
              <button
                onClick={(e) => toggleExpandDocListFolder(node.fullPath, e)}
                className="w-full text-left py-1 text-[11px] font-semibold text-white/75 hover:text-white hover:underline transition-colors block"
                style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
              >
                {expandedDocListFolderPaths.includes(node.fullPath)
                  ? 'Sembunyikan'
                  : `Lihat semua (+${node.documents.length - 4} lagi)`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      ref={asideRef}
      style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
      className={`w-full lg:w-[var(--sidebar-width)] shrink-0 px-2 py-3 flex flex-col justify-between h-full select-none font-sans overflow-hidden relative z-20 ${
        selectedNoteId
          ? 'bg-transparent border-0 shadow-none'
          : 'bg-transparent border-0'
      } ${
        isResizing ? 'transition-none' : 'transition-[width] duration-150 ease-out'
      }`}
    >
      {/* Desktop Right-Edge Resize Handle (Min 220px, Default 280px, Max 420px) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onDoubleClick={() => {
          setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
          try {
            localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
          } catch {
            // ignore
          }
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label={isEn ? 'Resize sidebar' : 'Ubah lebar sidebar'}
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={sidebarWidth}
        title={isEn ? 'Drag to resize sidebar (Double-click to reset)' : 'Tarik kanan/kiri untuk ubah lebar (Klik ganda untuk reset)'}
        className="hidden lg:flex absolute top-5 bottom-5 right-0 w-2.5 cursor-col-resize items-center justify-center group/resize z-40"
      >
        <div
          className={`w-[3px] rounded-full transition-all duration-150 ${
            isResizing
              ? 'h-16 bg-white/55 shadow-[0_0_10px_rgba(255,255,255,0.35)]'
              : 'h-10 bg-white/0 group-hover/resize:bg-white/30'
          }`}
        />
      </div>
      <div className="space-y-5 overflow-y-auto flex-1 pr-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Render Table of Contents (TOC) View when inside a note & sidebarView === 'toc' */}
        {selectedNoteId && sidebarView === 'toc' && activeNote ? (
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Row 1: Top Navigation Bar with Home Breadcrumb + PanelLeft Toggle */}
            <div className="flex items-center justify-between px-0.5 pt-0.5 pb-1 select-none">
              <button
                onClick={() => {
                  onSelectNote('');
                  onFilterChange('all');
                  onSubjectChange(null);
                  onTagChange(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 glass-control rounded-full text-xs font-semibold q-text-primary group"
                title={isEn ? 'Back to All Notes' : 'Kembali ke Beranda'}
              >
                <Home className="w-3.5 h-3.5 q-text-secondary group-hover:q-text-primary transition-colors shrink-0" />
                <span className="leading-none pt-[1px] font-medium">{isEn ? 'Home' : 'Beranda'}</span>
              </button>

              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
                  title={isEn ? 'Hide Sidebar' : 'Sembunyikan Sidebar'}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* True iOS 26 Liquid Glass 3-Tab Sliding Lens Toolbar (Pages | Tasks | Links & Media) */}
            <div className="py-1 overflow-visible">
              <LiquidSegmentedControl
                fullWidth
                size="xs"
                value={tocTab}
                onChange={setTocTab}
                options={[
                  { value: 'list', icon: <List className="w-3.5 h-3.5" />, title: isEn ? 'Outline & Pages' : 'Halaman & Struktur' },
                  { value: 'tasks', icon: <CheckCircle2 className="w-3.5 h-3.5" />, title: isEn ? 'Tasks' : 'Daftar Tugas' },
                  { value: 'attachments', icon: <Link2 className="w-3.5 h-3.5" />, title: isEn ? 'Links & Media' : 'Tautan & Media' },
                ]}
              />
            </div>

            {/* Tab 1: Table of Contents & Pages Tree */}
            {tocTab === 'list' && (
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                <div className="text-[10px] font-semibold q-text-muted uppercase tracking-wider px-1">
                  {isEn ? 'Outline & Subpages' : 'Struktur & Halaman'}
                </div>

                {/* Root Document Title */}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-root-note'));
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-xs font-semibold q-text-primary truncate transition-colors text-left group cursor-pointer border q-border"
                  title={isEn ? 'Back to Main Note' : 'Kembali ke Catatan Utama'}
                >
                  <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">{activeNote.title || (isEn ? 'Untitled Note' : 'Catatan Tanpa Judul')}</span>
                </button>
                {/* TOC Items Tree (Pages & Headings) */}
                <div className="space-y-0.5 pl-2 border-l q-border">
                  {tocItems.map((item: { id: string; type: string; title: string; subpageId?: string; level?: number; rawContent?: string }) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'page') {
                          window.dispatchEvent(
                            new CustomEvent('open-subpage-from-toc', {
                              detail: { id: item.subpageId || item.id, title: item.title, content: item.rawContent || '' },
                            })
                          );
                        } else {
                          const el = document.querySelector('.select-text');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium q-text-secondary hover:q-text-primary hover:bg-white/10 transition-colors text-left truncate group"
                      style={{ paddingLeft: item.level ? `${Math.max(8, item.level * 10)}px` : '8px' }}
                    >
                      {item.type === 'page' ? (
                        <FileText className="w-3.5 h-3.5 q-text-muted shrink-0" />
                      ) : item.type === 'code' ? (
                        <Code className="w-3 h-3 q-text-muted shrink-0" />
                      ) : null}
                      <span
                        className={`truncate ${
                          item.type === 'heading' && (item.level || 1) === 1
                            ? 'font-semibold text-white/90'
                            : item.type === 'heading' && (item.level || 1) === 2
                            ? 'font-medium text-white/75'
                            : ''
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                  ))}
                  {tocItems.length === 0 && (
                    <div className="text-[11px] q-text-muted italic px-2 py-2">
                      {isEn ? 'No headings or subpages yet.' : 'Belum ada heading atau subhalaman.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Interactive Tasks / Checklists (Grouped per To-Do List) */}
            {tocTab === 'tasks' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold q-text-muted uppercase tracking-wider">
                    {isEn
                      ? `Tasks (${extractedTaskGroups.totalCount})`
                      : `Daftar Tugas (${extractedTaskGroups.totalCount})`}
                  </span>
                  {extractedTaskGroups.totalCount > 0 && (
                    <span className="text-[10px] text-white/45 font-medium tabular-nums">
                      {extractedTaskGroups.completedCount}/{extractedTaskGroups.totalCount}
                    </span>
                  )}
                </div>

                {extractedTaskGroups.groups.map((group) => {
                  const groupDone = group.tasks.filter((t) => t.completed).length;
                  return (
                    <div
                      key={group.id}
                      className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5 pb-1">
                        <span className="text-[11px] font-semibold text-white/65 truncate" title={group.title}>
                          {group.title}
                        </span>
                        <span className="text-[10px] text-white/35 font-medium tabular-nums shrink-0">
                          {groupDone}/{group.tasks.length}
                        </span>
                      </div>
                      {group.tasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('toggle-note-task', {
                                detail: { lineIndex: t.lineIndex, completed: !t.completed },
                              })
                            );
                          }}
                          style={{ paddingLeft: `${8 + t.depth * 14}px` }}
                          className="w-full flex items-start gap-2 pr-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-xs q-text-secondary text-left transition-colors group"
                          title={
                            t.completed
                              ? isEn
                                ? 'Mark incomplete'
                                : 'Tandai belum selesai'
                              : isEn
                              ? 'Mark complete'
                              : 'Tandai selesai'
                          }
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/35 group-hover:text-white/75 transition-colors" />
                          )}
                          <span
                            className={`leading-snug break-words ${
                              t.completed ? 'line-through text-white/40' : 'text-white/85'
                            }`}
                          >
                            {t.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}

                {extractedTaskGroups.totalCount === 0 && (
                  <div className="text-[11px] q-text-muted italic px-2 py-2">
                    {isEn ? 'No checklist tasks in this note yet.' : 'Belum ada daftar tugas (- [ ]) di catatan ini.'}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Links, Images & File Attachments */}
            {tocTab === 'attachments' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {/* Links Section */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold q-text-muted uppercase tracking-wider px-1">
                    {isEn ? `Links (${extractedLinksAndMedia.links.length})` : `Tautan (${extractedLinksAndMedia.links.length})`}
                  </div>
                  {extractedLinksAndMedia.links.map((lk) => (
                    <a
                      key={lk.id}
                      href={lk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] text-xs text-white/80 hover:text-white transition-colors group"
                      title={lk.url}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-white/45 group-hover:text-white/80 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium leading-tight">{lk.title}</div>
                          {lk.title !== lk.host && (
                            <div className="truncate text-[10px] text-white/40 leading-tight mt-0.5">{lk.host}</div>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-white/35 group-hover:text-white/80 shrink-0" />
                    </a>
                  ))}
                  {extractedLinksAndMedia.links.length === 0 && (
                    <div className="text-[11px] q-text-muted italic px-2 py-1">
                      {isEn ? 'No links found.' : 'Belum ada tautan.'}
                    </div>
                  )}
                </div>

                {/* Media & Files Section */}
                {extractedLinksAndMedia.media.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                    <div className="text-[10px] font-semibold q-text-muted uppercase tracking-wider px-1">
                      {isEn ? `Media & Files (${extractedLinksAndMedia.media.length})` : `Media & File (${extractedLinksAndMedia.media.length})`}
                    </div>
                    {extractedLinksAndMedia.media.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] text-xs q-text-secondary"
                      >
                        {m.type === 'image' ? (
                          <ImageIcon className="w-3.5 h-3.5 q-text-muted shrink-0" />
                        ) : (
                          <Paperclip className="w-3.5 h-3.5 q-text-muted shrink-0" />
                        )}
                        <span className="truncate">{m.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 1. Clean Wordmark Brand Header & Sidebar Close Button */}
            <div className="flex items-center justify-between px-2 pt-0.5">
              <BrandLogo />

              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1.5 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 transition-colors"
                  title={isEn ? 'Hide Sidebar' : 'Sembunyikan Sidebar'}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 2. Sleek Compact Primary CTA */}
            <button
              onClick={onNewNote}
              className="w-full h-8 flex items-center justify-start gap-2 px-2.5 text-[13px] font-medium bg-white/[0.09] hover:bg-white/[0.14] text-white border border-white/[0.12] rounded-lg transition-all active:scale-[0.99] group"
            >
              <SquarePen className="w-3.5 h-3.5 text-white/75 group-hover:text-white transition-colors" />
              <span>{isEn ? 'New Note' : 'Catatan Baru'}</span>
            </button>

            {/* 3. Main Nav Menu (Vertical Hold-and-Scrub Liquid Glass Slider) */}
            <LiquidVerticalNav
              activeValue={selectedSubject || selectedTag ? null : activeFilter}
              onSelect={(val) => {
                onFilterChange(val);
                onSubjectChange(null);
                onTagChange(null);
              }}
              items={[
                {
                  value: 'all',
                  label: isEn ? 'All Notes' : 'Semua Catatan',
                  icon: <FileText className="w-4 h-4" />,
                  badge: totalNotes,
                },
                {
                  value: 'recent',
                  label: isEn ? 'Recently Opened' : 'Baru Dibuka',
                  icon: <History className="w-4 h-4" />,
                },
                {
                  value: 'favorites',
                  label: isEn ? 'Favorites' : 'Favorit',
                  icon: <Star className={`w-4 h-4 ${activeFilter === 'favorites' && !selectedSubject && !selectedTag ? 'fill-current' : ''}`} />,
                  badge: favoriteCount,
                },
                {
                  value: 'trash',
                  label: isEn ? 'Trash' : 'Tempat Sampah',
                  icon: <Trash2 className="w-4 h-4" />,
                  badge: trashCount,
                },
              ]}
            />

            {/* 4. Folders Section Header (Clean Notion-style — no noisy icon, flush left rail) */}
            <div className="space-y-0.5 pt-1 group/folders">
              <div className="flex items-center justify-between px-2 mb-0.5">
                <span className="text-[11.5px] font-medium text-white/45 tracking-wide">
                  {isEn ? 'Folders' : 'Folder'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/folders:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCreateFolderPrompt('')}
                    className="p-0.5 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 transition-colors"
                    title={isEn ? 'New Folder' : 'Tambah Folder'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFoldersSectionCollapsed(!isFoldersSectionCollapsed)}
                    className="p-0.5 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 transition-colors"
                    title={isFoldersSectionCollapsed ? (isEn ? 'Expand Folders' : 'Buka Folder') : (isEn ? 'Collapse Folders' : 'Tutup Folder')}
                  >
                    {isFoldersSectionCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {!isFoldersSectionCollapsed && (
                <div className="space-y-0.5">
                  {folderTree.size === 0 ? (
                    <p className="px-2 text-[12px] text-white/35">{isEn ? 'No folders yet' : 'Belum ada folder'}</p>
                  ) : (
                    <>
                      {(showAllFolders
                        ? Array.from(folderTree.values())
                        : Array.from(folderTree.values()).slice(0, 4)
                      ).map((rootNode) => renderFolderNode(rootNode, 0))}

                      {folderTree.size > 4 && (
                        <button
                          onClick={() => setShowAllFolders(!showAllFolders)}
                          className="w-full text-left px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:text-white hover:underline transition-colors block mt-1"
                        >
                          {showAllFolders
                            ? isEn ? 'Show less' : 'Sembunyikan'
                            : isEn ? `Show all (+${folderTree.size - 4})` : `Lihat semua (+${folderTree.size - 4} lagi)`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 5. Tags Section Header (Clean Notion-style — no noisy icon, flush left rail) */}
            <div className="space-y-0.5 pt-1 group/tags relative">
              <div className="flex items-center justify-between px-2 mb-0.5">
                <span className="text-[11.5px] font-medium text-white/45 tracking-wide">
                  {isEn ? 'Tags' : 'Tag'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/tags:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsPinTagPopoverOpen(!isPinTagPopoverOpen)}
                    className="p-0.5 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 transition-colors"
                    title={isEn ? 'Pin Tags' : 'Pilih Tag yang di-Pin'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsTagsCollapsed(!isTagsCollapsed)}
                    className="p-0.5 q-text-muted hover:q-text-primary rounded-lg hover:bg-white/10 transition-colors"
                    title={isTagsCollapsed ? (isEn ? 'Expand Tags' : 'Buka Tag') : (isEn ? 'Collapse Tags' : 'Tutup Tag')}
                  >
                    {isTagsCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pinned Tags Selection Popover Menu */}
              {isPinTagPopoverOpen && (
                <div
                  ref={tagPopoverRef}
                  className="absolute left-2 top-8 w-44 glass-popover rounded-2xl p-2 z-50 space-y-1"
                >
                  <p className="text-[10px] font-semibold q-text-muted px-2 py-1 uppercase tracking-wider">
                    {isEn ? 'Pin Tags' : 'Pilih Tag Pin'}
                  </p>
                  {tags.length === 0 ? (
                    <p className="text-[10px] q-text-muted px-2 py-1">{isEn ? 'No tags yet' : 'Belum ada tag'}</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {tags.map(({ name }) => {
                        const isPinned = pinnedTags.includes(name);
                        return (
                          <button
                            key={name}
                            onClick={() => togglePinTag(name)}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded-xl text-xs transition-colors ${
                              isPinned ? 'bg-white/[0.12] q-text-primary font-semibold' : 'q-text-secondary hover:bg-white/[0.06] hover:q-text-primary'
                            }`}
                          >
                            <span>#{name}</span>
                            {isPinned && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isTagsCollapsed && (
                <div className="space-y-0.5">
                  {tags.filter((t) => pinnedTags.includes(t.name)).length === 0 ? (
                    <p className="px-2 text-[12px] text-white/35">
                      {isEn ? 'No pinned tags' : 'Belum ada tag disematkan'}
                    </p>
                  ) : (
                    tags
                      .filter((t) => pinnedTags.includes(t.name))
                      .map(({ name }) => (
                        <button
                          key={name}
                          onClick={() => {
                            onFilterChange('all');
                            onSubjectChange(null);
                            onTagChange(selectedTag === name ? null : name);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] font-medium transition-all text-left ${
                            selectedTag === name
                              ? 'liquid-lens-active q-text-primary font-semibold'
                              : 'q-text-secondary hover:bg-white/[0.06] hover:q-text-primary border border-transparent'
                          }`}
                        >
                          <span className={selectedTag === name ? 'text-white' : 'q-text-muted'}>#</span>
                          <span>{name}</span>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* True iOS 26 Liquid Glass Sliding Lens Bottom Dock Switcher */}
      {selectedNoteId && (
        <div className="pt-2 pb-1 flex justify-center z-30 shrink-0 select-none w-full px-0.5">
          <LiquidSegmentedControl
            fullWidth
            size="sm"
            value={sidebarView}
            onChange={setSidebarView}
            options={[
              {
                value: 'folders',
                icon: <Folder className="w-3.5 h-3.5" />,
                label: isEn ? 'Folders' : 'Folder',
                title: isEn ? 'Browse Folders & Notes' : 'Navigasi Folder & Catatan',
              },
              {
                value: 'toc',
                icon: <FileText className="w-3.5 h-3.5" />,
                label: isEn ? 'Outline' : 'Struktur',
                title: isEn ? 'Note Outline & Subpages' : 'Struktur & Subhalaman Catatan',
              },
            ]}
          />
        </div>
      )}

      {/* 6. Bottom Left Footer (Only in Folders view) */}
      {sidebarView !== 'toc' && (
        <div className="pt-2 border-t border-white/[0.07] shrink-0 flex items-center justify-between">
          <button
            onClick={onOpenSettings}
            className="w-full h-9 flex items-center gap-2.5 px-2 text-[13.5px] font-medium q-text-secondary hover:q-text-primary hover:bg-white/[0.07] rounded-lg transition-colors"
            title={isEn ? 'Settings' : 'Pengaturan'}
          >
            <Settings className="w-4 h-4 q-text-muted" />
            <span>{isEn ? 'Settings' : 'Pengaturan'}</span>
          </button>
        </div>
      )}

      {/* Craft Delete Folder Confirmation Modal */}
      <ConfirmModal
        isOpen={!!folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={() => {
          if (folderToDelete && onDeleteFolder) {
            onDeleteFolder(folderToDelete.path);
          }
        }}
        title={`Delete ${folderToDelete?.name || ''}`}
        message="Documents inside the folder will not be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Rich Edit Folder Modal (Matching Create Folder Concept) */}
      <CreateFolderModal
        isOpen={!!folderToRename}
        onClose={() => setFolderToRename(null)}
        isEditMode={true}
        initialName={folderToRename?.name || ''}
        initialIcon={folderMetaMap?.[folderToRename?.path || '']?.icon || 'folder'}
        initialColor={folderMetaMap?.[folderToRename?.path || '']?.color || '#6366f1'}
        onFolderCreated={(newFolderTitle, _color, _icon) => {
          if (folderToRename && onRenameFolder) {
            const parts = folderToRename.path.split('/');
            parts[parts.length - 1] = newFolderTitle;
            const newPath = parts.join('/');
            onRenameFolder(folderToRename.path, newPath);
            if (selectedSubject === folderToRename.path) onSubjectChange(newPath);
          }
        }}
      />
    </aside>
  );
};
