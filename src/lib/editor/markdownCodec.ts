import katex from 'katex';

export interface ColorPreset {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  dotColor: string;
}

export const NOTION_COLORS: ColorPreset[] = [
  { id: 'yellow', name: 'Kuning (Yellow)', bgClass: 'bg-amber-500/25 border border-amber-400/30', textClass: 'text-amber-200', dotColor: '#f59e0b' },
  { id: 'red', name: 'Merah (Red)', bgClass: 'bg-rose-500/25 border border-rose-400/30', textClass: 'text-rose-200', dotColor: '#f43f5e' },
  { id: 'green', name: 'Hijau (Green)', bgClass: 'bg-emerald-500/25 border border-emerald-400/30', textClass: 'text-emerald-200', dotColor: '#10b981' },
  { id: 'blue', name: 'Biru (Blue)', bgClass: 'bg-sky-500/25 border border-sky-400/30', textClass: 'text-sky-200', dotColor: '#38bdf8' },
  { id: 'purple', name: 'Ungu (Purple)', bgClass: 'bg-purple-500/25 border border-purple-400/30', textClass: 'text-purple-200', dotColor: '#c084fc' },
  { id: 'pink', name: 'Pink', bgClass: 'bg-pink-500/25 border border-pink-400/30', textClass: 'text-pink-200', dotColor: '#f472b6' },
  { id: 'orange', name: 'Jingga (Orange)', bgClass: 'bg-orange-500/25 border border-orange-400/30', textClass: 'text-orange-200', dotColor: '#fb923c' },
  { id: 'gray', name: 'Abu-abu (Gray)', bgClass: 'bg-zinc-700/50 border border-zinc-500/30', textClass: 'text-zinc-200', dotColor: '#a1a1aa' },
];

export function escapeCodeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderKatexSafe(expr: string, displayMode: boolean): string {
  const trimmed = expr.trim();
  if (!trimmed) return displayMode ? '$$$$' : '$$';
  try {
    const rendered = katex.renderToString(trimmed, {
      throwOnError: false,
      displayMode,
      strict: false,
    });
    const encoded = encodeURIComponent(trimmed);
    if (displayMode) {
      return `<span data-math="${encoded}" data-display="true" contenteditable="false" class="katex-block-wrapper inline-block w-full my-1 py-2 text-center overflow-x-auto select-all align-middle">${rendered}</span>`;
    }
    return `<span data-math="${encoded}" data-display="false" contenteditable="false" class="katex-inline-wrapper inline-flex items-center px-1 py-0.5 rounded text-white/95 select-all align-baseline">${rendered}</span>`;
  } catch {
    return displayMode ? `$$${trimmed}$$` : `$${trimmed}$`;
  }
}

/**
 * Guard against false-positive inline math on currency phrases like "$100 / €90 ... $200".
 */
function isLikelyCurrencySpan(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return true;
  // Starts with whitespace or ends with whitespace (standard TeX inline math never has leading/trailing space right next to $)
  if (/^\s/.test(expr) || /\s$/.test(expr)) return true;
  // Looks like currency number followed by prose (e.g. "100 / €90 and " or "100 USD")
  if (/^\d[\d,.]*\s+[a-zA-Z€£¥₹/]/.test(trimmed) && !/[\\^_{}=]/.test(trimmed)) {
    return true;
  }
  return false;
}

export function mapCssColorToPresetOrHex(rawColor: string): string | null {
  const c = rawColor.trim().toLowerCase();
  if (!c || c === 'inherit' || c === 'initial' || c === 'transparent') return null;

  // Ignore default white/black/near-white/near-gray body text colors from ChatGPT/Docs
  if (
    c === '#ffffff' || c === '#fff' || c === 'white' ||
    c === '#000000' || c === '#000' || c === 'black' ||
    c === '#e4e4e7' || c === '#d4d4d8' || c === '#f4f4f5' ||
    c === 'rgb(255, 255, 255)' || c === 'rgb(0, 0, 0)' ||
    c === 'rgb(236, 236, 236)' || c === 'rgb(228, 228, 231)' ||
    c === 'rgb(13, 13, 13)' || c === 'rgb(31, 31, 31)' || c === 'rgb(55, 53, 47)'
  ) {
    return null;
  }

  const preset = NOTION_COLORS.find((p) => p.dotColor.toLowerCase() === c || p.id === c);
  if (preset) return preset.id;

  // Convert rgb(r, g, b) to hex
  const rgbMatch = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    // Ignore near-neutral dark/light grays
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 16 && (max > 200 || max < 65)) return null;
    const hex = `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`;
    const byHex = NOTION_COLORS.find((p) => p.dotColor.toLowerCase() === hex);
    return byHex ? byHex.id : hex;
  }

  if (/^#[0-9a-f]{3,6}$/i.test(c)) return c;
  return null;
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  const tokens: string[] = [];
  const stash = (html: string) => {
    const idx = tokens.length;
    tokens.push(html);
    return `\uE000TOK_${idx}\uE001`;
  };

  let out = md
    // 1. Protect inline code first so math/markdown inside backticks stays literal
    .replace(/`([^`\n]+)`/g, (_m, code) =>
      stash(
        `<code class="bg-white/[0.09] text-zinc-200 border border-white/[0.15] font-mono text-[13px] px-1.5 py-0.5 rounded-md font-medium">${escapeCodeHtml(code)}</code>`
      )
    )
    // 2. Display math $$...$$ via KaTeX
    .replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr) => stash(renderKatexSafe(expr, true)))
    // 3. Inline math $...$ via KaTeX (with currency guard)
    .replace(/(?<!\$)\$((?:[^$\n\\]|\\.)+?)\$(?!\$)/g, (full, expr) => {
      if (isLikelyCurrencySpan(expr)) return full;
      return stash(renderKatexSafe(expr, false));
    })
    // 4. Markdown links [label](https://... or mailto:...)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, (_m, label, href) =>
      stash(
        `<a href="${href}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 decoration-sky-400/60 text-sky-300 hover:text-sky-200 cursor-pointer transition-colors">${label}</a>`
      )
    )
    // 5. Bare URLs https://...
    .replace(/(https?:\/\/[^\s<>"'`]+)/g, (_m, href) => {
      const cleanHref = href.replace(/[.,;:!?)]+$/, '');
      const trailing = href.slice(cleanHref.length);
      return (
        stash(
          `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 decoration-sky-400/60 text-sky-300 hover:text-sky-200 cursor-pointer transition-colors">${cleanHref}</a>`
        ) + trailing
      );
    })
    // 6. Bare email addresses (example@gmail.com)
    .replace(/(?<![\w.-])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![\w.-])/g, (_m, email) =>
      stash(
        `<a href="mailto:${email}" class="underline underline-offset-4 decoration-sky-400/60 text-sky-300 hover:text-sky-200 cursor-pointer transition-colors">${email}</a>`
      )
    )
    // 7. Highlights (background color)
    .replace(/==([a-z]+):([\s\S]*?)==/g, (_m, colorId, text) => {
      const preset = NOTION_COLORS.find((c) => c.id === colorId) || NOTION_COLORS[0];
      return `<mark data-color="${preset.id}" class="${preset.bgClass} ${preset.textClass} px-1.5 py-0.5 rounded-md font-medium font-sans">${text}</mark>`;
    })
    .replace(
      /==([\s\S]*?)==/g,
      '<mark data-color="yellow" class="bg-amber-500/25 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded-md font-medium font-sans">$1</mark>'
    )
    // 8. Text foreground color ^^color:text^^
    .replace(/\^\^([a-z]+|#[0-9a-fA-F]{3,6}):([\s\S]*?)\^\^/g, (_m, colorVal, text) => {
      const preset = NOTION_COLORS.find((c) => c.id === colorVal);
      if (preset) {
        return `<span data-text-color="${preset.id}" style="color:${preset.dotColor}">${text}</span>`;
      }
      return `<span data-text-color="${colorVal}" style="color:${colorVal}">${text}</span>`;
    })
    // 9. Superscript & Subscript
    .replace(/<sup>([\s\S]*?)<\/sup>/g, '<sup class="text-[0.72em] align-super leading-none">$1</sup>')
    .replace(/<sub>([\s\S]*?)<\/sub>/g, '<sub class="text-[0.72em] align-sub leading-none">$1</sub>')
    // 10. Bold, Italic, Underline, Strikethrough
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong class="font-bold text-white font-sans"><em class="italic">$1</em></strong>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-bold text-white font-sans">$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em class="italic text-zinc-100 font-sans">$1</em>')
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u class="underline underline-offset-4 decoration-white/50 font-sans">$1</u>')
    .replace(/~~([\s\S]*?)~~/g, '<span class="line-through text-zinc-400 font-sans">$1</span>');

  // Restore protected tokens (code, KaTeX math, links, emails)
  out = out.replace(/\uE000TOK_(\d+)\uE001/g, (_m, idx) => tokens[Number(idx)] ?? '');
  return out;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;

  function parseNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Round-trip KaTeX math wrappers cleanly before walking children
      if (el.hasAttribute('data-math')) {
        const raw = decodeURIComponent(el.getAttribute('data-math') || '');
        const isDisplay = el.getAttribute('data-display') === 'true';
        return isDisplay ? `$$${raw}$$` : `$${raw}$`;
      }

      const inner = Array.from(el.childNodes).map(parseNode).join('');

      if (tag === 'mark') {
        const colorId = el.getAttribute('data-color');
        if (colorId && colorId !== 'yellow') {
          return `==${colorId}:${inner}==`;
        }
        return `==${inner}==`;
      }
      if (tag === 'span' && el.hasAttribute('data-text-color')) {
        const colorVal = el.getAttribute('data-text-color');
        if (colorVal && inner) return `^^${colorVal}:${inner}^^`;
        return inner;
      }
      if (tag === 'font' && el.getAttribute('color')) {
        const mapped = mapCssColorToPresetOrHex(el.getAttribute('color') || '');
        if (mapped && inner) return `^^${mapped}:${inner}^^`;
        return inner;
      }
      if (tag === 'span' && el.style?.color && !el.classList.contains('line-through')) {
        const mapped = mapCssColorToPresetOrHex(el.style.color);
        if (mapped && inner) return `^^${mapped}:${inner}^^`;
      }
      if (tag === 'a') {
        const href = el.getAttribute('href');
        if (href && /^mailto:/i.test(href)) {
          const email = href.replace(/^mailto:/i, '');
          return inner && inner !== email ? `[${inner}](${href})` : email;
        }
        if (href && /^https?:\/\//i.test(href) && inner && inner !== href) {
          return `[${inner}](${href})`;
        }
        return inner || href || '';
      }
      if (tag === 'sup') return inner ? `<sup>${inner}</sup>` : '';
      if (tag === 'sub') return inner ? `<sub>${inner}</sub>` : '';
      if (tag === 'strong' || tag === 'b') return `**${inner}**`;
      if (tag === 'em' || tag === 'i') return `*${inner}*`;
      if (tag === 'u') return `<u>${inner}</u>`;
      if (tag === 'del' || tag === 's' || tag === 'strike' || (tag === 'span' && el.classList.contains('line-through'))) return `~~${inner}~~`;
      if (tag === 'code') return `\`${inner}\``;
      if (tag === 'span' && (el.classList.contains('bg-indigo-950/50') || el.classList.contains('font-serif'))) return `$${inner}$`;
      if (tag === 'br') return '\n';
      if (tag === 'div' || tag === 'p') return inner ? '\n' + inner : '';
      return inner;
    }
    return '';
  }

  return parseNode(temp).replace(/^\n/, '');
}
