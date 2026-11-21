export interface VersionSnapshot {
  id: string;
  noteId: string;
  timestamp: number;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  charCount: number;
}

const STORAGE_KEY = 'instant_notes_version_history_log';

export function getVersionLogs(noteId: string): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: VersionSnapshot[] = JSON.parse(raw);
    return all.filter((s) => s.noteId === noteId).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function saveVersionLog(note: { id: string; title: string; content: string; subject: string; tags: string[] }): void {
  if (!note.id || (!note.title && !note.content)) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let all: VersionSnapshot[] = raw ? JSON.parse(raw) : [];

    const existingLogs = all.filter((s) => s.noteId === note.id);
    const lastLog = existingLogs.sort((a, b) => b.timestamp - a.timestamp)[0];

    // Don't duplicate if content hasn't changed
    if (lastLog && lastLog.content === note.content && lastLog.title === note.title) {
      return;
    }

    const newSnapshot: VersionSnapshot = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      noteId: note.id,
      timestamp: Date.now(),
      title: note.title || 'Catatan Tanpa Judul',
      content: note.content,
      subject: note.subject,
      tags: [...note.tags],
      charCount: note.content.length,
    };

    // Keep max 20 snapshots per note
    const updatedNoteLogs = [newSnapshot, ...existingLogs].slice(0, 20);
    const otherLogs = all.filter((s) => s.noteId !== note.id);
    all = [...updatedNoteLogs, ...otherLogs];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Failed to save version log:', error);
  }
}

export function clearVersionLogs(noteId?: string): void {
  try {
    if (!noteId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all: VersionSnapshot[] = JSON.parse(raw);
    const filtered = all.filter((s) => s.noteId !== noteId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear version logs:', error);
  }
}
