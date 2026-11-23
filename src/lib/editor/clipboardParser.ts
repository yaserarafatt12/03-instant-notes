import type { CollectionColumn, CollectionColumnAlign, CollectionData } from '../../types/note';
import { mapCssColorToPresetOrHex } from './markdownCodec';

export type ParsedPasteBlock =
  | { type: 'text'; id: string; content: string }
  | { type: 'code'; id: string; data: { id: string; lang: string; code: string } }
  | { type: 'mermaid'; id: string; data: { id: string; code: string } }
  | { type: 'collection'; id: string; data: CollectionData };

function wrapInlinePreservingSpaces(raw: string, open: string, close: string): string {
  const lead = raw.match(/^\s*/)?.[0] || '';
  const trail = raw.match(/\s*$/)?.[0] || '';
  const core = raw.trim();
  return core ? `${lead}${open}${core}${close}${trail}` : raw;
}

/**
 * Extract clean code text from <pre> / <code> while preserving newlines even when
 * ChatGPT, Notion, or Google Docs wraps lines inside <div>, <p>, or <br>.
 */
function extractPreformattedCode(preEl: HTMLElement): string {
  const clone = preEl.cloneNode(true) as HTMLElement;
  // Remove any embedded language header bars or buttons if still present
  clone.querySelectorAll('button, svg').forEach((n) => n.remove());

  const codeEl = clone.querySelector('code') || clone;
  // Replace <br> with actual newline text nodes
  codeEl.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  // Ensure block-level line wrappers inside <pre> terminate with newline
  codeEl.querySelectorAll('div, p').forEach((lineEl) => {
    if (lineEl.nextSibling) {
      lineEl.append('\n');
    }
  });

  return (codeEl.textContent || '').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
}

function getCellAlignment(cell: Element): CollectionColumnAlign {
  const el = cell as HTMLElement;
  const raw = (el.style?.textAlign || el.getAttribute('align') || '').toLowerCase().trim();
  if (raw === 'center') return 'center';
  if (raw === 'right' || raw === 'end') return 'right';
  return 'left';
}

function alignToSeparator(align: CollectionColumnAlign): string {
  if (align === 'center') return ':---:';
  if (align === 'right') return '---:';
  return '---';
}

export function parsePastedHtmlToMarkdown(htmlData: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlData, 'text/html');

  // 1. Preserve ChatGPT / KaTeX equations BEFORE stripping [aria-hidden="true"]!
  doc.querySelectorAll('.katex-display').forEach((node) => {
    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
    if (ann?.textContent) {
      node.replaceWith(doc.createTextNode(`\n$$${ann.textContent.replace(/\s*\n\s*/g, ' ').trim()}$$\n`));
    }
  });
  doc.querySelectorAll('.katex').forEach((node) => {
    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
    if (ann?.textContent) {
      node.replaceWith(doc.createTextNode(`$${ann.textContent.trim()}$`));
    }
  });

  // 2. Tag interactive checklist items BEFORE stripping buttons/SVGs/inputs (ChatGPT, Notion, GitHub, Google Docs)
  doc.querySelectorAll('li').forEach((li) => {
    const inputCb = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    const roleCb = li.querySelector('[role="checkbox"]');
    const dataChecked = li.getAttribute('data-checked');
    const isTaskClass =
      li.classList.contains('task-list-item') ||
      li.parentElement?.classList.contains('contains-task-list') ||
      li.getAttribute('data-type') === 'taskItem';

    if (inputCb) {
      const checked = inputCb.checked || inputCb.hasAttribute('checked') || inputCb.getAttribute('aria-checked') === 'true';
      li.setAttribute('data-task-checked', checked ? 'true' : 'false');
      inputCb.remove();
    } else if (roleCb) {
      const checked = roleCb.getAttribute('aria-checked') === 'true' || roleCb.getAttribute('data-state') === 'checked';
      li.setAttribute('data-task-checked', checked ? 'true' : 'false');
      roleCb.remove();
    } else if (dataChecked === 'true' || dataChecked === 'false') {
      li.setAttribute('data-task-checked', dataChecked);
    } else if (isTaskClass) {
      li.setAttribute('data-task-checked', 'false');
    }
  });

  // 3. Strip out UI buttons, SVGs, action bars (Copy, Share, Like, Dislike, 3-dots, etc.) — preserve <hr>
  doc.querySelectorAll('svg, button, nav, footer, script, style, form, iframe, [aria-hidden="true"]:not(hr), [role="button"]').forEach((node) => node.remove());

  function applyColorStyles(el: HTMLElement, text: string): string {
    let out = text;
    const style = el.style;
    const fontColor = el.tagName.toLowerCase() === 'font' ? el.getAttribute('color') : null;
    if (style?.backgroundColor) {
      const mappedBg = mapCssColorToPresetOrHex(style.backgroundColor);
      if (mappedBg && !mappedBg.startsWith('#')) {
        out = wrapInlinePreservingSpaces(out, `==${mappedBg}:`, '==');
      } else if (mappedBg) {
        out = wrapInlinePreservingSpaces(out, '==', '==');
      }
    }
    const rawFg = style?.color || fontColor;
    if (rawFg) {
      const mappedFg = mapCssColorToPresetOrHex(rawFg);
      if (mappedFg) {
        out = wrapInlinePreservingSpaces(out, `^^${mappedFg}:`, '^^');
      }
    }
    return out;
  }

  function walk(node: Node, listDepth = 0, quoteDepth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Fenced code blocks (<pre><code>...</code></pre>)
      if (tag === 'pre') {
        const codeEl = el.querySelector('code');
        const langMatch = (codeEl?.className || el.className || '').match(/language-([a-zA-Z0-9_-]+)/);
        const lang = langMatch?.[1] || 'auto';
        const rawCode = extractPreformattedCode(el);
        return `\n\`\`\`${lang}\n${rawCode}\n\`\`\`\n`;
      }

      // HTML Tables -> Markdown Table syntax with alignment preserved
      if (tag === 'table') {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        const mdRows: string[] = [];
        rows.forEach((tr, rIdx) => {
          const cellEls = Array.from(tr.querySelectorAll('th, td'));
          const cells = cellEls.map((cell) =>
            walk(cell, listDepth, quoteDepth).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim()
          );
          if (cells.length === 0) return;
          mdRows.push(`| ${cells.join(' | ')} |`);
          if (rIdx === 0) {
            const alignments = cellEls.map((cell) => alignToSeparator(getCellAlignment(cell)));
            mdRows.push(`| ${alignments.join(' | ')} |`);
          }
        });
        return `\n${mdRows.join('\n')}\n`;
      }

      // Unordered List (supports arbitrary nesting & mixed lists)
      if (tag === 'ul') {
        const items = Array.from(el.children)
          .filter((c) => c.tagName.toLowerCase() === 'li')
          .map((li) => walkListItem(li as HTMLElement, listDepth, false, 0, quoteDepth))
          .filter(Boolean)
          .join('');
        return listDepth === 0 ? `\n${items}\n` : `\n${items}`;
      }

      // Ordered List (supports arbitrary nesting & mixed lists)
      if (tag === 'ol') {
        let num = Number(el.getAttribute('start') || '1') || 1;
        const items = Array.from(el.children)
          .filter((c) => c.tagName.toLowerCase() === 'li')
          .map((li) => walkListItem(li as HTMLElement, listDepth, true, num++, quoteDepth))
          .filter(Boolean)
          .join('');
        return listDepth === 0 ? `\n${items}\n` : `\n${items}`;
      }

      // Nested Blockquotes (preserve leading indentation of nested lists inside blockquotes!)
      if (tag === 'blockquote') {
        const nextQuoteDepth = quoteDepth + 1;
        const inner = Array.from(el.childNodes)
          .map((c) => walk(c, listDepth, nextQuoteDepth))
          .join('');
        const lines = inner
          .split('\n')
          .map((l) => l.trimEnd())
          .filter((l) => l.trim().length > 0);
        if (lines.length === 0) return '';
        const formatted = lines.map((l) => (l.trimStart().startsWith('>') ? `> ${l.trimStart()}` : `> ${l}`));
        return `\n${formatted.join('\n')}\n`;
      }

      const children = Array.from(el.childNodes).map((c) => walk(c, listDepth, quoteDepth)).join('');

      if (!children.trim() && !['br', 'hr'].includes(tag)) {
        return '';
      }

      if (tag === 'a') {
        const href = el.getAttribute('href');
        const label = children.trim();
        if (href && /^mailto:/i.test(href)) {
          const email = href.replace(/^mailto:/i, '');
          return label && label !== email ? `[${label}](${href})` : email;
        }
        if (href && /^https?:\/\//i.test(href) && label && label !== href) {
          return `[${label}](${href})`;
        }
        return label || href || '';
      }

      // Google Docs wraps entire pasted docs in <b style="font-weight:normal">
      if (tag === 'b' || tag === 'strong') {
        const fw = (el.style?.fontWeight || '').toLowerCase();
        if (fw === 'normal' || fw === '400') {
          return applyColorStyles(el, children);
        }
        return applyColorStyles(el, wrapInlinePreservingSpaces(children, '**', '**'));
      }
      if (tag === 'i' || tag === 'em') {
        return applyColorStyles(el, wrapInlinePreservingSpaces(children, '*', '*'));
      }
      if (tag === 'u') {
        return applyColorStyles(el, wrapInlinePreservingSpaces(children, '<u>', '</u>'));
      }
      if (tag === 's' || tag === 'del' || tag === 'strike') {
        return applyColorStyles(el, wrapInlinePreservingSpaces(children, '~~', '~~'));
      }
      if (tag === 'sup') {
        return wrapInlinePreservingSpaces(children, '<sup>', '</sup>');
      }
      if (tag === 'sub') {
        return wrapInlinePreservingSpaces(children, '<sub>', '</sub>');
      }
      if (tag === 'code') {
        return wrapInlinePreservingSpaces(children, '`', '`');
      }
      if (tag === 'mark') {
        const mappedBg = el.style?.backgroundColor ? mapCssColorToPresetOrHex(el.style.backgroundColor) : null;
        if (mappedBg && !mappedBg.startsWith('#')) {
          return wrapInlinePreservingSpaces(children, `==${mappedBg}:`, '==');
        }
        return wrapInlinePreservingSpaces(children, '==', '==');
      }
      if (tag === 'font') {
        return applyColorStyles(el, children);
      }

      // Google Docs & Notion inline styled <span>
      if (tag === 'span' && el.getAttribute('style')) {
        let styled = children;
        const style = el.style;
        if (style.verticalAlign === 'super') styled = wrapInlinePreservingSpaces(styled, '<sup>', '</sup>');
        if (style.verticalAlign === 'sub') styled = wrapInlinePreservingSpaces(styled, '<sub>', '</sub>');
        if (style.textDecoration?.includes('line-through') || style.textDecorationLine?.includes('line-through')) {
          styled = wrapInlinePreservingSpaces(styled, '~~', '~~');
        }
        if (style.textDecoration?.includes('underline') || style.textDecorationLine?.includes('underline')) {
          styled = wrapInlinePreservingSpaces(styled, '<u>', '</u>');
        }
        if (style.fontStyle === 'italic') {
          styled = wrapInlinePreservingSpaces(styled, '*', '*');
        }
        const fwNum = parseInt(style.fontWeight || '', 10);
        if (style.fontWeight === 'bold' || (!Number.isNaN(fwNum) && fwNum >= 600)) {
          styled = wrapInlinePreservingSpaces(styled, '**', '**');
        }
        return applyColorStyles(el, styled);
      }

      // Full H1–H6 hierarchy preserved (strip redundant outer **...** since headings are already bold)
      if (/^h([1-6])$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        const cleanHeading = children.trim().replace(/^\*\*([\s\S]+)\*\*$/, '$1').trim();
        return `\n${'#'.repeat(level)} ${cleanHeading}\n`;
      }
      if (tag === 'hr') {
        return `\n---\n`;
      }
      if (tag === 'p' || tag === 'div') {
        return `\n${applyColorStyles(el, children.trim())}\n`;
      }
      if (tag === 'br') {
        return '\n';
      }

      return children;
    }
    return '';
  }

  function walkListItem(
    li: HTMLElement,
    listDepth: number,
    isOrdered: boolean,
    orderNum: number,
    quoteDepth: number
  ): string {
    const indent = '  '.repeat(Math.max(0, listDepth));
    const taskState = li.getAttribute('data-task-checked');

    // Collect nested <ul>/<ol> even when wrapped inside <div>/<p> containers (ChatGPT/Notion DOM!)
    const inlineParts: string[] = [];
    const nestedParts: string[] = [];

    const collectFromNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        inlineParts.push(node.textContent || '');
        return;
      }
      if (node instanceof HTMLElement) {
        const cTag = node.tagName.toLowerCase();
        if (cTag === 'input') return;
        if (cTag === 'ul' || cTag === 'ol') {
          nestedParts.push(walk(node, listDepth + 1, quoteDepth));
          return;
        }
        // If a wrapper (<div>, <p>, <span>) contains a nested list, traverse its children individually
        if (node.querySelector('ul, ol')) {
          Array.from(node.childNodes).forEach(collectFromNode);
          return;
        }
        inlineParts.push(walk(node, listDepth, quoteDepth));
      }
    };

    Array.from(li.childNodes).forEach(collectFromNode);

    let label = inlineParts.join('').replace(/\s*\n\s*/g, ' ').trim();
    let effectiveTaskState = taskState;

    // Also catch Unicode checklist glyphs at start of <li> text (○, ☐, ✓, ✔, ☑, ✅)
    if (effectiveTaskState === null) {
      const uncheckedSym = label.match(/^[○◯☐⬜]\s+(.+)$/);
      const checkedSym = label.match(/^[✔✓☑✅●◉]\s+(.+)$/);
      if (uncheckedSym) {
        effectiveTaskState = 'false';
        label = uncheckedSym[1];
      } else if (checkedSym) {
        effectiveTaskState = 'true';
        label = checkedSym[1];
      }
    }

    const prefix =
      effectiveTaskState !== null
        ? effectiveTaskState === 'true'
          ? '- [x] '
          : '- [ ] '
        : isOrdered
        ? `${orderNum}. `
        : '• ';

    const line = label ? `\n${indent}${prefix}${label}` : '';
    const nested = nestedParts.join('');
    return `${line}${nested}`;
  }

  const result = walk(doc.body);
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function parseSeparatorAlignment(cell: string): CollectionColumnAlign {
  const t = cell.trim();
  const startsColon = t.startsWith(':');
  const endsColon = t.endsWith(':');
  if (startsColon && endsColon) return 'center';
  if (endsColon) return 'right';
  return 'left';
}

export function parsePastedTextToChronoBlocks(rawText: string): ParsedPasteBlock[] {
  // Normalize line endings, ChatGPT LaTeX delimiters \(...\) & \[...\], and collapse multi-line $$...$$ into single-line block math
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\\\((.+?)\\\)/g, '$$$1$$')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, expr) => `$$${expr.replace(/\n+/g, ' ').trim()}$$`)
    .replace(/^[ \t]*\$\$[ \t]*\n([\s\S]+?)\n[ \t]*\$\$[ \t]*$/gm, (_m, expr) => `$$${expr.replace(/\n+/g, ' ').trim()}$$`);

  const blocks: ParsedPasteBlock[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  const isTableSeparator = (str: string) =>
    /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(str);

  const isTableRow = (str: string) => {
    const t = str.trim();
    return t.includes('|') && t.replace(/\|/g, '').trim().length > 0;
  };

  const pushTextLines = (segment: string) => {
    const lines = segment.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Detect Markdown Table (with or without outer pipes) + preserve column alignment
      if (
        isTableRow(line) &&
        i + 1 < lines.length &&
        isTableSeparator(lines[i + 1])
      ) {
        const parseCells = (rowStr: string) =>
          rowStr
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());

        const headers = parseCells(line);
        const sepCells = parseCells(lines[i + 1]);
        const colIds = headers.map((_, cIdx) => `col_${cIdx + 1}`);
        const columns: CollectionColumn[] = headers.map((name, cIdx) => ({
          id: colIds[cIdx],
          name: name || `Kolom ${cIdx + 1}`,
          type: 'text',
          width: 180,
          align: sepCells[cIdx] ? parseSeparatorAlignment(sepCells[cIdx]) : 'left',
        }));

        const rows: { id: string; [key: string]: string }[] = [];
        i += 2; // skip header & separator
        while (i < lines.length && isTableRow(lines[i])) {
          const cellVals = parseCells(lines[i]);
          const rowObj: { id: string; [key: string]: string } = {
            id: `row_${Date.now()}_${counter++}`,
          };
          colIds.forEach((cid, cIdx) => {
            rowObj[cid] = cellVals[cIdx] ?? '';
          });
          rows.push(rowObj);
          i++;
        }

        const colId = `col-${Date.now()}-${counter++}`;
        blocks.push({
          type: 'collection',
          id: colId,
          data: {
            id: colId,
            title: 'Tabel',
            simple: true,
            views: [{ id: 'v_table', name: 'Table', type: 'table' }],
            activeViewId: 'v_table',
            columns,
            rows,
          },
        });
        continue;
      }

      let cleaned = line;
      const headingMatch = cleaned.match(/^(#{1,6})\s+(.+)$/);
      const taskMatch = cleaned.match(/^(\s*)[-*+]\s+\[([ xX])\]\s*(.*)$/);
      const unicodeTaskMatch = cleaned.match(/^(\s*)([☐☑○◯✔✓✅⬜])\s+(.+)$/);
      const quoteMatch = cleaned.match(/^\s*((?:>\s*)+)(.*)$/);

      if (headingMatch) {
        cleaned = `${headingMatch[1]} ${headingMatch[2].trim()}`;
      } else if (taskMatch) {
        const mark = taskMatch[2].toLowerCase() === 'x' ? 'x' : ' ';
        const normIndent = taskMatch[1].replace(/\t/g, '  ');
        cleaned = `${normIndent}- [${mark}] ${taskMatch[3]}`;
      } else if (unicodeTaskMatch) {
        const mark = ['☑', '✔', '✓', '✅'].includes(unicodeTaskMatch[2]) ? 'x' : ' ';
        const normIndent = unicodeTaskMatch[1].replace(/\t/g, '  ');
        cleaned = `${normIndent}- [${mark}] ${unicodeTaskMatch[3]}`;
      } else if (quoteMatch) {
        const depth = Math.min(4, (quoteMatch[1].match(/>/g) || ['>']).length);
        const prefix = Array(depth).fill('>').join(' ');
        // Preserve leading indentation inside blockquote (for nested lists inside quotes!)
        cleaned = `${prefix} ${quoteMatch[2].trimEnd()}`;
      } else if (/^\s*([-*_])\1{2,}\s*$/.test(cleaned)) {
        cleaned = '---';
      } else {
        // Normalize bullet markers while preserving leading indentation for nested lists
        cleaned = cleaned
          .replace(/^(\t+)/, (tabs) => '  '.repeat(tabs.length))
          .replace(/^(\s*)[-*+]\s+/, '$1• ');
      }

      blocks.push({
        type: 'text',
        id: `t-paste-${Date.now()}-${counter++}`,
        content: cleaned,
      });
      i++;
    }
  };

  while ((match = fenceRegex.exec(normalized)) !== null) {
    const before = normalized.slice(lastIdx, match.index).replace(/\n$/, '');
    if (before.trim()) {
      pushTextLines(before);
    }
    const lang = (match[1] || 'auto').toLowerCase();
    const blockCode = match[2].replace(/\n$/, '');
    if (lang === 'mermaid') {
      const mmdId = `mmd-${Date.now()}-${counter++}`;
      blocks.push({
        type: 'mermaid',
        id: mmdId,
        data: { id: mmdId, code: blockCode },
      });
    } else {
      const codeId = `code-${Date.now()}-${counter++}`;
      blocks.push({
        type: 'code',
        id: codeId,
        data: { id: codeId, lang: lang || 'auto', code: blockCode },
      });
    }
    lastIdx = match.index + match[0].length;
  }

  const tail = normalized.slice(lastIdx).replace(/^\n/, '');
  if (tail || blocks.length === 0) {
    pushTextLines(tail);
  }

  return blocks;
}
