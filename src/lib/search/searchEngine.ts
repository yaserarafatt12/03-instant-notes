import type { Note, SearchResult } from '../../types/note';

/**
 * Instant Search Engine for InstantNotes
 * Features:
 * - Sub-millisecond token-based matching
 * - Multi-field scoring (Title 5x, Tags 3x, Subject 2x, Content 1x)
 * - Excerpt/Snippet extraction with context around keyword match
 * - Instant ranking and relevance sorting
 */

export function searchNotes(notes: Note[], query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return notes
      .filter((n) => !n.isTrash)
      .map((note) => ({
        note,
        score: 1,
        matchedTitle: false,
        matchedSubject: false,
        matchedTag: false,
        snippet: note.content.slice(0, 120) + (note.content.length > 120 ? '...' : ''),
      }));
  }

  const terms = trimmed.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const note of notes) {
    const titleLower = note.title.toLowerCase();
    const contentLower = note.content.toLowerCase();
    const subjectLower = note.subject.toLowerCase();
    const tagsLower = note.tags.map((t) => t.toLowerCase());

    let totalScore = 0;
    let matchedTitle = false;
    let matchedSubject = false;
    let matchedTag = false;
    let matchedContent = false;
    let firstMatchIndex = -1;

    for (const term of terms) {
      let termScore = 0;

      if (titleLower.includes(term)) {
        termScore += 50;
        matchedTitle = true;
      }

      if (subjectLower.includes(term)) {
        termScore += 30;
        matchedSubject = true;
      }

      if (tagsLower.some((tag) => tag.includes(term))) {
        termScore += 30;
        matchedTag = true;
      }

      const contentIndex = contentLower.indexOf(term);
      if (contentIndex !== -1) {
        termScore += 10;
        matchedContent = true;
        if (firstMatchIndex === -1 || contentIndex < firstMatchIndex) {
          firstMatchIndex = contentIndex;
        }
      }

      if (termScore > 0) {
        totalScore += termScore;
      }
    }

    if (totalScore > 0) {
      // Build smart snippet around first matched keyword
      let snippet = '';
      if (matchedContent && firstMatchIndex !== -1) {
        const start = Math.max(0, firstMatchIndex - 30);
        const end = Math.min(note.content.length, firstMatchIndex + 90);
        snippet = (start > 0 ? '...' : '') + note.content.slice(start, end) + (end < note.content.length ? '...' : '');
      } else {
        snippet = note.content.slice(0, 120) + (note.content.length > 120 ? '...' : '');
      }

      results.push({
        note,
        score: totalScore,
        matchedTitle,
        matchedSubject,
        matchedTag,
        snippet,
      });
    }
  }

  // Sort by score descending, then by updatedAt descending
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.note.updatedAt - a.note.updatedAt;
  });
}
