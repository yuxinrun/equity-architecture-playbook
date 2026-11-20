import { escapeHtml, escapeAttr, uniq } from '../lib/utils.js';
import { icon, articleCard, breadcrumbs } from '../lib/components.js';

export function renderCategory(ctx, category) {
  const { site, href, articles } = ctx;
  const list = articles.filter((a) => a.category === category.id);
  const tagPool = uniq(list.flatMap((a) => a.tags)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const contentTypes = uniq(list.map((a) => a.contentType));
  const jurisdictions = uniq(
    list.flatMap((a) => (a.jurisdiction || []))
  );

  const chips = tagPool
    .map(
      (tag) => `<button class="chip" type="button" data-filter-chip data-filter-key="tag" data-value="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`
    )
    .join('');

  const cards = list
    .map(
      (article) =>
        `<div class="card-wrapper" data-filter-item data-type="${escapeAttr(article.contentType || '')}" data-jur="${escapeAttr(article.jurisdiction.join(' '))}" data-tags="${escapeAttr(article.tags.join('|'))}" data-text="${escapeAttr(article.title + ' ' + article.description + ' ' + article.tags.join(' '))}">
          ${articleCard(article, { href, showCategory: false })}
        </div>`
    )
    .join('');

  const typeSelect = contentTypes.length > 1
    ? `<div class="filter-select">
        <select data-filter-select data-filter-key="type">
          <option value="">所有类型</option>
          ${contentTypes.map((t) => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join('')}
        </select>
      </div>`
    : '';

  const jurSelect = jurisdictions.length > 1
    ? `<div class="filter-select">
        <select data-filter-select data-filter-key="jur">
          <option value="">所有法域</option>
          ${jurisdictions.map((j) => `<option value="${escapeAttr(j)}">${escapeHtml(j)}</option>`).join('')}
        </select>
      </div>`
    : '';

  const main = `
  <div class="page-hero">
    <div class="container container-narrow">
      ${breadcrumbs([{ label: '首页', path: '/' }, { label: category.title }], { href })}
      <h1>${escapeHtml(category.title)}</h1>
      <p class="page-desc">${escapeHtml(category.seoDescription || category.description)}</p>
      <div class="page-hero-meta">
        <span>共 <strong>${list.length}</strong> 篇文章</span>
        ${category.jurisdictionNote ? '<span class="meta-item meta-law">⚠ 本栏目部分内容涉及法律/税务，请留意法域标注与核验日期</span>' : ''}
      </div>
    </div>
  </div>

  <section class="section section-tight">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">
          ${icon('search', 16)}
          <input type="search" data-filter-search placeholder="在「${escapeHtml(category.title)}」中搜索…">
        </div>
        ${typeSelect}
        ${jurSelect}
        <span class="result-count" data-result-count>共 ${list.length} 篇</span>
      </div>
      ${chips ? `<div class="chip-row">${chips}</div>` : ''}
      <div class="article-list" style="margin-top:${chips ? '16px' : '0'}">
        ${cards || '<p class="empty-state"><strong>暂无文章</strong>该栏目文章正在撰写中，请稍后查看。</p>'}
      </div>
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的内容</strong>试试调整筛选条件或关键词。</div>
    </div>
  </section>

  <section class="section section-ink" style="padding-block:40px">
    <div class="container" style="text-align:center">
      <p style="font-size:18px;color:#fff">${escapeHtml(category.description)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px">
        ${tagPool
          .slice(0, 8)
          .map((tag) => `<span class="chip" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18);color:#c8dae8;cursor:default">${escapeHtml(tag)}</span>`)
          .join('')}
      </div>
    </div>
  </section>
  `;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.title,
      description: category.seoDescription || category.description,
      inLanguage: 'zh-Hans-CN',
      about: { '@type': 'Thing', name: category.title }
    }
  ];

  return {
    path: category.path,
    title: category.title,
    description: category.seoDescription,
    bodyClass: 'page-category',
    main,
    schema,
    scripts: ['/assets/js/filters.js']
  };
}