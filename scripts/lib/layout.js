import { escapeHtml, escapeAttr } from './utils.js';
import { brandMark, icon } from './components.js';

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 34'%3E%3Crect width='34' height='34' rx='8' fill='%2318324B'/%3E%3Cpath d='M17 8v6M17 14H9v5M17 14h8v5' stroke='%237FB6F0' stroke-width='1.4' fill='none'/%3E%3Crect x='13.6' y='5.6' width='6.8' height='5' rx='1.2' fill='%23F6F7F8'/%3E%3Crect x='5.4' y='19' width='7.2' height='5.4' rx='1.2' fill='%23168A82'/%3E%3Crect x='21.4' y='19' width='7.2' height='5.4' rx='1.2' fill='%23C58A3A'/%3E%3C/svg%3E";

function isActive(currentPath, targetPath) {
  if (targetPath === '/') return currentPath === '/';
  return currentPath === targetPath || currentPath.startsWith(targetPath);
}

function renderNav(site, path, href) {
  return `<nav class="primary-nav" id="primary-nav" aria-label="主导航">
    <ul class="nav-list">
      ${site.nav
        .map(
          (item) =>
            `<li><a class="nav-link${isActive(path, item.path) ? ' is-active' : ''}" href="${href(item.path)}"${
              isActive(path, item.path) ? ' aria-current="page"' : ''
            }>${escapeHtml(item.label)}</a></li>`
        )
        .join('')}
    </ul>
    <div class="nav-utility">
      ${site.utilityNav
        .map((item) => `<a class="nav-utility-link" href="${href(item.path)}">${escapeHtml(item.label)}</a>`)
        .join('')}
      <a class="nav-utility-link nav-utility-cta" href="${href('/tools/')}">工具箱</a>
    </div>
  </nav>`;
}

export function renderLayout({
  site,
  path,
  title,
  description,
  bodyClass = '',
  main,
  head = '',
  schema = [],
  scripts = [],
  showProgress = false,
  noindex = false
}) {
  const href = (url) => withBase(site.base, url);
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · ${site.nameEn}`;
  const canonical = site.siteUrl ? `${site.siteUrl}${path}` : '';
  const ogImage = site.siteUrl ? `${site.siteUrl}${withBase(site.base, '/assets/images/og-cover.svg')}` : '';
  const jsonLd = schema.length
    ? `<script type="application/ld+json">${JSON.stringify(schema.length === 1 ? schema[0] : schema)}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-Hans-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeAttr(description || site.description)}">
  ${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
  ${canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : '<!-- canonical 未生成：构建时未设置 SITE_URL -->'}
  <meta name="theme-color" content="#18324B">
  <meta name="color-scheme" content="light">
  <meta property="og:type" content="${bodyClass.includes('page-article') ? 'article' : 'website'}">
  <meta property="og:site_name" content="${escapeAttr(site.name)}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:title" content="${escapeAttr(fullTitle)}">
  <meta property="og:description" content="${escapeAttr(description || site.description)}">
  ${canonical ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : ''}
  ${ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}">` : ''}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escapeAttr(fullTitle)}">
  <meta name="twitter:description" content="${escapeAttr(description || site.description)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="${href('/assets/css/main.css')}">
  <link rel="alternate" hreflang="zh-Hans-CN" href="${escapeAttr(canonical || href(path))}">
  ${head}
  ${jsonLd}
</head>
<body class="${bodyClass}" data-base="${escapeAttr(site.base)}" data-page="${escapeAttr(path)}">
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header" data-site-header>
    <div class="container header-inner">
      <a class="brand" href="${href('/')}" aria-label="${escapeAttr(site.name)} 首页">
        ${brandMark()}
        <span class="brand-text">
          <span class="brand-name">${escapeHtml(site.name)}</span>
          <span class="brand-en">${escapeHtml(site.nameEn)}</span>
        </span>
      </a>
      ${renderNav(site, path, href)}
      <div class="header-actions">
        <button class="icon-btn search-trigger" type="button" data-search-open aria-label="打开站内搜索" aria-haspopup="dialog">
          ${icon('search', 19)}
          <span class="search-trigger-text">搜索</span>
        </button>
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="primary-nav" aria-label="打开导航菜单">
          <span class="nav-toggle-bars" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    ${showProgress ? '<div class="reading-progress" data-reading-progress aria-hidden="true"><span></span></div>' : ''}
  </header>
  <div class="nav-scrim" data-nav-scrim hidden></div>
  <main id="main">
${main}
  </main>
  ${renderFooter(site, href)}
  ${renderSearchOverlay(site, href)}
  <button class="to-top" type="button" data-to-top aria-label="返回顶部" hidden>${icon('arrowUp', 18)}</button>
  <script type="module" src="${href('/assets/js/app.js')}"></script>
  ${scripts.map((src) => `<script type="module" src="${href(src)}"></script>`).join('\n  ')}
</body>
</html>
`;
}

export function renderFooter(site, href) {
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <p class="footer-name">${escapeHtml(site.name)}</p>
        <p class="footer-en">${escapeHtml(site.nameEn)}</p>
        <p class="footer-desc">系统研究公司架构、股权设计、控制权、激励机制与股东退出的中文知识库。内容为研究与教育目的，不构成法律、税务、会计或投资建议。</p>
      </div>
      <div class="footer-col">
        <p class="footer-title">核心栏目</p>
        <ul>
          <li><a href="${href('/company-structure/')}">公司架构</a></li>
          <li><a href="${href('/equity-design/')}">股权设计</a></li>
          <li><a href="${href('/founder-equity/')}">创始人分股</a></li>
          <li><a href="${href('/control-rights/')}">控制权</a></li>
          <li><a href="${href('/equity-incentives/')}">股权激励</a></li>
          <li><a href="${href('/fundraising/')}">融资与稀释</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-title">工具与资料</p>
        <ul>
          <li><a href="${href('/tools/')}">工具箱</a></li>
          <li><a href="${href('/glossary/')}">术语词典</a></li>
          <li><a href="${href('/quotes/')}">金句与观点</a></li>
          <li><a href="${href('/books/')}">股权书单</a></li>
          <li><a href="${href('/resources/')}">法规与资源</a></li>
          <li><a href="${href('/search/')}">全站搜索</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-title">关于本站</p>
        <ul>
          <li><a href="${href('/about/')}">关于与研究方法</a></li>
          <li><a href="${href('/case-studies/')}">案例研究</a></li>
          <li><a href="${href('/scenarios/')}">场景指南</a></li>
          <li><a href="${href('/shareholder-exit/')}">股东退出</a></li>
          <li><a href="${href('/corporate-governance/')}">公司治理</a></li>
          <li><a href="${href('/finance-tax/')}">财务与税务</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© ${new Date().getFullYear()} ${escapeHtml(site.name)} · ${escapeHtml(site.nameEn)}</p>
      <p class="footer-disclaimer">本站不提供针对具体企业的法律、税务或投资结论。涉及具体交易，请咨询当地合格专业人士。</p>
    </div>
  </footer>`;
}

function renderSearchOverlay(site, href) {
  return `<div class="search-overlay" data-search-overlay hidden>
    <div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
      <div class="search-panel-head">
        <h2 class="search-panel-title" id="search-dialog-title">站内搜索</h2>
        <button class="icon-btn" type="button" data-search-close aria-label="关闭搜索">${icon('close', 18)}</button>
      </div>
      <div class="search-field">
        ${icon('search', 18)}
        <label class="sr-only" for="search-dialog-input">搜索关键词</label>
        <input id="search-dialog-input" type="search" placeholder="输入关键词：稀释、董事会、期权池…" autocomplete="off" data-search-input>
      </div>
      <p class="search-hint">在标题、摘要、标签与正文中检索。也可前往 <a href="${href('/search/')}">完整搜索页</a> 使用筛选器。</p>
      <div class="search-results" data-search-results aria-live="polite"></div>
    </div>
  </div>`;
}

export function withBase(base, url = '') {
  const value = String(url);
  if (!value) return base;
  if (/^(https?:|mailto:|tel:|#|data:)/.test(value)) return value;
  if (!value.startsWith('/')) return value;
  if (base === '/') return value;
  return base.replace(/\/$/, '') + value;
}