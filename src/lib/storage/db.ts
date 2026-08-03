import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Note } from '../../types/note';

interface InstantNotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      'by-updatedAt': number;
      'by-subject': string;
      'by-isFavorite': number;
      'by-isTrash': number;
    };
  };
}

const DB_NAME = 'instant-notes-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InstantNotesDB>> | null = null;

function getDB(): Promise<IDBPDatabase<InstantNotesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<InstantNotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('by-updatedAt', 'updatedAt');
        store.createIndex('by-subject', 'subject');
        store.createIndex('by-isFavorite', 'isFavorite');
        store.createIndex('by-isTrash', 'isTrash');
      },
    });
  }
  return dbPromise;
}

// Sample notes for zero-state demonstration
export const SAMPLE_NOTES: Note[] = [
  {
    id: 'sample-1',
    title: 'Rumus Fisika — Turunan & Integral Dasar',
    content: 'Integral Tentu: ∫(x^n) dx = (1/(n+1)) * x^(n+1) + C. Kasus Khusus: ∫(1/x) dx = ln|x| + C. Turunan Sinus: d/dx (sin x) = cos x. Turunan Kosinus: d/dx (cos x) = -sin x.',
    subject: 'Fisika',
    tags: ['Rumus', 'Kalkulus', 'SMA'],
    isFavorite: true,
    isTrash: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sample-2',
    title: 'Snippet Custom Hook React — useDebounce',
    content: 'import { useState, useEffect } from "react";\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}',
    subject: 'Programming',
    tags: ['React', 'TypeScript', 'CodeSnippet'],
    isFavorite: true,
    isTrash: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'sample-3',
    title: 'Ringkasan Materi Biologi — Sintesis Protein',
    content: 'Sintesis protein terdiri dari dua tahap utama: Transkripsi (pembentukan mRNA dari cetakan DNA di dalam inti sel) dan Translasi (pemerjemahan mRNA oleh ribosom menjadi rantai asam amino). PENTING: Kodon AUGA adalah kodon start (Metionin).',
    subject: 'Biologi',
    tags: ['Genetika', 'Sel', 'UTBK'],
    isFavorite: false,
    isTrash: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 5,
  },
];

export async function getAllNotes(): Promise<Note[]> {
  try {
    const db = await getDB();
    const notes = await db.getAll('notes');
    if (notes.length === 0) {
      // Seed with sample notes on first launch
      for (const sample of SAMPLE_NOTES) {
        await db.put('notes', sample);
      }
      return SAMPLE_NOTES;
    }
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to read notes from IndexedDB:', error);
    // Fallback to localStorage
    const local = localStorage.getItem('instant_notes_fallback');
    if (local) {
      return JSON.parse(local);
    }
    localStorage.setItem('instant_notes_fallback', JSON.stringify(SAMPLE_NOTES));
    return SAMPLE_NOTES;
  }
}

export async function saveNote(note: Note): Promise<void> {
  try {
    const db = await getDB();
    await db.put('notes', note);
  } catch (error) {
    console.error('IndexedDB save failed, using localStorage fallback:', error);
    const notes = await getAllNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.unshift(note);
    }
    localStorage.setItem('instant_notes_fallback', JSON.stringify(notes));
  }
}

export async function deleteNotePermanently(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('notes', id);
  } catch (error) {
    console.error('IndexedDB delete failed:', error);
  }
}

export async function exportBackupJSON(notes: Note[]): Promise<string> {
  return JSON.stringify(
    {
      app: 'InstantNotes',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length,
      notes,
    },
    null,
    2
  );
}

export async function importBackupJSON(jsonString: string): Promise<Note[]> {
  const parsed = JSON.parse(jsonString);
  if (!parsed.notes || !Array.isArray(parsed.notes)) {
    throw new Error('Invalid InstantNotes backup file format');
  }
  const db = await getDB();
  const tx = db.transaction('notes', 'readwrite');
  for (const note of parsed.notes) {
    await tx.store.put(note);
  }
  await tx.done;
  return getAllNotes();
}
