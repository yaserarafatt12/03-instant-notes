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
}

export type FilterCategory = 'all' | 'favorites' | 'trash';

export type SortOption = 'updated' | 'newest' | 'oldest' | 'a-z' | 'z-a';

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
