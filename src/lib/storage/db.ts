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

// Sample notes set to empty array per user request
export const SAMPLE_NOTES: Note[] = [];

export async function getAllNotes(): Promise<Note[]> {
  try {
    const db = await getDB();
    let notes = await db.getAll('notes');
    
    // Purge any legacy sample dummy notes automatically
    const sampleNotes = notes.filter((n) => n.id.startsWith('sample-'));
    if (sampleNotes.length > 0) {
      for (const s of sampleNotes) {
        await db.delete('notes', s.id);
      }
      notes = notes.filter((n) => !n.id.startsWith('sample-'));
    }

    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to read notes from IndexedDB:', error);
    const local = localStorage.getItem('instant_notes_fallback');
    if (local) {
      const parsed: Note[] = JSON.parse(local);
      return parsed.filter((n) => !n.id.startsWith('sample-'));
    }
    return [];
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

// FR-801 & FR-807 Backup Metadata Exporter
export async function exportBackupJSON(notes: Note[]): Promise<string> {
  const subjectsSet = new Set(notes.map((n) => n.subject).filter(Boolean));
  const tagsSet = new Set(notes.flatMap((n) => n.tags));

  return JSON.stringify(
    {
      app: 'InstantNotes',
      version: '1.0.0',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      metadata: {
        totalNotes: notes.length,
        totalSubjects: subjectsSet.size,
        totalTags: tagsSet.size,
      },
      notes,
      subjects: Array.from(subjectsSet),
      tags: Array.from(tagsSet),
    },
    null,
    2
  );
}

// FR-803 Single Note Plain Text (.txt) Exporter
export function exportNoteAsTXT(note: Note): void {
  const fileContent = `=========================================
${note.title || 'Catatan Tanpa Judul'}
=========================================
Subjek: ${note.subject || 'Tidak Ada'}
Tag: ${note.tags.length > 0 ? note.tags.join(', ') : 'Tidak Ada'}
Tanggal Diubah: ${new Date(note.updatedAt).toLocaleString('id-ID')}
=========================================

${note.content}
`;
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = (note.title || 'catatan').replace(/[^a-zA-Z0-9_-]/g, '_') + '.txt';
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// FR-804 & FR-805 Import Validation
export async function importBackupJSON(jsonString: string): Promise<Note[]> {
  const parsed = JSON.parse(jsonString);
  if (!parsed.notes || !Array.isArray(parsed.notes)) {
    throw new Error('Berkas cadangan tidak valid. Pastikan memilih file JSON cadangan InstantNotes.');
  }

  // Basic validation of required note fields
  for (const n of parsed.notes) {
    if (!n.id || typeof n.title !== 'string' || typeof n.content !== 'string') {
      throw new Error('Berkas cadangan korup atau berisi struktur catatan tidak valid.');
    }
  }

  const db = await getDB();
  const tx = db.transaction('notes', 'readwrite');
  for (const note of parsed.notes) {
    await tx.store.put(note);
  }
  await tx.done;
  return getAllNotes();
}
