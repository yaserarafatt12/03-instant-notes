import { describe, it, expect } from 'vitest';
import { searchNotes } from '../src/lib/search/searchEngine';
import type { Note } from '../src/types/note';

const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Rumus Fisika — Turunan & Integral',
    content: 'Integral tentu dan tak tentu. Turunan fungsi aljabar.',
    subject: 'Fisika',
    tags: ['Rumus', 'SMA'],
    isFavorite: true,
    isTrash: false,
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: '2',
    title: 'React Custom Hooks Guide',
    content: 'Creating useDebounce and useLocalStorage hooks in TypeScript.',
    subject: 'Programming',
    tags: ['React', 'TypeScript'],
    isFavorite: false,
    isTrash: false,
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: '3',
    title: 'Catatan Sampah',
    content: 'Ini adalah catatan yang sudah dihapus.',
    subject: 'Umum',
    tags: ['Deleted'],
    isFavorite: false,
    isTrash: true,
    createdAt: 500,
    updatedAt: 500,
  },
];

describe('InstantSearch Engine Tests (FR-200 Matrix)', () => {
  it('returns all active (non-trash) notes when query is empty (FR-201)', () => {
    const results = searchNotes(MOCK_NOTES, '');
    expect(results.length).toBe(2);
    expect(results.some((r) => r.note.id === '3')).toBe(false);
  });

  it('matches keyword in title with higher priority score (FR-202 & FR-206)', () => {
    const results = searchNotes(MOCK_NOTES, 'Integral');
    expect(results.length).toBe(1);
    expect(results[0].note.title).toContain('Integral');
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matchedTitle).toBe(true);
  });

  it('matches keyword in subject (FR-204)', () => {
    const results = searchNotes(MOCK_NOTES, 'Fisika');
    expect(results.length).toBe(1);
    expect(results[0].note.subject).toBe('Fisika');
    expect(results[0].matchedSubject).toBe(true);
  });

  it('matches keyword in tags (FR-205)', () => {
    const results = searchNotes(MOCK_NOTES, 'TypeScript');
    expect(results.length).toBe(1);
    expect(results[0].note.tags).toContain('TypeScript');
    expect(results[0].matchedTag).toBe(true);
  });

  it('supports fuzzy search for minor typos (FR-209)', () => {
    // Typo: 'Fisik' -> 'Fisika'
    const results = searchNotes(MOCK_NOTES, 'Fisik');
    expect(results.length).toBe(1);
    expect(results[0].note.subject).toBe('Fisika');
  });

  it('returns empty array when no matches are found', () => {
    const results = searchNotes(MOCK_NOTES, 'NonExistentKeywordXYZ');
    expect(results.length).toBe(0);
  });
});
