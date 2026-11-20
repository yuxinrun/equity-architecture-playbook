import { escapeHtml, escapeAttr, formatDateShort } from '../lib/utils.js';
import { icon, breadcrumbs, articleMeta, toc, pager, tagRow } from '../lib/components.js';

export function renderArticle(ctx, article, sourcesData) {
  const { site, href } = ctx;

  const sourceEntries = (article.sources || [])
    .map((id) => {
      if (typeof id === 'string' && sourcesData) return sourcesData.byId[id] || null;
      return null;
    })
    .filter(Boolean);

  const sourceHtml = sourceEntries.length
    ? `<div class="container-narrow sources">
      <p class="sources-title">参考来源</p>
      ${sourceEntries
        .map(
          (source) => `<div class="source-item">
        <p class="source-title">${source.url ? `<a href="${escapeAttr(source.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(source.title)}</a>` : escapeHtml(source.title)}</p>
        <p class="source-meta"><span>${escapeHtml(source.publisher)}</span><span>${escapeHtml(source.jurisdiction)}</span><span>${formatDateShort(source.publishedAt)}</span>${source.status ? `<span>${escapeHtml(source.status)}</span>` : ''}</p>
      </div>`
        )
        .join('')}
    </div>`
    : '';

  const jurDisclaimer = article.jurisdiction && article.jurisdiction.length
    ? `<div class="container-narrow" style="margin-bottom:28px">
      <aside class="disclaimer disclaimer-law">
        <strong>ⓘ 适用法域：${escapeHtml(article.jurisdiction.join(' / '))}</strong>${article.verifiedAt ? ` · 资料核验至 ${formatDateShort(article.verifiedAt)}` : ''}。本文讨论的制度限于上述法域下的现行规则与公开资料，不构成针对任何具体企业的法律、税务或投资建议。具体交易请咨询当地合格专业人士。
      </aside>
    </div>`
    : `<div class="container-narrow" style="margin-bottom:28px">
      <aside class="disclaimer">
        <strong>声明</strong>：本文为研究教育性质内容，不构成法律、税务、会计、估值或投资建议。具体情形请咨询当地合格专业人士。
      </aside>
    </div>`;

  const related = ctx.related
    ? ctx.related
        .filter((r) => r && r.slug !== article.slug)
        .slice(0, 3)
    : [];

  const relatedHtml = related.length
    ? `<div class="container-narrow related-block">
      <p class="rule-label">延伸阅读</p>
      <div class="grid grid-3">
        ${related
          .map(
            (item) => `<article class="card"><a class="card-link" href="${href(item.path)}">
              <p class="card-eyebrow"><span class="card-cat">${escapeHtml(item.categoryTitle)}</span></p>
              <h3 class="card-title" style="font-size:15.5px">${escapeHtml(item.title)}</h3>
              <p class="card-text">${escapeHtml(item.description)}</p>
            </a></article>`
          )
          .join('')}
      </div>
    </div>`
    : '';

  const main = `
  <article class="article">
    <header class="article-header">
      <div class="container-narrow">
        ${breadcrumbs(
          [
            { label: '首页', path: '/' },
            { label: article.categoryTitle, path: `/${article.category}/` },
            { label: article.title }
          ],
          { href }
        )}
        <div class="article-kicker">
          <span class="kicker-cat">${escapeHtml(article.categoryTitle)}</span>
          <span class="kicker-type">${escapeHtml(article.contentType)}</span>
          ${article.jurisdiction && article.jurisdiction.length
            ? article.jurisdiction.map((j) => `<span class="kicker-type">${escapeHtml(j)}</span>`).join('')
            : ''}
        </div>
        <h1 class="article-title">${escapeHtml(article.title)}</h1>
        <p class="article-deck">${escapeHtml(article.description)}</p>
        ${articleMeta(article, { href, showJurisdiction: false })}
        ${tagRow(article.tags)}
      </div>
    </header>

    <div class="container article-layout">
      <div class="article-main prose">
        ${article.html}
      </div>
      <aside class="article-aside">
        ${toc(article.headings)}
        <div class="aside-card">
          <p class="aside-card-title">操作</p>
          <div class="aside-actions">
            <button class="aside-action" type="button" data-bookmark aria-pressed="false" data-bookmark-label="收藏本文">
              ${icon('bookmark')}
              <span data-bookmark-label>收藏本文</span>
            </button>
            <button class="aside-action" type="button" data-copy-link>
              ${icon('link')}
              <span data-copy-label>复制链接</span>
            </button>
            <button class="aside-action" type="button" data-print>
              ${icon('print')}
              <span>打印本文</span>
            </button>
          </div>
        </div>
        ${article.prev || article.next
          ? `<div class="aside-card">
              <p class="aside-card-title">相邻文章</p>
              <ul class="aside-link-list">
                ${article.prev
                  ? `<li><a href="${href(article.prev.path)}">← ${escapeHtml(article.prev.title)}</a></li>`
                  : ''}
                ${article.next
                  ? `<li><a href="${href(article.next.path)}">→ ${escapeHtml(article.next.title)}</a></li>`
                  : ''}
              </ul>
            </div>`
          : ''}
      </aside>
    </div>

    <footer class="container-narrow article-footer">
      ${sourceHtml}
      ${jurDisclaimer}
      ${pager(article, { href })}
    </footer>
  </article>

  ${relatedHtml}
  `;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      inLanguage: 'zh-Hans-CN',
      author: { '@type': 'Organization', name: site.author },
      publisher: { '@type': 'Organization', name: site.name },
      about: article.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
      wordCount: article.wordCount
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: site.siteUrl ? `${site.siteUrl}/` : undefined },
        {
          '@type': 'ListItem',
          position: 2,
          name: article.categoryTitle,
          item: site.siteUrl ? `${site.siteUrl}${article.category}/` : undefined
        },
        { '@type': 'ListItem', position: 3, name: article.title }
      ]
    }
  ];

  return {
    path: article.path,
    title: article.title,
    description: article.description,
    bodyClass: 'page-article',
    main,
    schema,
    scripts: ['/assets/js/article.js'],
    noindex: article.contentType === '研究提纲' || false
  };
}