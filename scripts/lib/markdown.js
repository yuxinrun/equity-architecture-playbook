import { escapeHtml, escapeAttr } from './utils.js';

/**
 * 轻量 Markdown 渲染器。
 * 支持：标题、段落、列表（含嵌套与任务项）、表格、引用、代码块、
 * 分割线、行内代码/加粗/斜体/删除线/链接/图片，以及 ::: 提示块。
 * 不引入第三方解析库，保证构建零依赖。
 */

const CALLOUTS = {
  note: { className: 'is-note', label: '说明' },
  warn: { className: 'is-warn', label: '注意' },
  risk: { className: 'is-risk', label: '风险提示' },
  check: { className: 'is-check', label: '清单' },
  law: { className: 'is-law', label: '法域与核验' },
  key: { className: 'is-key', label: '核心结论' },
  quote: { className: 'is-quote', label: '引文' },
  example: { className: 'is-example', label: '情境' }
};

const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/;

export function slugifyHeading(text) {
  const cleaned = String(text)
    .replace(/\u200b/g, '')
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[，。、；：？！“”‘’（）《》〈〉【】—…·,.;:?!"'’<>|@#$%^&+=/\\]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'section';
}

function joinParagraphLines(lines) {
  let out = '';
  for (const line of lines) {
    const text = line.trim();
    if (!out) {
      out = text;
      continue;
    }
    const lastChar = out.slice(-1);
    const firstChar = text.slice(0, 1);
    const needsSpace = !CJK_RE.test(lastChar) && !CJK_RE.test(firstChar) && !/[（【《“‘(]/.test(firstChar);
    out += (needsSpace ? ' ' : '') + text;
  }
  return out;
}

function renderInline(raw, ctx) {
  const codeSpans = [];
  let text = String(raw).replace(/`([^`]+)`/g, (_m, code) => {
    codeSpans.push(code);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  text = escapeHtml(text);

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) => {
    return `<img src="${ctx.asset(src)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async">`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const url = ctx.href(href);
    const external = /^https?:\/\//.test(url);
    const attrs = external ? ' rel="noopener noreferrer" target="_blank"' : '';
    return `<a href="${url}"${attrs}>${label}</a>`;
  });

  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  text = text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

  text = text.replace(/\u0000(\d+)\u0000/g, (_m, index) => {
    return `<code>${escapeHtml(codeSpans[Number(index)])}</code>`;
  });

  return text;
}

function indentOf(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].replace(/\t/g, '  ').length : 0;
}

function parseTable(lines, start, inline) {
  const headerCells = splitRow(lines[start]);
  const align = splitRow(lines[start + 1]).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  const rows = [];
  let i = start + 2;
  while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
    rows.push(splitRow(lines[i]));
    i += 1;
  }
  const th = headerCells
    .map((cell, idx) => {
      const style = align[idx] ? ` style="text-align:${align[idx]}"` : '';
      return `<th scope="col"${style}>${inline(cell)}</th>`;
    })
    .join('');
  const body = rows
    .map((row) => {
      const tds = headerCells
        .map((_cell, idx) => {
          const style = align[idx] ? ` style="text-align:${align[idx]}"` : '';
          return `<td${style}>${inline(row[idx] || '')}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  const html = `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
  return { html, next: i };
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);
  return row.split('|').map((cell) => cell.trim());
}

function parseList(lines, start, inline) {
  const first = lines[start];
  const baseIndent = indentOf(first);
  const ordered = /^\s*\d+[.)]\s+/.test(first);
  const items = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      const nextLine = lines.slice(i + 1).find((l) => l.trim());
      if (!nextLine) break;
      const nextMatch = nextLine.match(/^(\s*)([-*+]|\d+[.)])\s+/);
      if (!nextMatch || indentOf(nextLine) < baseIndent) break;
      i += 1;
      continue;
    }
    const match = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (!match) break;
    const indent = indentOf(line);
    if (indent < baseIndent) break;
    if (indent >= baseIndent + 2) {
      const nested = parseList(lines, i, inline);
      if (items.length) {
        items[items.length - 1].children.push(nested.html);
      } else {
        items.push({ content: '', children: [nested.html] });
      }
      i = nested.next;
      continue;
    }
    let content = match[3];
    let task = null;
    const taskMatch = content.match(/^\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      task = taskMatch[1].toLowerCase() === 'x';
      content = taskMatch[2];
    }
    const item = { content, task, children: [] };
    items.push(item);
    i += 1;

    // 续行：缩进更深的非列表行并入当前项
    while (i < lines.length) {
      const cont = lines[i];
      if (!cont.trim()) break;
      if (/^(\s*)([-*+]|\d+[.)])\s+/.test(cont)) break;
      if (indentOf(cont) <= baseIndent) break;
      item.content += (CJK_RE.test(item.content.slice(-1)) ? '' : ' ') + cont.trim();
      i += 1;
    }
  }

  const tag = ordered ? 'ol' : 'ul';
  const listClass = items.some((item) => item.task !== null) ? ' class="task-list"' : '';
  const body = items
    .map((item) => {
      const children = item.children.join('');
      if (item.task !== null) {
        const checked = item.task ? ' checked' : '';
        return `<li class="task-item"><input type="checkbox" disabled${checked}> <span>${inline(item.content)}</span>${children}</li>`;
      }
      return `<li>${inline(item.content)}${children}</li>`;
    })
    .join('');
  return { html: `<${tag}${listClass}>${body}</${tag}>`, next: i };
}

function renderInlineOnly(text, ctx) {
  return renderInline(text, ctx);
}

export function renderMarkdown(source, options = {}) {
  const href = options.href || ((url) => url);
  const asset = options.asset || href;
  const ctx = { href, asset };
  const inline = (text) => renderInlineOnly(text, ctx);

  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const headings = [];
  const usedIds = new Map();
  let i = 0;
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${inline(joinParagraphLines(paragraph))}</p>`);
    paragraph = [];
  };

  const pushHeading = (hashes, rawText) => {
    const text = rawText.replace(/\s*#+\s*$/, '').trim();
    const levelNum = Math.min(4, Math.max(2, hashes.length + (options.headingShift || 0)));
    const plain = text.replace(/[*_`~]/g, '');
    let id = slugifyHeading(plain);
    const seen = usedIds.get(id) || 0;
    usedIds.set(id, seen + 1);
    if (seen) id = `${id}-${seen + 1}`;
    headings.push({ level: levelNum, text: plain, id });
    out.push(
      `<h${levelNum} id="${escapeAttr(id)}">${inline(text)}` +
        `<a class="heading-anchor" href="#${escapeAttr(id)}" aria-label="本节链接">#</a>` +
        `</h${levelNum}>`
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flushParagraph();
      i += 1;
      continue;
    }

    // 代码块
    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      flushParagraph();
      const lang = fence[1];
      const buffer = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buffer.push(lines[i]);
        i += 1;
      }
      i += 1;
      const langClass = lang ? ` class="language-${escapeAttr(lang)}"` : '';
      out.push(`<pre class="code-block"><code${langClass}>${escapeHtml(buffer.join('\n'))}</code></pre>`);
      continue;
    }

    // 提示块
    const callout = line.match(/^:::(\w+)?\s*(.*)$/);
    if (callout) {
      flushParagraph();
      const type = CALLOUTS[callout[1]] ? callout[1] : 'note';
      const conf = CALLOUTS[type];
      const title = callout[2].trim();
      const buffer = [];
      i += 1;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        buffer.push(lines[i]);
        i += 1;
      }
      i += 1;
      const inner = renderMarkdown(buffer.join('\n'), { ...options, headingShift: 1 });
      inner.headings.forEach((h) => {
        let id = h.id;
        const seen = usedIds.get(id) || 0;
        usedIds.set(id, seen + 1);
        headings.push({ ...h, id });
      });
      out.push(
        `<aside class="callout ${conf.className}">` +
          `<p class="callout-label">${escapeHtml(title || conf.label)}</p>` +
          `<div class="callout-body">${inner.html}</div>` +
          `</aside>`
      );
      continue;
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      pushHeading(heading[1], heading[2]);
      i += 1;
      continue;
    }

    // 分割线
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      out.push('<hr>');
      i += 1;
      continue;
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      flushParagraph();
      const table = parseTable(lines, i, inline);
      out.push(table.html);
      i = table.next;
      continue;
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      const buffer = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buffer.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      const inner = renderMarkdown(buffer.join('\n'), { ...options, headingShift: 1 });
      inner.headings.forEach((h) => headings.push(h));
      out.push(`<blockquote>${inner.html}</blockquote>`);
      continue;
    }

    // 列表
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flushParagraph();
      const list = parseList(lines, i, inline);
      out.push(list.html);
      i = list.next;
      continue;
    }

    paragraph.push(line);
    i += 1;
  }

  flushParagraph();
  return { html: out.join('\n'), headings };
}

/** 把 Markdown 还原成纯文本，用于摘要、搜索索引与字数统计 */
export function stripMarkdown(source = '') {
  return String(source)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^:::.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~>|]/g, ' ')
    .replace(/^\s*[-+]\s+/gm, ' ')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { renderInline };