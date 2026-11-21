import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Folder,
  DollarSign,
  Book,
  GraduationCap,
  Pencil,
  PenTool,
  Code2,
  Terminal,
  Music,
  Coffee,
  Paintbrush,
  Palette,
  Stethoscope,
  Heart,
  Briefcase,
  BarChart3,
  Dumbbell,
  Scale,
  Globe,
  Plane,
  Wrench,
  PawPrint,
  FlaskConical,
  Brain,
  Sprout,
  Edit2,
} from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (folderPath: string, color?: string, icon?: string) => void;
  parentPath?: string;
  initialName?: string;
  initialIcon?: string;
  initialColor?: string;
  isEditMode?: boolean;
}

const AVAILABLE_ICONS = [
  { id: 'folder', Icon: Folder },
  { id: 'money', Icon: DollarSign },
  { id: 'book', Icon: Book },
  { id: 'grad', Icon: GraduationCap },
  { id: 'pencil', Icon: Pencil },
  { id: 'pentool', Icon: PenTool },
  { id: 'code', Icon: Code2 },
  { id: 'terminal', Icon: Terminal },
  { id: 'music', Icon: Music },
  { id: 'coffee', Icon: Coffee },
  { id: 'paintbrush', Icon: Paintbrush },
  { id: 'palette', Icon: Palette },
  { id: 'health', Icon: Stethoscope },
  { id: 'heart', Icon: Heart },
  { id: 'work', Icon: Briefcase },
  { id: 'chart', Icon: BarChart3 },
  { id: 'fitness', Icon: Dumbbell },
  { id: 'scale', Icon: Scale },
  { id: 'globe', Icon: Globe },
  { id: 'travel', Icon: Plane },
  { id: 'wrench', Icon: Wrench },
  { id: 'paw', Icon: PawPrint },
  { id: 'science', Icon: FlaskConical },
  { id: 'brain', Icon: Brain },
  { id: 'plant', Icon: Sprout },
];

const AVAILABLE_COLORS = [
  '#ffffff', // White
  '#ef6b6b', // Soft Coral Red
  '#f59e0b', // Soft Warm Orange
  '#facc15', // Soft Mellow Yellow
  '#4ade80', // Soft Sage Green
  '#60a5fa', // Soft Sky Blue
  '#a78bfa', // Soft Lavender Purple
  '#f472b6', // Soft Dusty Pink
  '#38bdf8', // Soft Cyan
  '#fb7185', // Soft Rose
  '#c084fc', // Soft Violet
  '#94a3b8', // Soft Slate
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onFolderCreated,
  parentPath = '',
  initialName = '',
  initialIcon = 'folder',
  initialColor = '#6366f1',
  isEditMode = false,
}) => {
  const [folderName, setFolderName] = useState(initialName);
  const [selectedIcon, setSelectedIcon] = useState(initialIcon);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const popoverRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setFolderName(initialName);
    setSelectedIcon(initialIcon);
    setSelectedColor(initialColor);
  }, [initialName, initialIcon, initialColor, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
        setShowColorPicker(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    let fullPath = folderName.trim();
    if (!isEditMode && parentPath) {
      fullPath = `${parentPath}/${folderName.trim()}`;
    }

    onFolderCreated(fullPath, selectedColor, selectedIcon);
    onClose();
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.id === selectedIcon)?.Icon || Folder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/75 backdrop-blur-md font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 space-y-5 relative overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            {isEditMode ? <Edit2 className="w-4 h-4 text-sky-400" /> : <Folder className="w-4 h-4 text-sky-400" />}
            <span>
              {isEditMode
                ? `Edit '${initialName}'`
                : parentPath
                ? `Subfolder di '${parentPath}'`
                : 'Create New Folder'}
            </span>
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" ref={popoverRef}>
          {/* TITLE Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TITLE
            </label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full px-3.5 py-2 glass-input rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* ICON Selection Row */}
          <div className="flex items-center justify-between py-2 border-b border-white/10 relative">
            <span className="text-xs font-semibold text-slate-200">Icon</span>
            <button
              type="button"
              onClick={() => {
                setShowIconPicker(!showIconPicker);
                setShowColorPicker(false);
              }}
              className="p-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 rounded-xl transition-all flex items-center gap-1.5"
            >
              <SelectedIconComp className="w-4 h-4 text-white" />
            </button>

            {/* Fully Floating & Scrollable Icon Picker Popover */}
            {showIconPicker && (
              <div className="absolute right-0 top-12 w-64 glass-popover rounded-2xl p-3 z-[100] max-h-48 overflow-y-auto space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Pilih Icon Folder</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVAILABLE_ICONS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(id);
                        setShowIconPicker(false);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        selectedIcon === id
                          ? 'liquid-lens-active text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLOR Selection Row */}
          <div className="flex items-center justify-between py-2 border-b border-white/10 relative">
            <span className="text-xs font-semibold text-slate-200">Color</span>
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowIconPicker(false);
              }}
              className="w-6 h-6 rounded-full border border-white/30 shadow-xs transition-transform hover:scale-105"
              style={{ backgroundColor: selectedColor }}
            />

            {/* Color Palette Popover */}
            {showColorPicker && (
              <div className="absolute right-0 top-12 w-48 glass-popover rounded-2xl p-2.5 z-[100] grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-7 h-7 rounded-full transition-all border ${
                      selectedColor === c ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!folderName.trim()}
            className="w-full mt-2 py-2.5 px-4 glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full transition-all active:scale-[0.98]"
          >
            {isEditMode ? 'Save Changes' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};
