export type ClassifiedBlock =
  | { kind: 'divider' }
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; prefix: string; content: string }
  | { kind: 'checklist'; indent: string; depth: number; checked: boolean; prefix: string; content: string }
  | { kind: 'blockquote'; depth: number; prefix: string; content: string }
  | { kind: 'bullet'; indent: string; depth: number; marker: string; prefix: string; content: string }
  | { kind: 'ordered'; indent: string; depth: number; ordinal: string; prefix: string; content: string }
  | { kind: 'paragraph'; prefix: ''; content: string };

const BULLET_MARKERS = ['•', '◦', '▪'];

export function classifyTextBlock(rawInput: string): ClassifiedBlock {
  const raw = rawInput || '';

  // 1. Horizontal Divider (---, ***, ___)
  if (/^\s*([-*_])\1{2,}\s*$/.test(raw)) {
    return { kind: 'divider' };
  }

  // 2. Headings H1–H6
  const headingMatch = raw.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    return {
      kind: 'heading',
      level,
      prefix: `${headingMatch[1]} `,
      content: headingMatch[2],
    };
  }

  // 3. Interactive Checklist (with optional nesting indent)
  const checklistMatch = raw.match(/^(\s*)-\s+\[([ xX])\]\s*(.*)$/);
  if (checklistMatch) {
    const indent = checklistMatch[1];
    const checked = checklistMatch[2].toLowerCase() === 'x';
    const depth = Math.floor(indent.replace(/\t/g, '  ').length / 2);
    return {
      kind: 'checklist',
      indent,
      depth,
      checked,
      prefix: `${indent}- [${checked ? 'x' : ' '}] `,
      content: checklistMatch[3],
    };
  }

  // 4. Blockquote (supports nested > >, > > >, etc.)
  const quoteMatch = raw.match(/^((?:>\s*)+)(.*)$/);
  if (quoteMatch) {
    const markers = quoteMatch[1].match(/>/g) || ['>'];
    const depth = Math.min(4, markers.length);
    const normalizedPrefix = `${Array(depth).fill('>').join(' ')} `;
    return {
      kind: 'blockquote',
      depth,
      prefix: normalizedPrefix,
      content: quoteMatch[2],
    };
  }

  // 5. Nested Unordered / Bullet List (• item, - item, * item)
  const bulletMatch = raw.match(/^(\s*)(?:•|◦|▪|[-*+])\s+(.*)$/);
  if (bulletMatch) {
    const indent = bulletMatch[1];
    const depth = Math.floor(indent.replace(/\t/g, '  ').length / 2);
    const marker = BULLET_MARKERS[Math.min(depth, BULLET_MARKERS.length - 1)];
    return {
      kind: 'bullet',
      indent,
      depth,
      marker,
      prefix: `${indent}• `,
      content: bulletMatch[2],
    };
  }

  // 6. Nested Ordered List (1. item, a. item, i. item)
  const orderedMatch = raw.match(/^(\s*)(\d+|[a-zA-Z])\.\s+(.*)$/);
  if (orderedMatch) {
    const indent = orderedMatch[1];
    const depth = Math.floor(indent.replace(/\t/g, '  ').length / 2);
    const ordinal = orderedMatch[2];
    return {
      kind: 'ordered',
      indent,
      depth,
      ordinal,
      prefix: `${indent}${ordinal}. `,
      content: orderedMatch[3],
    };
  }

  return { kind: 'paragraph', prefix: '', content: raw };
}

/**
 * Detects if a text line starts with a strong RTL script character (Arabic, Hebrew, Syriac, Thaana).
 */
export function isRtlText(text: string): boolean {
  const stripped = text
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]*\$/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~#>\-•◦▪\[\]()0-9.\s—–:;,!?'"/\\|]+/g, '');
  if (!stripped) return false;
  const firstChar = stripped[0];
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(firstChar);
}
