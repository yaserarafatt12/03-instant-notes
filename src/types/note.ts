export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string; // e.g., 'Fisika', 'Matematika', 'Programming', 'Umum'
  tags: string[];
  isFavorite: boolean;
  isTrash: boolean;
  createdAt: number; // Unix timestamp in ms
  updatedAt: number; // Unix timestamp in ms
  lastOpenedAt?: number; // Unix timestamp in ms
}

export type FilterCategory = 'all' | 'favorites' | 'trash' | 'recent';

export type SortOption = 'updated' | 'newest' | 'oldest' | 'a-z' | 'z-a' | 'recent';

export type FontSizeOption = 'sm' | 'base' | 'lg';

export interface SearchResult {
  note: Note;
  score: number;
  matchedTitle: boolean;
  matchedSubject: boolean;
  matchedTag: boolean;
  snippet: string; // Excerpt around matched keyword
}

export interface AppState {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  activeFilter: FilterCategory;
  selectedSubject: string | null;
  selectedTag: string | null;
  sortOption: SortOption;
  fontSize: FontSizeOption;
  isEditorOpen: boolean;
  isDarkMode: boolean;
}

export type CollectionColumnType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'checkbox'
  | 'date'
  | 'url';

export interface CollectionColumnOption {
  id: string;
  name: string;
  color: string;
}

export type CollectionColumnAlign = 'left' | 'center' | 'right';

export interface CollectionColumn {
  id: string;
  name: string;
  type: CollectionColumnType;
  width?: number;
  align?: CollectionColumnAlign;
  options?: CollectionColumnOption[];
}

export interface CollectionRow {
  id: string;
  [columnId: string]: any;
}

export interface CollectionView {
  id: string;
  name: string;
  type: 'table' | 'gallery' | 'kanban';
}

export interface CollectionData {
  id: string;
  title: string;
  views: CollectionView[];
  activeViewId: string;
  columns: CollectionColumn[];
  rows: CollectionRow[];
}

