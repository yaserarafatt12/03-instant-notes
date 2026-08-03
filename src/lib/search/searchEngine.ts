import type { Note, SearchResult } from '../../types/note';

/**
 * Levenshtein Distance for Fuzzy Search (FR-209)
 * Calculates character edits required between query term and target token
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Instant Search Engine for InstantNotes (FR-200 Matrix)
 * Features:
 * - Sub-100ms token-based matching & indexing
 * - Multi-field scoring (Title 50, Subject 30, Tag 30, Content 10)
 * - Excerpt/Snippet extraction with context around keyword match
 * - Levenshtein Fuzzy Search tolerance (FR-209) for typos (e.g. 'phyics' -> 'physics')
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

      // 1. Title Match (Weight 50)
      if (titleLower.includes(term)) {
        termScore += 50;
        matchedTitle = true;
      }

      // 2. Subject Match (Weight 30)
      if (subjectLower.includes(term)) {
        termScore += 30;
        matchedSubject = true;
      }

      // 3. Tag Match (Weight 30)
      if (tagsLower.some((tag) => tag.includes(term))) {
        termScore += 30;
        matchedTag = true;
      }

      // 4. Content Match (Weight 10)
      const contentIndex = contentLower.indexOf(term);
      if (contentIndex !== -1) {
        termScore += 10;
        matchedContent = true;
        if (firstMatchIndex === -1 || contentIndex < firstMatchIndex) {
          firstMatchIndex = contentIndex;
        }
      }

      // 5. Fuzzy Match Fallback (FR-209) if no exact match for terms >= 4 chars
      if (termScore === 0 && term.length >= 4) {
        const titleTokens = titleLower.split(/\W+/).filter(Boolean);
        const contentTokens = contentLower.split(/\W+/).filter(Boolean);

        for (const token of titleTokens) {
          if (Math.abs(token.length - term.length) <= 2) {
            const dist = levenshteinDistance(term, token);
            if (dist <= 1 || (term.length >= 6 && dist <= 2)) {
              termScore += 25;
              matchedTitle = true;
              break;
            }
          }
        }

        if (termScore === 0) {
          for (const token of contentTokens) {
            if (Math.abs(token.length - term.length) <= 2) {
              const dist = levenshteinDistance(term, token);
              if (dist <= 1 || (term.length >= 6 && dist <= 2)) {
                termScore += 5;
                matchedContent = true;
                break;
              }
            }
          }
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

  // Sort by relevance score descending, then by updatedAt descending
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.note.updatedAt - a.note.updatedAt;
  });
}
