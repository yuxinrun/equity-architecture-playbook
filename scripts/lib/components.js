import { escapeHtml, escapeAttr, formatDateShort, truncate } from './utils.js';

export function icon(name, size = 20) {
  const paths = {
    search:
      '<circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5 21 21"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    close: '<path d="M6 6l12 12M18 6 6 18"></path>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    tag: '<path d="M20 13 13 20l-8-8V4h8z"></path><circle cx="8" cy="8" r="1.4"></circle>',
    bookmark:
      '<path d="M6 4h12v17l-6-4-6 4z"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"></path><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"></path>',
    check: '<path d="m4 12 5 5L20 6"></path>',
    print:
      '<path d="M7 8V3h10v5"></path><rect x="4" y="8" width="16" height="8" rx="1.5"></rect><path d="M7 14h10v7H7z"></path>',
    download: '<path d="M12 4v11M7 11l5 5 5-5"></path><path d="M5 20h14"></path>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a1 1 0 0 1 1-1h9"></path>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle>',
    layers:
      '<path d="m12 3 8 4.5-8 4.5-8-4.5z"></path><path d="m4 12 8 4.5 8-4.5"></path><path d="m4 16.5 8 4.5 8-4.5"></path>',
    scale: '<path d="M12 4v16M6 8h12"></path><path d="M4 8l-2 5h4zM20 8l-2 5h4z"></path>',
    compass: '<circle cx="12" cy="12" r="9"></circle><path d="m15 9-2 6-4 2 2-6z"></path>',
    shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"></path><path d="m9 12 2 2 4-4"></path>',
    users:
      '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"></path><path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 14.5c2.1.6 3.5 2.4 3.5 5"></path>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"></path><path d="M8 3v18"></path>',
    globe:
      '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"></path>',
    doc: '<path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v4h4"></path><path d="M9 12h6M9 16h6"></path>',
    chart:
      '<path d="M4 20V4"></path><path d="M4 20h16"></path><rect x="7" y="12" width="3" height="5"></rect><rect x="12" y="8" width="3" height="9"></rect><rect x="17" y="5" width="3" height="12"></rect>',
    alert: '<path d="M12 4 2.8 20h18.4z"></path><path d="M12 9v5M12 17h.01"></path>'
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.doc}</svg>`;
}

export function brandMark() {
  return `<svg class="brand-mark" width="34" height="34" viewBox="0 0 34 34" role="img" aria-label="站点标志：由节点与连线构成的股权结构">
    <rect x="1" y="1" width="32" height="32" rx="8" fill="#18324B"></rect>
    <path d="M17 8v6M17 14H9v5M17 14h8v5" stroke="#7FB6F0" stroke-width="1.4" fill="none"></path>
    <rect x="13.6" y="5.6" width="6.8" height="5" rx="1.2" fill="#F6F7F8"></rect>
    <rect x="5.4" y="19" width="7.2" height="5.4" rx="1.2" fill="#168A82"></rect>
    <rect x="21.4" y="19" width="7.2" height="5.4" rx="1.2" fill="#C58A3A"></rect>
  </svg>`;
}

export function tagRow(tags, { max = 3, className = 'tag' } = {}) {
  if (!tags || !tags.length) return '';
  return `<ul class="tag-row">${tags
    .slice(0, max)
    .map((tag) => `<li><span class="${className}">${escapeHtml(tag)}</span></li>`)
    .join('')}</ul>`;
}

export function articleCard(article, { href, headingLevel = 'h3', showCategory = false } = {}) {
  const H = headingLevel;
  return `<article class="card" data-article-card>
    <a class="card-link" href="${href(article.path)}">
      <p class="card-eyebrow">
        ${showCategory ? `<span class="card-cat">${escapeHtml(article.categoryTitle)}</span><span class="dot" aria-hidden="true"></span>` : ''}
        <span>${escapeHtml(article.contentType)}</span>
        ${article.jurisdiction && article.jurisdiction.length ? `<span class="dot" aria-hidden="true"></span><span>${escapeHtml(article.jurisdiction.join(' / '))}</span>` : ''}
      </p>
      <${H} class="card-title">${escapeHtml(article.title)}</${H}>
      <p class="card-text">${escapeHtml(truncate(article.description, 108))}</p>
      <p class="card-meta">
        <span>${formatDateShort(article.publishedAt)}</span>
        <span class="dot" aria-hidden="true"></span>
        <span>${article.readingTime} 分钟阅读</span>
      </p>
    </a>
  </article>`;
}

export function compactCard(article, { href }) {
  return `<li class="compact-item">
    <a href="${href(article.path)}">
      <span class="compact-no">${String(article.position).padStart(2, '0')}</span>
      <span class="compact-body">
        <span class="compact-title">${escapeHtml(article.title)}</span>
        <span class="compact-meta">${escapeHtml(article.categoryTitle)} · ${article.readingTime} 分钟</span>
      </span>
    </a>
  </li>`;
}

export function breadcrumbs(items, { href }) {
  const list = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast || !item.path) {
        return `<li aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      return `<li><a href="${href(item.path)}">${escapeHtml(item.label)}</a></li>`;
    })
    .join('');
  return `<nav class="breadcrumbs" aria-label="面包屑"><ol>${list}</ol></nav>`;
}

export function sectionHead({ eyebrow, title, description, link, href, id }) {
  return `<div class="section-head">
    <div>
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
      <h2 class="section-title"${id ? ` id="${escapeAttr(id)}"` : ''}>${escapeHtml(title)}</h2>
      ${description ? `<p class="section-desc">${escapeHtml(description)}</p>` : ''}
    </div>
    ${link ? `<a class="section-link" href="${href(link.path)}">${escapeHtml(link.label)}${icon('arrow', 16)}</a>` : ''}
  </div>`;
}

export function checkIcon() {
  return icon('check', 16);
}

export function articleMeta(article, { href, showJurisdiction = true } = {}) {
  const items = [];
  items.push(`<span class="meta-item">${icon('clock', 16)}${article.readingTime} 分钟阅读</span>`);
  items.push(`<span class="meta-item">${formatDateShort(article.publishedAt)} 发布</span>`);
  if (article.updatedAt && article.updatedAt !== article.publishedAt) {
    items.push(`<span class="meta-item">${formatDateShort(article.updatedAt)} 更新</span>`);
  }
  if (showJurisdiction && article.jurisdiction && article.jurisdiction.length) {
    items.push(
      `<span class="meta-item meta-law">${icon('globe', 16)}适用法域：${escapeHtml(article.jurisdiction.join(' / '))}</span>`
    );
  }
  if (article.verifiedAt) {
    items.push(`<span class="meta-item meta-law">资料核验：${formatDateShort(article.verifiedAt)}</span>`);
  }
  return `<div class="article-meta">${items.join('')}</div>`;
}

export function pager(article, { href }) {
  const prev = article.prev
    ? `<a class="pager-link pager-prev" href="${href(article.prev.path)}"><span class="pager-label">上一篇</span><span class="pager-title">${escapeHtml(article.prev.title)}</span></a>`
    : '<span class="pager-link is-empty" aria-hidden="true"></span>';
  const next = article.next
    ? `<a class="pager-link pager-next" href="${href(article.next.path)}"><span class="pager-label">下一篇</span><span class="pager-title">${escapeHtml(article.next.title)}</span></a>`
    : '<span class="pager-link is-empty" aria-hidden="true"></span>';
  return `<nav class="pager" aria-label="文章翻页">${prev}${next}</nav>`;
}

export function toc(headings) {
  const items = headings.filter((h) => h.level === 2 || h.level === 3);
  if (items.length < 2) return '';
  return `<details class="toc" open>
    <summary class="toc-title">本文目录</summary>
    <ol class="toc-list">
      ${items
        .map(
          (h) =>
            `<li class="toc-item level-${h.level}"><a class="toc-link" href="#${escapeAttr(h.id)}">${escapeHtml(h.text)}</a></li>`
        )
        .join('')}
    </ol>
  </details>`;
}

export function statBlock(value, label, note = '') {
  return `<div class="stat">
    <span class="stat-value">${escapeHtml(String(value))}</span>
    <span class="stat-label">${escapeHtml(label)}</span>
    ${note ? `<span class="stat-note">${escapeHtml(note)}</span>` : ''}
  </div>`;
}