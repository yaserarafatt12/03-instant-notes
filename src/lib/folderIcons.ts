import {
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
  type LucideIcon,
} from 'lucide-react';

export interface FolderMeta {
  path: string;
  color?: string;
  icon?: string;
}

export const FOLDER_ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  money: DollarSign,
  book: Book,
  grad: GraduationCap,
  pencil: Pencil,
  pentool: PenTool,
  code: Code2,
  terminal: Terminal,
  music: Music,
  coffee: Coffee,
  paintbrush: Paintbrush,
  palette: Palette,
  health: Stethoscope,
  heart: Heart,
  work: Briefcase,
  chart: BarChart3,
  fitness: Dumbbell,
  scale: Scale,
  globe: Globe,
  travel: Plane,
  wrench: Wrench,
  paw: PawPrint,
  science: FlaskConical,
  brain: Brain,
  plant: Sprout,
};

export const getFolderIconComponent = (iconId?: string): LucideIcon => {
  if (!iconId) return Folder;
  return FOLDER_ICON_MAP[iconId] || Folder;
};
