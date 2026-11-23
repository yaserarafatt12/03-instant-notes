import { describe, it, expect } from 'vitest';
import { classifyTextBlock, isRtlText } from '../blockClassifier';
import { markdownToHtml } from '../markdownCodec';
import { parsePastedTextToChronoBlocks } from '../clipboardParser';

describe('Batch 2 Rich Text & Paste Engine', () => {
  it('1. preserves full H1–H6 heading hierarchy', () => {
    const md = [
      '# THE ART OF THINKING',
      '## Chapter 01 — Introduction',
      '### 1.1 Understanding Human Behavior',
      '#### 1.1.1 Cognitive Psychology',
      '##### Minor Heading Level 5',
      '###### Minor Heading Level 6',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    expect(blocks).toHaveLength(6);
    blocks.forEach((b, idx) => {
      expect(b.type).toBe('text');
      if (b.type === 'text') {
        const cls = classifyTextBlock(b.content);
        expect(cls.kind).toBe('heading');
        if (cls.kind === 'heading') {
          expect(cls.level).toBe(idx + 1);
        }
      }
    });
  });

  it('2. preserves nested ordered, bullet, and mixed lists with indentation depth', () => {
    const md = [
      '1. Education',
      '  1. Mathematics',
      '  2. Physics',
      '- Main category',
      '  1. First subcategory',
      '    - Detail A',
      '    - Detail B',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    const classified = blocks.map((b) => classifyTextBlock(b.type === 'text' ? b.content : ''));

    expect(classified[0]).toMatchObject({ kind: 'ordered', depth: 0, ordinal: '1', content: 'Education' });
    expect(classified[1]).toMatchObject({ kind: 'ordered', depth: 1, ordinal: '1', content: 'Mathematics' });
    expect(classified[3]).toMatchObject({ kind: 'bullet', depth: 0, marker: '•', content: 'Main category' });
    expect(classified[4]).toMatchObject({ kind: 'ordered', depth: 1, ordinal: '1', content: 'First subcategory' });
    expect(classified[5]).toMatchObject({ kind: 'bullet', depth: 2, marker: '▪', content: 'Detail A' });
  });

  it('3. parses interactive checklists including unicode checkboxes and nesting', () => {
    const md = [
      '- [x] Complete the assignment',
      '  - [ ] Read chapter one',
      '☑ Review the lecture',
      '☐ Submit the report',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    const classified = blocks.map((b) => classifyTextBlock(b.type === 'text' ? b.content : ''));

    expect(classified[0]).toMatchObject({ kind: 'checklist', depth: 0, checked: true, content: 'Complete the assignment' });
    expect(classified[1]).toMatchObject({ kind: 'checklist', depth: 1, checked: false, content: 'Read chapter one' });
    expect(classified[2]).toMatchObject({ kind: 'checklist', depth: 0, checked: true, content: 'Review the lecture' });
    expect(classified[3]).toMatchObject({ kind: 'checklist', depth: 0, checked: false, content: 'Submit the report' });
  });

  it('4. supports single and nested blockquotes (> and > >)', () => {
    const md = [
      '> First level quote.',
      '> > Second level quote.',
      '> > > Third level quote.',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    const classified = blocks.map((b) => classifyTextBlock(b.type === 'text' ? b.content : ''));

    expect(classified[0]).toMatchObject({ kind: 'blockquote', depth: 1, content: 'First level quote.' });
    expect(classified[1]).toMatchObject({ kind: 'blockquote', depth: 2, content: 'Second level quote.' });
    expect(classified[2]).toMatchObject({ kind: 'blockquote', depth: 3, content: 'Third level quote.' });
  });

  it('5. parses complex Markdown tables with left/center/right column alignment', () => {
    const md = [
      '| Subject | Score | Grade | Status |',
      '| :--- | ---: | :---: | :--- |',
      '| Mathematics | 95 | A | Passed |',
      '| Biology | 60 | C | Review |',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    expect(blocks).toHaveLength(1);
    const tableBlock = blocks[0];
    expect(tableBlock.type).toBe('collection');
    if (tableBlock.type === 'collection') {
      expect(tableBlock.data.columns.map((c) => c.align)).toEqual(['left', 'right', 'center', 'left']);
      expect(tableBlock.data.rows).toHaveLength(2);
      expect(tableBlock.data.rows[0].col_1).toBe('Mathematics');
      expect(tableBlock.data.rows[0].col_2).toBe('95');
    }
  });

  it('6. parses Python & JavaScript fenced code blocks preserving newlines & languages', () => {
    const md = [
      '```python',
      'class Student:',
      '  def __init__(self, name):',
      '    self.name = name',
      '```',
      '',
      '```javascript',
      'const total = (a, b) => a + b;',
      '```',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(md);
    const codeBlocks = blocks.filter((b) => b.type === 'code');
    expect(codeBlocks).toHaveLength(2);
    if (codeBlocks[0].type === 'code' && codeBlocks[1].type === 'code') {
      expect(codeBlocks[0].data.lang).toBe('python');
      expect(codeBlocks[0].data.code).toContain('\n');
      expect(codeBlocks[1].data.lang).toBe('javascript');
    }
  });

  it('7. renders LaTeX fractions, summation, integrals, matrices, Greek symbols via KaTeX & guards currency', () => {
    const mathMd = [
      '\\[ \\frac{a+b}{c+d} \\]',
      '\\[ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} \\]',
      '\\[ \\int_0^1 x^2\\,dx = \\frac{1}{3} \\]',
      '\\[ A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix} \\]',
      '\\[ \\alpha,\\beta,\\gamma,\\Delta,\\theta,\\lambda,\\pi,\\omega \\]',
    ].join('\n');

    const blocks = parsePastedTextToChronoBlocks(mathMd);
    expect(blocks).toHaveLength(5);
    blocks.forEach((b) => {
      if (b.type === 'text') {
        const html = markdownToHtml(b.content);
        expect(html).toContain('data-math=');
        expect(html).toContain('class="katex');
      }
    });

    // Currency guard: $100 / €90 and $200 must NOT become KaTeX math
    const currencyHtml = markdownToHtml('Price is $100 / €90 or $200 today');
    expect(currencyHtml).not.toContain('data-math=');
    expect(currencyHtml).toContain('$100');
  });

  it('8. renders hyperlinks, preserved URLs, and clickable email addresses', () => {
    const html = markdownToHtml('[OpenAI](https://openai.com?utm_source=chatgpt.com) and Email: example@gmail.com');
    expect(html).toContain('href="https://openai.com?utm_source=chatgpt.com"');
    expect(html).toContain('href="mailto:example@gmail.com"');
  });

  it('9. classifies horizontal dividers cleanly', () => {
    expect(classifyTextBlock('---')).toEqual({ kind: 'divider', variant: 'solid' });
    expect(classifyTextBlock('***')).toEqual({ kind: 'divider', variant: 'dots' });
    expect(classifyTextBlock('...')).toEqual({ kind: 'divider', variant: 'dotted' });
    expect(classifyTextBlock('===')).toEqual({ kind: 'divider', variant: 'bold' });
  });

  it('10. renders text decorations, colors, highlights, superscript, and subscript', () => {
    const html = markdownToHtml('H<sub>2</sub>O, x<sup>2</sup> + y<sup>3</sup>, ~~deleted~~, <u>under</u>, ^^red:alert^^, ==yellow:note==');
    expect(html).toContain('<sub');
    expect(html).toContain('<sup');
    expect(html).toContain('line-through');
    expect(html).toContain('<u');
    expect(html).toContain('data-text-color="red"');
    expect(html).toContain('data-color="yellow"');
  });

  it('11. detects Arabic RTL and mixed Arabic-English lines accurately', () => {
    expect(isRtlText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBe(true);
    expect(isRtlText('جامعة الأزهر — Al-Azhar University — كلية الشريعة')).toBe(true);
    expect(isRtlText('Al-Azhar University — جامعة الأزهر')).toBe(false);
    expect(isRtlText('First paragraph.')).toBe(false);
  });
});
