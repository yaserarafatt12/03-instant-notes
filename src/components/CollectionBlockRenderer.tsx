import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table as TableIcon,
  LayoutGrid,
  Kanban as KanbanIcon,
  Plus,
  Search,
  Trash2,
  ChevronDown,
  GripVertical,
  ArrowRight,
  Check,
  X,
  Calendar,
  Hash,
  Type,
  Tag,
  Tags,
  CheckSquare,
  Link2,
  Copy,
  Layers,
} from 'lucide-react';
import type {
  CollectionData,
  CollectionColumn,
  CollectionColumnType,
  CollectionRow,
  CollectionView,
  CollectionColumnOption,
} from '../types/note';

const DEFAULT_COLORS = [
  { id: 'purple', label: 'Purple', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'emerald', label: 'Green', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'amber', label: 'Yellow', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'rose', label: 'Red', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'zinc', label: 'Gray', class: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
];

export const createDefaultCollection = (customType: 'table' | 'gallery' | 'kanban' = 'table'): CollectionData => {
  const colId = 'col-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const view1Id = 'v1';
  const c1Id = 'col_title';
  const c2Id = 'col_items';

  return {
    id: colId,
    title: 'Collection',
    views: [
      { id: view1Id, name: customType === 'gallery' ? 'Gallery' : customType === 'kanban' ? 'Kanban' : 'Table', type: customType },
    ],
    activeViewId: view1Id,
    columns: [
      { id: c1Id, name: 'Title', type: 'text', width: 280 },
      {
        id: c2Id,
        name: 'Items',
        type: 'select',
        width: 220,
        options: [
          { id: 'opt_1', name: 'Design', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
          { id: 'opt_2', name: 'Engineering', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
          { id: 'opt_3', name: 'Product', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
        ],
      },
    ],
    rows: [
      { id: 'r1', [c1Id]: '', [c2Id]: '' },
      { id: 'r2', [c1Id]: '', [c2Id]: '' },
      { id: 'r3', [c1Id]: '', [c2Id]: '' },
    ],
  };
};

const getColumnTypeIcon = (type: CollectionColumnType, className = 'w-3.5 h-3.5') => {
  switch (type) {
    case 'text':
      return <Type className={className} />;
    case 'number':
      return <Hash className={className} />;
    case 'select':
      return <Tag className={className} />;
    case 'multi-select':
      return <Tags className={className} />;
    case 'checkbox':
      return <CheckSquare className={className} />;
    case 'date':
      return <Calendar className={className} />;
    case 'url':
      return <Link2 className={className} />;
    default:
      return <Type className={className} />;
  }
};

interface CollectionBlockRendererProps {
  data: CollectionData;
  idx: number;
  isSelected?: boolean;
  isAllSelected?: boolean;
  isDragging?: boolean;
  onUpdate: (updatedData: CollectionData) => void;
  onDelete: () => void;
  onSelectBlock?: (multi: boolean) => void;
  onDragStart?: (idx: number, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (idx: number, e: React.DragEvent) => void;
  onDrop?: (idx: number, e: React.DragEvent) => void;
  dropIndicatorState?: { index: number; position: 'before' | 'after'; label?: string } | null;
}

export const CollectionBlockRenderer: React.FC<CollectionBlockRendererProps> = ({
  data,
  idx,
  isSelected,
  isAllSelected,
  isDragging,
  onUpdate,
  onDelete,
  onSelectBlock,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dropIndicatorState,
}) => {
  const [collection, setCollection] = useState<CollectionData>(data);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [activeMenuColumnId, setActiveMenuColumnId] = useState<string | null>(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [selectMenuCell, setSelectMenuCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [newOptionInput, setNewOptionInput] = useState('');
  const cellInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Automatically focus DOM input element whenever activeCell changes
  useEffect(() => {
    if (activeCell) {
      const key = `${activeCell.rowId}_${activeCell.colId}`;
      const el = cellInputRefs.current.get(key);
      if (el) {
        el.focus();
      }
    }
  }, [activeCell]);

  // Keep local state in sync when external note changes
  useEffect(() => {
    setCollection(data);
  }, [data]);

  const updateAndSave = (next: CollectionData) => {
    setCollection(next);
    onUpdate(next);
  };

  const activeView = useMemo(() => {
    return (
      collection.views.find((v) => v.id === collection.activeViewId) ||
      collection.views[0] || { id: 'v1', name: 'Table', type: 'table' }
    );
  }, [collection.views, collection.activeViewId]);

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return collection.rows;
    const q = searchQuery.toLowerCase();
    return collection.rows.filter((row) => {
      return collection.columns.some((col) => {
        const val = row[col.id];
        if (val === undefined || val === null) return false;
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (typeof val === 'number') return String(val).includes(q);
        if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
        return false;
      });
    });
  }, [collection.rows, collection.columns, searchQuery]);

  // Title Update
  const handleTitleChange = (newTitle: string) => {
    updateAndSave({ ...collection, title: newTitle });
  };

  // Switch Active View
  const handleSwitchView = (viewId: string) => {
    updateAndSave({ ...collection, activeViewId: viewId });
  };

  // Add View
  const handleAddView = (type: 'table' | 'gallery' | 'kanban') => {
    const newViewId = 'v_' + Date.now().toString(36);
    const name = type === 'gallery' ? `Gallery ${collection.views.length + 1}` : type === 'kanban' ? `Kanban ${collection.views.length + 1}` : `Table ${collection.views.length + 1}`;
    const newViews: CollectionView[] = [...collection.views, { id: newViewId, name, type }];
    updateAndSave({ ...collection, views: newViews, activeViewId: newViewId });
    setIsAddViewOpen(false);
  };

  // Delete View
  const handleDeleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (collection.views.length <= 1) return;
    const newViews = collection.views.filter((v) => v.id !== viewId);
    const nextActiveId = collection.activeViewId === viewId ? newViews[0].id : collection.activeViewId;
    updateAndSave({ ...collection, views: newViews, activeViewId: nextActiveId });
  };

  // Cell Value Update
  const handleCellChange = (rowId: string, colId: string, value: any) => {
    const newRows = collection.rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, [colId]: value };
      }
      return row;
    });
    updateAndSave({ ...collection, rows: newRows });
  };

  // Add Row with immediate active cell focus
  const handleAddRow = () => {
    const newRowId = 'r_' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
    const newRow: CollectionRow = { id: newRowId };
    collection.columns.forEach((col) => {
      newRow[col.id] = col.type === 'checkbox' ? false : '';
    });
    const firstColId = collection.columns[0]?.id || 'col_title';
    updateAndSave({ ...collection, rows: [...collection.rows, newRow] });
    setTimeout(() => {
      setActiveCell({ rowId: newRowId, colId: firstColId });
    }, 15);
  };

  // Delete Row
  const handleDeleteRow = (rowId: string) => {
    const newRows = collection.rows.filter((r) => r.id !== rowId);
    updateAndSave({ ...collection, rows: newRows });
    if (activeCell?.rowId === rowId) setActiveCell(null);
  };

  // Duplicate Row
  const handleDuplicateRow = (rowId: string) => {
    const idx = collection.rows.findIndex((r) => r.id === rowId);
    if (idx === -1) return;
    const source = collection.rows[idx];
    const newRowId = 'r_' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
    const duplicated: CollectionRow = { ...source, id: newRowId };
    const newRows = [...collection.rows];
    newRows.splice(idx + 1, 0, duplicated);
    updateAndSave({ ...collection, rows: newRows });
  };

  // Add Column
  const handleAddColumn = (type: CollectionColumnType, name: string) => {
    const newColId = 'col_' + Date.now().toString(36);
    const newColumn: CollectionColumn = {
      id: newColId,
      name: name || `Property ${collection.columns.length + 1}`,
      type,
      width: type === 'checkbox' ? 100 : 200,
      options: type === 'select' || type === 'multi-select' ? [
        { id: 'opt_1', name: 'Option 1', color: DEFAULT_COLORS[0].class },
      ] : undefined,
    };
    updateAndSave({ ...collection, columns: [...collection.columns, newColumn] });
    setIsAddColumnOpen(false);
  };

  // Rename Column
  const handleRenameColumn = (colId: string, newName: string) => {
    const newColumns = collection.columns.map((c) => (c.id === colId ? { ...c, name: newName } : c));
    updateAndSave({ ...collection, columns: newColumns });
  };

  // Change Column Type
  const handleChangeColumnType = (colId: string, newType: CollectionColumnType) => {
    const newColumns = collection.columns.map((c) => {
      if (c.id === colId) {
        return {
          ...c,
          type: newType,
          options: (newType === 'select' || newType === 'multi-select') && !c.options ? [
            { id: 'opt_1', name: 'Option 1', color: DEFAULT_COLORS[0].class },
          ] : c.options,
        };
      }
      return c;
    });
    updateAndSave({ ...collection, columns: newColumns });
    setActiveMenuColumnId(null);
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    if (collection.columns.length <= 1) return;
    const newColumns = collection.columns.filter((c) => c.id !== colId);
    updateAndSave({ ...collection, columns: newColumns });
    setActiveMenuColumnId(null);
  };

  // Column Resizing via Mouse Drag
  const handleColumnResizeStart = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const targetCol = collection.columns.find((c) => c.id === colId);
    const startWidth = targetCol?.width || 200;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(100, Math.min(600, startWidth + deltaX));
      setCollection((prev) => ({
        ...prev,
        columns: prev.columns.map((c) => (c.id === colId ? { ...c, width: newWidth } : c)),
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setCollection((finalState) => {
        onUpdate(finalState);
        return finalState;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Add Option to Select Column
  const handleAddOption = (colId: string, optName: string) => {
    if (!optName.trim()) return;
    const targetCol = collection.columns.find((c) => c.id === colId);
    if (!targetCol) return;
    const colorIndex = (targetCol.options?.length || 0) % DEFAULT_COLORS.length;
    const newOpt: CollectionColumnOption = {
      id: 'opt_' + Date.now().toString(36),
      name: optName.trim(),
      color: DEFAULT_COLORS[colorIndex].class,
    };
    const newOptions = [...(targetCol.options || []), newOpt];
    const newColumns = collection.columns.map((c) => (c.id === colId ? { ...c, options: newOptions } : c));
    updateAndSave({ ...collection, columns: newColumns });
    setNewOptionInput('');
  };

  // Keyboard Navigation inside cells
  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next row
      if (rowIdx < collection.rows.length - 1) {
        setActiveCell({ rowId: collection.rows[rowIdx + 1].id, colId: collection.columns[colIdx].id });
      } else {
        // Create new row on Enter at last row
        handleAddRow();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Move to prev cell
        if (colIdx > 0) {
          setActiveCell({ rowId: collection.rows[rowIdx].id, colId: collection.columns[colIdx - 1].id });
        } else if (rowIdx > 0) {
          setActiveCell({ rowId: collection.rows[rowIdx - 1].id, colId: collection.columns[collection.columns.length - 1].id });
        }
      } else {
        // Move to next cell
        if (colIdx < collection.columns.length - 1) {
          setActiveCell({ rowId: collection.rows[rowIdx].id, colId: collection.columns[colIdx + 1].id });
        } else if (rowIdx < collection.rows.length - 1) {
          setActiveCell({ rowId: collection.rows[rowIdx + 1].id, colId: collection.columns[0].id });
        } else {
          handleAddRow();
        }
      }
    } else if (e.key === 'Escape') {
      setActiveCell(null);
    }
  };

  return (
    <div
      className={`group/block relative transition-all my-4 w-full ${isDragging ? 'opacity-30 scale-[0.98]' : ''}`}
      onDragOver={(e) => onDragOver?.(idx, e)}
      onDrop={(e) => onDrop?.(idx, e)}
    >
      {dropIndicatorState?.index === idx && (
        <div
          className={`absolute left-0 right-0 z-40 flex items-center pointer-events-none ${
            dropIndicatorState.position === 'before' ? '-top-1' : '-bottom-1'
          }`}
        >
          <div className="w-full h-[2.5px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
        </div>
      )}

      {/* Drag Grip Handle */}
      <div
        draggable
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock?.(e.shiftKey);
        }}
        onDragStart={(e) => onDragStart?.(idx, e)}
        onDragEnd={onDragEnd}
        className="absolute -left-7 top-6 -translate-y-1/2 text-zinc-600 group-hover/block:text-zinc-400 cursor-grab opacity-0 group-hover/block:opacity-100 transition-opacity z-10 p-1 hover:bg-white/10 rounded"
        title="Klik untuk seleksi / geser Collection Database"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Main Database Container */}
      <div
        className={`relative group/colcard rounded-2xl bg-[#0B172E]/80 backdrop-blur-xl border transition-all overflow-hidden font-sans shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_14px_36px_rgba(2,6,23,0.45)] ${
          isSelected
            ? 'ring-2 ring-sky-400/80 border-sky-400/80 shadow-2xl'
            : isAllSelected
            ? 'ring-1 ring-sky-400/50 border-sky-400/80'
            : 'border-white/15 hover:border-sky-300/30'
        }`}
      >
        {/* Top Header Section */}
        <div className="px-4 pt-3.5 pb-2 border-b border-white/10 space-y-2.5 bg-white/[0.03]">
          {/* Collection Title */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-400/25">
                <Layers className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={collection.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Collection Title"
                className="text-base font-bold text-slate-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-sky-400/50 rounded px-1.5 py-0.5 w-full transition-all"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-lg transition-colors border ${
                  isSearchOpen
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/35'
                    : 'bg-white/[0.06] text-slate-400 hover:text-white border-white/10'
                }`}
                title="Cari dalam database"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/15 hover:border-sky-400/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
                title="Tambah baris data baru"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Baris Baru</span>
              </button>

              <button
                onClick={onDelete}
                className="p-1.5 bg-white/[0.06] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-400/30 rounded-lg transition-colors shadow-sm"
                title="Hapus Collection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* View Tabs Bar + Search Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 bg-[#071123]/75 p-1 rounded-full border border-white/10 shadow-inner">
              {collection.views.map((v) => {
                const isActive = v.id === activeView.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSwitchView(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'liquid-lens-active text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {v.type === 'table' && <TableIcon className="w-3.5 h-3.5" />}
                    {v.type === 'gallery' && <LayoutGrid className="w-3.5 h-3.5" />}
                    {v.type === 'kanban' && <KanbanIcon className="w-3.5 h-3.5" />}
                    <span>{v.name}</span>
                    {collection.views.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteView(v.id, e)}
                        className="ml-0.5 opacity-40 hover:opacity-100 hover:text-rose-400 p-0.5"
                        title="Hapus tampilan"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsAddViewOpen(!isAddViewOpen)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="Tambah Tampilan Baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {isAddViewOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-7 w-36 glass-popover rounded-2xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => handleAddView('table')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 hover:text-sky-200 text-slate-200 text-left transition-colors"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Table</span>
                    </button>
                    <button
                      onClick={() => handleAddView('gallery')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 hover:text-sky-200 text-slate-200 text-left transition-colors"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Gallery</span>
                    </button>
                    <button
                      onClick={() => handleAddView('kanban')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 hover:text-sky-200 text-slate-200 text-left transition-colors"
                    >
                      <KanbanIcon className="w-3.5 h-3.5" />
                      <span>Kanban</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* In-database Search Filter */}
            {isSearchOpen && (
              <div className="flex items-center gap-1.5 glass-input rounded-full px-2.5 py-1 animate-in fade-in duration-150">
                <Search className="w-3.5 h-3.5 text-sky-400/80" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari baris..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 border-none focus:outline-none w-32"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* VIEW BODY */}
        {activeView.type === 'table' && (
          <div className="overflow-x-auto w-full select-text">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#071123]/65 text-xs font-semibold text-slate-400 select-none">
                  {/* Row Index Column */}
                  <th className="w-12 px-3 py-2 text-center text-zinc-500 font-mono border-r border-white/5">
                    #
                  </th>

                  {/* Property Columns */}
                  {collection.columns.map((col) => (
                    <th
                      key={col.id}
                      style={{ width: col.width || 200, minWidth: 120 }}
                      className="relative px-3 py-2 border-r border-white/5 group/th"
                    >
                      <div
                        onClick={() => setActiveMenuColumnId(activeMenuColumnId === col.id ? null : col.id)}
                        className="flex items-center justify-between gap-1.5 cursor-pointer hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-indigo-400">{getColumnTypeIcon(col.type)}</span>
                          <span className="truncate">{col.name}</span>
                        </div>
                        <ChevronDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      </div>

                      {/* Column Settings Popover */}
                      {activeMenuColumnId === col.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-2 top-8 w-48 glass-popover rounded-2xl z-50 p-2.5 text-xs font-normal text-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Nama Kolom
                            </label>
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                              className="w-full glass-input rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                              Tipe Kolom
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              {(['text', 'number', 'select', 'checkbox', 'date', 'url'] as CollectionColumnType[]).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => handleChangeColumnType(col.id, t)}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] capitalize text-left transition-colors ${
                                    col.type === t ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'hover:bg-white/5'
                                  }`}
                                >
                                  {getColumnTypeIcon(t, 'w-3 h-3')}
                                  <span>{t}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-1 border-t border-white/10 flex justify-between items-center">
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              disabled={collection.columns.length <= 1}
                              className="text-[11px] text-rose-400 hover:text-rose-300 disabled:opacity-30 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Kolom</span>
                            </button>
                            <button
                              onClick={() => setActiveMenuColumnId(null)}
                              className="text-[11px] text-zinc-400 hover:text-white"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Column Resize Handle */}
                      <div
                        onMouseDown={(e) => handleColumnResizeStart(col.id, e)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 hover:w-2 hover:bg-indigo-500/80 cursor-col-resize transition-all z-10"
                        title="Tarik untuk mengubah lebar kolom"
                      />
                    </th>
                  ))}

                  {/* Add Column Button Header */}
                  <th className="w-12 px-2 py-2 text-center">
                    <div className="relative">
                      <button
                        onClick={() => setIsAddColumnOpen(!isAddColumnOpen)}
                        className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Tambah Kolom Properti"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {isAddColumnOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-7 w-40 glass-popover rounded-2xl z-50 py-1 text-xs text-left animate-in fade-in zoom-in-95 duration-150"
                        >
                          <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Pilih Tipe Kolom
                          </p>
                          {(['text', 'number', 'select', 'checkbox', 'date', 'url'] as CollectionColumnType[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => handleAddColumn(t, '')}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 hover:text-sky-200 text-slate-200 capitalize transition-colors"
                            >
                              {getColumnTypeIcon(t)}
                              <span>{t}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, rowIdx) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] group/tr transition-colors text-xs text-zinc-200"
                  >
                    {/* Row Index with Action Menu on Hover */}
                    <td className="px-2 py-1.5 text-center text-zinc-500 font-mono text-[11px] border-r border-white/5 relative group-hover/tr:text-zinc-300 select-none">
                      <span className="group-hover/tr:hidden">{rowIdx + 1}</span>
                      <div className="hidden group-hover/tr:flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Property Cells */}
                    {collection.columns.map((col, colIdx) => {
                      const isFocused = activeCell?.rowId === row.id && activeCell?.colId === col.id;
                      const cellVal = row[col.id];

                      return (
                        <td
                          key={col.id}
                          onClick={() => setActiveCell({ rowId: row.id, colId: col.id })}
                          className={`px-3 py-1.5 border-r border-white/5 relative transition-all ${
                            isFocused
                              ? 'ring-2 ring-indigo-500/80 bg-[#1c1d29] z-20 shadow-sm'
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          {/* Type 1: Text / Title */}
                          {col.type === 'text' && (
                            <div className="flex items-center justify-between gap-1 w-full">
                              <input
                                ref={(el) => {
                                  const key = `${row.id}_${col.id}`;
                                  if (el) cellInputRefs.current.set(key, el);
                                  else cellInputRefs.current.delete(key);
                                }}
                                type="text"
                                value={cellVal || ''}
                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                                onFocus={() => setActiveCell({ rowId: row.id, colId: col.id })}
                                placeholder="Empty"
                                className="w-full bg-transparent border-none focus:outline-none text-zinc-200 text-xs placeholder-zinc-600 truncate py-0.5"
                              />
                              {isFocused && (
                                <button
                                  className="text-zinc-500 hover:text-indigo-400 p-0.5"
                                  title="Quick action"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Type 2: Number */}
                          {col.type === 'number' && (
                            <input
                              ref={(el) => {
                                const key = `${row.id}_${col.id}`;
                                if (el) cellInputRefs.current.set(key, el);
                                else cellInputRefs.current.delete(key);
                              }}
                              type="number"
                              value={cellVal ?? ''}
                              onChange={(e) => handleCellChange(row.id, col.id, e.target.value === '' ? '' : Number(e.target.value))}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                              onFocus={() => setActiveCell({ rowId: row.id, colId: col.id })}
                              placeholder="0"
                              className="w-full bg-transparent border-none focus:outline-none text-zinc-200 text-xs placeholder-zinc-600 font-mono py-0.5"
                            />
                          )}

                          {/* Type 3: Select / Single Tag */}
                          {col.type === 'select' && (
                            <div className="relative">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectMenuCell(selectMenuCell?.rowId === row.id && selectMenuCell?.colId === col.id ? null : { rowId: row.id, colId: col.id });
                                }}
                                className="flex items-center justify-between cursor-pointer min-h-[22px]"
                              >
                                {cellVal ? (
                                  (() => {
                                    const opt = col.options?.find((o) => o.id === cellVal || o.name === cellVal);
                                    return (
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                          opt?.color || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                                        }`}
                                      >
                                        {opt?.name || cellVal}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-zinc-600 text-xs italic">Pilih...</span>
                                )}
                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                              </div>

                              {/* Select Options Popover */}
                              {selectMenuCell?.rowId === row.id && selectMenuCell?.colId === col.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 top-7 w-44 glass-popover rounded-2xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-1.5"
                                >
                                  <div className="space-y-1 max-h-36 overflow-y-auto">
                                    {col.options?.map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={() => {
                                          handleCellChange(row.id, col.id, opt.id);
                                          setSelectMenuCell(null);
                                        }}
                                        className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left transition-colors ${
                                          cellVal === opt.id ? 'bg-indigo-500/20 font-semibold' : 'hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={`px-2 py-0.5 rounded text-[11px] border ${opt.color}`}>
                                          {opt.name}
                                        </span>
                                        {cellVal === opt.id && <Check className="w-3 h-3 text-indigo-400" />}
                                      </button>
                                    ))}
                                    {cellVal && (
                                      <button
                                        onClick={() => {
                                          handleCellChange(row.id, col.id, '');
                                          setSelectMenuCell(null);
                                        }}
                                        className="w-full px-2 py-1 text-zinc-400 hover:text-rose-400 text-left text-[11px]"
                                      >
                                        Hapus Pilihan
                                      </button>
                                    )}
                                  </div>

                                  {/* Create new option input */}
                                  <div className="pt-1.5 border-t border-white/10 flex gap-1">
                                    <input
                                      type="text"
                                      value={newOptionInput}
                                      onChange={(e) => setNewOptionInput(e.target.value)}
                                      placeholder="Opsi baru..."
                                      className="bg-[#14151b] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddOption(col.id, newOptionInput);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleAddOption(col.id, newOptionInput)}
                                      className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Type 4: Checkbox */}
                          {col.type === 'checkbox' && (
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={Boolean(cellVal)}
                                onChange={(e) => handleCellChange(row.id, col.id, e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-[#1c1d25] text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                            </div>
                          )}

                          {/* Type 5: Date */}
                          {col.type === 'date' && (
                            <input
                              ref={(el) => {
                                const key = `${row.id}_${col.id}`;
                                if (el) cellInputRefs.current.set(key, el);
                                else cellInputRefs.current.delete(key);
                              }}
                              type="date"
                              value={cellVal || ''}
                              onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                              className="bg-transparent border-none focus:outline-none text-zinc-200 text-xs py-0.5 w-full cursor-pointer"
                            />
                          )}

                          {/* Type 6: URL */}
                          {col.type === 'url' && (
                            <div className="flex items-center gap-1">
                              <input
                                ref={(el) => {
                                  const key = `${row.id}_${col.id}`;
                                  if (el) cellInputRefs.current.set(key, el);
                                  else cellInputRefs.current.delete(key);
                                }}
                                type="url"
                                value={cellVal || ''}
                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                                placeholder="https://..."
                                className="w-full bg-transparent border-none focus:outline-none text-indigo-400 text-xs placeholder-zinc-600 truncate py-0.5"
                              />
                              {cellVal && (
                                <a
                                  href={cellVal.startsWith('http') ? cellVal : `https://${cellVal}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-500 hover:text-indigo-300"
                                >
                                  <Link2 className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row End Actions */}
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => handleDuplicateRow(row.id)}
                        className="opacity-0 group-hover/tr:opacity-100 text-zinc-500 hover:text-white p-0.5 transition-opacity"
                        title="Duplikat baris"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom Add Row Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#071123]/75 border-t border-white/10 select-none">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-sky-300 transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.06]"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Baris Baru</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {collection.rows.length} baris
              </span>
            </div>
          </div>
        )}

        {/* GALLERY VIEW */}
        {activeView.type === 'gallery' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredRows.map((row) => {
              const titleCol = collection.columns[0];
              const titleVal = row[titleCol?.id] || 'Untitled Item';
              return (
                <div
                  key={row.id}
                  className="group/card relative glass-card rounded-2xl p-3.5 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-100 truncate flex-1">{titleVal}</h4>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="opacity-0 group-hover/card:opacity-100 text-slate-400 hover:text-rose-400 p-0.5 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Properties */}
                  <div className="space-y-1 text-xs">
                    {collection.columns.slice(1).map((col) => {
                      const val = row[col.id];
                      if (!val && val !== 0 && val !== false) return null;
                      return (
                        <div key={col.id} className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 opacity-70">
                            {getColumnTypeIcon(col.type, 'w-3 h-3')}
                            <span>{col.name}:</span>
                          </span>
                          <span className="font-medium text-slate-200 truncate max-w-[120px]">
                            {col.type === 'select' ? (
                              (() => {
                                const opt = col.options?.find((o) => o.id === val || o.name === val);
                                return opt?.name || val;
                              })()
                            ) : String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add Item Card */}
            <button
              onClick={handleAddRow}
              className="flex flex-col items-center justify-center p-4 border border-dashed border-white/15 hover:border-sky-400/45 rounded-2xl text-slate-400 hover:text-white bg-[#071123]/55 hover:bg-[#0D1E3B]/70 transition-all min-h-[90px] gap-1"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold">Tambah Item</span>
            </button>
          </div>
        )}

        {/* KANBAN VIEW */}
        {activeView.type === 'kanban' && (
          <div className="p-4 flex gap-3 overflow-x-auto select-none">
            {(() => {
              const selectCol = collection.columns.find((c) => c.type === 'select') || collection.columns[1];
              const options = selectCol?.options || [
                { id: 'todo', name: 'Todo', color: DEFAULT_COLORS[0].class },
                { id: 'in_progress', name: 'In Progress', color: DEFAULT_COLORS[1].class },
                { id: 'done', name: 'Done', color: DEFAULT_COLORS[2].class },
              ];

              return options.map((opt) => {
                const columnRows = filteredRows.filter((r) => r[selectCol?.id || ''] === opt.id || r[selectCol?.id || ''] === opt.name);
                return (
                  <div
                    key={opt.id}
                    className="w-64 shrink-0 bg-[#071123]/70 border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${opt.color}`}>
                        {opt.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{columnRows.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2 flex-1 min-h-[120px]">
                      {columnRows.map((r) => {
                        const titleVal = r[collection.columns[0]?.id] || 'Untitled Card';
                        return (
                          <div
                            key={r.id}
                            className="bg-[#0D1C36]/85 hover:bg-[#13284C]/90 border border-white/15 rounded-xl p-2.5 shadow-sm space-y-1 cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-semibold text-slate-100">{titleVal}</p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        const newRowId = 'r_' + Date.now().toString(36);
                        const newRow: CollectionRow = { id: newRowId, [selectCol.id]: opt.id };
                        updateAndSave({ ...collection, rows: [...collection.rows, newRow] });
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl border border-dashed border-white/15 hover:border-sky-400/45 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-400" />
                      <span>Tambah Kartu</span>
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
