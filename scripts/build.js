import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';
import { readJson, writeFile, logWarn, logError, logOk, escapeHtml, escapeAttr } from './lib/utils.js';
import { renderLayout, withBase, renderFooter } from './lib/layout.js';
import { loadContent, groupByCategory } from './lib/content.js';
import { renderHome } from './pages/home.js';
import { renderCategory } from './pages/category.js';
import { renderArticle } from './pages/article.js';
import { stripMarkdown } from './lib/markdown.js';
import { icon } from './lib/components.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const href = (url) => withBase(site.base, url);
const asset = (url) => withBase(site.base, url);

console.log(`\n━━━ ${site.name} · 构建开始 ━━━\n`);

/* 加载数据 */
const categories = readJson('data/categories.json');
const tools = readJson('data/tools.json');
const books = readJson('data/books.json');
const glossary = readJson('data/glossary.json');
const sources = readJson('data/sources.json');
const quotes = readJson('data/quotes.json');

const sourcesById = {};
for (const s of sources) sourcesById[s.id] = s;

/* 加载内容 */
const { articles, issues, tagPool } = loadContent({ categories, href, asset });
issues.errors.forEach((e) => logError(e));
issues.warnings.forEach((w) => logWarn(w));
if (issues.errors.length) {
  console.error(`\n构建因 ${issues.errors.length} 处内容错误而中断。请修复后再构建。`);
  process.exit(1);
}
logOk(`已加载 ${articles.length} 篇文章`);
const byCategory = groupByCategory(articles);

/* 统计 */
const stats = {
  articles: articles.filter((a) => a.category !== 'case-studies').length,
  cases: articles.filter((a) => a.category === 'case-studies').length,
  tools: tools.length,
  glossary: glossary.length,
  books: books.length,
  sources: sources.length,
  quotes: quotes.length,
  tags: tagPool.length,
  jurisdictions: [...new Set(articles.flatMap((a) => a.jurisdiction))].length
};

/* 全局渲染上下文 */
const ctx = { site, href, asset, categories, articles, byCategory, tools, books, glossary, sources, sourcesById, quotes, stats, tagPool };

/* HTML 缓存：用于做链接检查 */
const routeMap = new Map();
const pages = [];

/* 首页 */
{
  const { main, schema } = renderHome(ctx);
  const html = renderLayout({
    site,
    path: '/',
    title: '',
    description: site.description,
    bodyClass: 'page-home',
    main,
    schema,
    scripts: ['/assets/js/filters.js']
  });
  const page = { path: '/', html };
  pages.push(page);
  routeMap.set(normalizePage('/'), page);
  logOk('首页');
}

/* 分类栏目页 */
for (const category of categories) {
  if (category.pageType === 'articles') {
    const result = renderCategory(ctx, category);
    const html = renderLayout({ site, ...result });
    const page = { path: result.path, html };
    pages.push(page);
    routeMap.set(normalizePage(result.path), page);
    logOk(`${category.title}`);
  }
}

/* 文章详情页 */
for (const article of articles) {
  const related = (ctx.byCategory.get(article.category) || []).filter((a) => a.slug !== article.slug).slice(0, 3);
  const localCtx = { ...ctx, related };
  const result = renderArticle(localCtx, article, { byId: sourcesById });
  const html = renderLayout({
    site,
    ...result,
    head: `<script>document.addEventListener('DOMContentLoaded',function(){document.body.dataset.articlePath="${escapeAttr(article.path)}";document.body.dataset.articleTitle="${escapeAttr(article.title)}";document.body.dataset.articleCategory="${escapeAttr(article.category)}";});</script>`,
    showProgress: true
  });
  const page = { path: result.path, html };
  pages.push(page);
  routeMap.set(normalizePage(result.path), page);
  logOk(article.title);
}

/* 工具页 */
{
  const toolsMain = renderToolsIndex(ctx);
  const html = renderLayout({ site, path: '/tools/', title: '交互工具', description: '股权分配、稀释计算、估值换算、归属时间线……所有工具在浏览器本地运行，不上传数据。', bodyClass: 'page-tools', main: toolsMain, scripts: ['/assets/js/filters.js'] });
  pages.push({ path: '/tools/', html });
  routeMap.set(normalizePage('/tools/'), pages[pages.length - 1]);
  logOk('工具首页');

  for (const tool of tools) {
    const toolMain = renderToolDetail(ctx, tool);
    const html = renderLayout({ site, path: `/tools/${tool.slug}/`, title: tool.title, description: tool.description, bodyClass: 'page-tool', main: toolMain, scripts: tool.script ? [tool.script] : [] });
    pages.push({ path: `/tools/${tool.slug}/`, html });
    routeMap.set(normalizePage(`/tools/${tool.slug}/`), pages[pages.length - 1]);
    logOk(`工具 · ${tool.title}`);
  }
}

/* 书单 */
{
  const main = renderBooks(ctx);
  const html = renderLayout({ site, path: '/books/', title: '股权与治理书单', description: '按主题整理的公司治理、创业融资、组织管理与家族企业阅读清单。', bodyClass: 'page-books', main, scripts: ['/assets/js/filters.js', '/assets/js/books.js'] });
  pages.push({ path: '/books/', html });
  routeMap.set(normalizePage('/books/'), pages[pages.length - 1]);
  logOk('书单');
}

/* 术语词典 */
{
  const main = renderGlossary(ctx);
  const html = renderLayout({ site, path: '/glossary/', title: '专业术语词典', description: '股权、治理、融资与激励领域的高频术语，给出定义、常见误用与相关文章。', bodyClass: 'page-glossary', main, scripts: ['/assets/js/filters.js', '/assets/js/glossary.js'] });
  pages.push({ path: '/glossary/', html });
  routeMap.set(normalizePage('/glossary/'), pages[pages.length - 1]);
  logOk('术语词典');
}

/* 法规资源 */
{
  const main = renderResources(ctx);
  const html = renderLayout({ site, path: '/resources/', title: '法规与专业资源', description: '按法域整理的官方一手来源，记录发布机构、状态与最后核验日期。', bodyClass: 'page-resources', main, scripts: ['/assets/js/filters.js'] });
  pages.push({ path: '/resources/', html });
  routeMap.set(normalizePage('/resources/'), pages[pages.length - 1]);
  logOk('法规资源');
}

/* 金句 */
{
  const main = renderQuotes(ctx);
  const html = renderLayout({ site, path: '/quotes/', title: '金句与观点', description: '原创编辑观点与可核实出处的引用，按主题分门别类。', bodyClass: 'page-quotes', main, scripts: ['/assets/js/filters.js', '/assets/js/quotes.js'] });
  pages.push({ path: '/quotes/', html });
  routeMap.set(normalizePage('/quotes/'), pages[pages.length - 1]);
  logOk('金句');
}

/* 搜索页 */
{
  const main = renderSearch(ctx);
  const html = renderLayout({ site, path: '/search/', title: '全站搜索', description: '搜索文章、案例、术语与书籍。', bodyClass: 'page-search', main, scripts: ['/assets/js/search-page.js'] });
  pages.push({ path: '/search/', html });
  routeMap.set(normalizePage('/search/'), pages[pages.length - 1]);
  logOk('搜索页');
}

/* 收藏 */
{
  const main = renderBookmarks(ctx);
  const html = renderLayout({ site, path: '/bookmarks/', title: '我的收藏与阅读', description: '您在本地浏览器保存的收藏文章与最近阅读记录。', bodyClass: 'page-bookmarks', main, scripts: ['/assets/js/bookmarks.js'], noindex: true });
  pages.push({ path: '/bookmarks/', html });
  routeMap.set(normalizePage('/bookmarks/'), pages[pages.length - 1]);
  logOk('收藏页');
}

/* 关于 */
{
  const main = renderAbout(ctx);
  const html = renderLayout({ site, path: '/about/', title: '关于本站', description: '站点定位、研究方法、内容边界、核验标准与免责声明。', bodyClass: 'page-about', main });
  pages.push({ path: '/about/', html });
  routeMap.set(normalizePage('/about/'), pages[pages.length - 1]);
  logOk('关于');
}

/* 404 */
{
  const html = renderLayout({ site, path: '/404.html', title: '页面未找到', description: '抱歉，您访问的页面不存在。', bodyClass: 'page-notfound', main: '<div class="section"><div class="container" style="text-align:center;padding:64px 24px"><h1 style="font-size:32px;margin-bottom:12px">404</h1><p class="lead">抱歉，您访问的页面不存在。</p><p style="margin-top:20px"><a class="btn btn-primary" href="/">返回首页</a></p></div></div>', noindex: true });
  pages.push({ path: '/404.html', html, isFile: true });
  logOk('404 页面');
}

/* 写入 dist */
console.log('\n写入构建产物…');
for (const page of pages) {
  if (page.isFile) {
    writeFile(`dist${page.path}`, page.html);
  } else {
    writeFile(`dist${page.path}index.html`, page.html);
  }
}
logOk(`已写入 ${pages.length} 个页面`);

/* 复制静态资源 */
copyDir('public', 'dist');
copyDir('src/styles', 'dist/assets/css');
copyDir('src/scripts', 'dist/assets/js');

/* 内部链接与本地资源校验 */
checkLinksAndAssets();
logOk('内部链接与本地资源校验');

/* 搜索索引 */
generateSearchIndex(articles, stripMarkdown);
logOk('搜索索引');

/* 站点地图 */
generateSitemap();
logOk('sitemap.xml');

/* robots.txt */
writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n${site.siteUrl ? `Sitemap: ${site.siteUrl}/sitemap.xml` : ''}`);

/* 最终校验 */
console.log('\n━━━ 构建完成 ━━━');
console.log(`  文章 ${stats.articles + stats.cases} 篇 · 工具 ${stats.tools} 个 · 页面 ${pages.length} 个`);
if (!site.siteUrl) logWarn('未设置 SITE_URL，canonical 与 Open Graph 地址未生成。部署时通过 GitHub Actions 环境变量注入。');

/* -------- 页面渲染函数 -------- */
function renderToolsIndex(ctx) {
  const { href, tools } = ctx;
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>交互工具</h1>
      <p class="page-desc">所有工具在浏览器本地运行，不会把输入数据发送到服务器。计算结果为教学示意模型，请务必阅读每个工具的假设与限制。</p>
    </div>
  </div>
  <section class="section">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">${iconSearch()}<input type="search" data-filter-search placeholder="搜索工具…"></div>
        <span class="result-count" data-result-count>共 ${tools.length} 个工具</span>
      </div>
      <div class="tool-grid">
        ${tools
          .map(
            (tool) => `<div data-filter-item data-text="${escapeAttr(tool.title + ' ' + tool.description + ' ' + (tool.tags || []).join(' '))}">
          <a class="tool-card" href="${href(`/tools/${tool.slug}/`)}">
            <span class="tool-icon">${iconSvg(tool.icon || 'sliders')}</span>
            <h3>${escapeHtml(tool.title)}</h3>
            <p>${escapeHtml(tool.description)}</p>
            <span class="tool-meta">本地运行 · 不上传数据</span>
          </a>
        </div>`
          )
          .join('')}
      </div>
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的工具</strong>试试其他关键词。</div>
    </div>
  </section>`;
}

function renderToolDetail(ctx, tool) {
  return `<div class="container" style="padding-block:24px 48px">
    <p class="rule-label"><a href="${ctx.href('/tools/')}">← 返回工具箱</a></p>
    <h1 style="font-size:clamp(26px,3vw,38px);margin-bottom:12px">${escapeHtml(tool.title)}</h1>
    <p class="lead" style="max-width:34em">${escapeHtml(tool.description)}</p>
    <div class="tool-disclaimer">${iconSvg('alert')} <span>仅用于学习与初步讨论，不构成法律、税务、会计、估值或投资建议。所有计算均为示意模型。</span></div>
    <div class="tool-layout" id="tool-root" data-tool="${escapeAttr(tool.slug)}" data-tool-json="${escapeAttr(JSON.stringify(tool))}">
      <p style="grid-column:1/-1;padding:48px 0;text-align:center;color:var(--ink-faint)">工具正在加载…（请确认已连接脚本 ${escapeHtml(tool.script || '')}）</p>
    </div>
    <div class="tool-section" style="margin-top:24px">
      <h2>如何使用</h2>
      <div class="prose">${(tool.howToUse || '').replace(/\n/g, '<br>')}</div>
    </div>
    <div class="tool-section">
      <h2>假设与限制</h2>
      <div class="prose">${(tool.limitations || '').replace(/\n/g, '<br>')}</div>
    </div>
  </div>`;
}

function renderBooks(ctx) {
  const { href, books } = ctx;
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>股权与治理书单</h1>
      <p class="page-desc">按主题整理的公司治理、创业融资、组织管理与家族企业阅读清单。每本书都有独立的核心理念与适用读者说明。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">${iconSearch()}<input type="search" data-filter-search placeholder="搜索书名、作者或主题…"></div>
        <span class="result-count" data-result-count>共 ${books.length} 本</span>
      </div>
      <div class="chip-row">
        <button class="chip is-active" data-filter-chip data-value="">全部主题</button>
        ${[...new Set(books.map((b) => b.topic))]
          .map((topic) => `<button class="chip" data-filter-chip data-value="${escapeAttr(topic)}">${escapeHtml(topic)}</button>`)
          .join('')}
      </div>
      <div class="book-list" style="margin-top:18px">
        ${books
          .map(
            (book) => `<div class="book-item" id="${escapeAttr(book.id)}" data-filter-item data-tags="${escapeAttr(book.topic)}" data-text="${escapeAttr(book.title + ' ' + book.enTitle + ' ' + book.author + ' ' + book.topic)}">
          <div class="book-spine" aria-hidden="true">
            <span class="book-spine-title">${escapeHtml(book.title)}</span>
            <span class="book-spine-mark">— Equity Architecture Playbook —</span>
          </div>
          <div class="book-body">
            <p class="book-topic">${escapeHtml(book.topic)}</p>
            <h2 class="book-title">${escapeHtml(book.title)}${book.enTitle ? `<span class="book-title-en">${escapeHtml(book.enTitle)}</span>` : ''}</h2>
            <p class="book-meta">${escapeHtml(book.author)} · ${escapeHtml(book.publisher)} · ${escapeHtml(book.year)}</p>
            <p>${escapeHtml(book.overview)}</p>
            ${book.points ? `<ul class="book-points">${book.points.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : ''}
            ${book.limits ? `<p class="book-limits"><strong>阅读注意</strong>：${escapeHtml(book.limits)}</p>` : ''}
          </div>
        </div>`
          )
          .join('')}
      </div>
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的书目</strong>试试切换主题。</div>
    </div>
  </section>`;
}

function renderGlossary(ctx) {
  const { href, glossary } = ctx;
  const letters = [...new Set(glossary.map((g) => (g.letter || '#')))].sort();
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>专业术语词典</h1>
      <p class="page-desc">股权、治理、融资与激励领域的高频术语。每个词条包含定义、常见误用与指向相关文章的链接。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">${iconSearch()}<input type="search" data-filter-search placeholder="搜索术语…"></div>
        <span class="result-count" data-result-count>共 ${glossary.length} 条</span>
      </div>
      <div class="letter-bar">
        ${letters.map((l) => `<button class="letter-btn" data-filter-chip data-filter-key="letter" data-value="${escapeAttr(l)}">${escapeHtml(l)}</button>`).join('')}
      </div>
      <div class="term-list" style="margin-top:18px">
        ${glossary
          .map(
            (term) => `<div class="term-card" data-filter-item data-letter="${escapeAttr(term.letter || '#')}" data-text="${escapeAttr(term.term + ' ' + term.en + ' ' + term.definition)}">
          <div class="term-head">
            <span class="term-name">${escapeHtml(term.term)}</span>
            <span class="term-en">${escapeHtml(term.en)}</span>
          </div>
          <p class="term-def">${escapeHtml(term.definition)}</p>
          ${term.misuse ? `<p class="term-misuse"><strong>常见误用</strong>：${escapeHtml(term.misuse)}</p>` : ''}
          ${term.related ? `<a class="term-link" href="${href(term.related)}">相关文章 →</a>` : ''}
        </div>`
          )
          .join('')}
      </div>
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的术语</strong>试试其他拼音首字母或关键词。</div>
    </div>
  </section>`;
}

function renderResources(ctx) {
  const { href, sources } = ctx;
  const groups = {};
  for (const s of sources) {
    const jur = s.jurisdiction || '国际';
    if (!groups[jur]) groups[jur] = [];
    groups[jur].push(s);
  }
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>法规、研究与专业资源</h1>
      <p class="page-desc">按法域整理的官方一手来源，记录发布机构、状态与最后核验日期。每一条资源都有明确的适用范围说明。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">${iconSearch()}<input type="search" data-filter-search placeholder="搜索资源…"></div>
        <span class="result-count" data-result-count>共 ${sources.length} 条</span>
      </div>
      ${Object.entries(groups)
        .map(
          ([jur, items]) => `<div class="source-group" id="${escapeAttr(jur)}">
        <div class="source-group-title"><h2>${escapeHtml(jur)}</h2><span>${items.length} 条</span></div>
        ${items
          .map(
            (source) => `<div class="resource-item" id="${escapeAttr(source.id)}" data-filter-item data-text="${escapeAttr(source.title + ' ' + source.publisher + ' ' + (source.description || ''))}">
          <div>
            <p class="resource-name">${source.url ? `<a href="${escapeAttr(source.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(source.title)}</a>` : escapeHtml(source.title)}</p>
            ${source.description ? `<p class="resource-desc">${escapeHtml(source.description)}</p>` : ''}
          </div>
          <div class="resource-meta">
            <p>${escapeHtml(source.publisher)}</p>
            ${source.publishedAt ? `<p>发布于 ${escapeHtml(source.publishedAt)}</p>` : ''}
            ${source.status ? `<p>状态：${escapeHtml(source.status)}</p>` : ''}
          </div>
        </div>`
          )
          .join('')}
      </div>`
        )
        .join('')}
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的资源</strong>试试切换关键词。</div>
    </div>
  </section>`;
}

function renderQuotes(ctx) {
  const { href, quotes } = ctx;
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>金句与观点</h1>
      <p class="page-desc">原创编辑观点标注「编辑观点」。引用他人原话均有可靠出处。支持一键复制与收藏。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-filter-root>
      <div class="filter-bar">
        <div class="filter-search">${iconSearch()}<input type="search" data-filter-search placeholder="在金句中搜索…"></div>
        <span class="result-count" data-result-count>共 ${quotes.length} 条</span>
      </div>
      <div class="chip-row">
        <button class="chip is-active" data-filter-chip data-value="">全部主题</button>
        ${[...new Set(quotes.map((q) => q.topic))]
          .map((topic) => `<button class="chip" data-filter-chip data-value="${escapeAttr(topic)}">${escapeHtml(topic)}</button>`)
          .join('')}
      </div>
      <div class="quote-grid" style="margin-top:18px">
        ${quotes
          .map(
            (q) => `<div class="quote-card" data-filter-item data-tags="${escapeAttr(q.topic)}" data-text="${escapeAttr(q.text + ' ' + q.source + ' ' + q.topic)}">
          <p class="quote-topic">${escapeHtml(q.topic)}</p>
          <blockquote class="quote-text">${escapeHtml(q.text)}</blockquote>
          <p class="quote-source">— ${escapeHtml(q.source)}${q.isEditorial === true ? ' · <em>编辑观点</em>' : ''}</p>
          <div class="quote-actions">
            <button class="quote-btn" data-copy-text="${escapeAttr(q.text)}">复制</button>
            <button class="quote-btn" data-quote="${escapeAttr(q.id)}">收藏</button>
          </div>
        </div>`
          )
          .join('')}
      </div>
      <div class="empty-state" data-empty-state hidden><strong>没有匹配的观点</strong>试试切换主题。</div>
    </div>
  </section>`;
}

function renderSearch(ctx) {
  const { href } = ctx;
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>全站搜索</h1>
      <p class="page-desc">搜索文章标题、摘要、标签与正文。也可从导航栏随时打开搜索面板。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-search-page>
      <div class="filter-bar">
        <div class="filter-search" style="flex:1 1 100%">${iconSearch()}<input type="search" data-search-page-input placeholder="输入关键词：稀释、董事会、期权池、僵局…" id="search-page-input"></div>
      </div>
      <p class="search-hint" style="margin-bottom:20px">在标题、摘要、标签与正文中检索。共索引 ${ctx.stats ? ctx.stats.articles + ctx.stats.cases : 0} 篇文章。</p>
      <div data-search-page-results>
        <p style="padding:28px;text-align:center;color:var(--ink-faint)">输入关键词开始搜索。</p>
      </div>
    </div>
  </section>`;
}

function renderBookmarks(_ctx) {
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>我的收藏与阅读</h1>
      <p class="page-desc">文章收藏与最近阅读记录保存在您浏览器的本地存储中。不同设备之间不会同步。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container" data-bookmarks-root>
      <div class="grid grid-2">
        <div>
          <h2 style="font-size:20px;margin-bottom:16px">已收藏</h2>
          <div data-bookmarks-list><p style="color:var(--ink-faint)">加载中…</p></div>
        </div>
        <div>
          <h2 style="font-size:20px;margin-bottom:16px">最近阅读</h2>
          <div data-recent-list><p style="color:var(--ink-faint)">加载中…</p></div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderAbout(ctx) {
  const { href, stats } = ctx;
  return `
  <div class="page-hero">
    <div class="container container-narrow">
      <h1>关于本站与研究方法</h1>
      <p class="page-desc">《公司架构与股权设计》研究什么、不研究什么，资料如何核验，以及为什么我们坚持标注法域与不确定性。</p>
    </div>
  </div>
  <section class="section section-tight">
    <div class="container container-narrow prose">
      <h2>站点定位</h2>
      <p>《公司架构与股权设计》是一个系统研究公司组织架构、股权架构、公司治理、创始人股权分配、控制权设计、员工股权激励、融资稀释、股东退出与长期治理的中文知识库。目前收录 <strong>${stats ? stats.articles + stats.cases : 0} 篇研究文章</strong>、<strong>${stats ? stats.tools : 0} 个交互工具</strong>、<strong>${stats ? stats.glossary : 0} 条术语释义</strong>以及书籍、法规资源和实操场景。</p>
      <p>核心主张：好的股权设计，不是简单地把股份分完，而是让贡献、责任、控制、收益、风险和退出机制形成长期可持续的安排。</p>

      <h2>内容边界</h2>
      <p>本站<strong>不提供</strong>针对具体企业的法律、税务或投资结论。所有涉及法律、税务、监管、上市规则和跨境安排的内容，都明确标注法域、适用主体、资料日期和不确定性，并建议读者就具体交易咨询当地合格专业人士。</p>
      <p>我们不把「股权比例」当成唯一答案，坚持区分股权比例、表决权、董事席位、管理权限、分红权、剩余财产分配权、协议控制、实际控制认定、经济权益和法律所有权。</p>

      <h2>研究方法与核验标准</h2>
      <p>编辑团队遵循以下工作原则：</p>
      <ul>
        <li>按法域分别组织内容，至少明确区分中国大陆、香港、新加坡、美国及其他国家/地区。</li>
        <li>涉及法律条文时，优先引用官方一手来源。</li>
        <li>每条法规/政策资料记录：标题、发布机构、适用法域、发布日期、当前状态与最后核验日期。</li>
        <li>无法确认最新版本时，明确标注「需进一步核验」，不编造条文编号。</li>
        <li>区分法律强制性规定、章程自治空间、合同安排、市场惯例和专业建议。</li>
        <li>案例研究严格区分公开事实、媒体报道、当事人观点、研究者分析和编辑推论。</li>
        <li>书籍信息以可核验的书名、作者、版本、出版信息为准，不凭空编造。</li>
      </ul>

      <h2 style="color:var(--amber)">免责声明</h2>
      <p>本网站内容仅供研究与教育目的，不构成法律意见、税务建议、估值报告、投资决策依据或针对任何具体商业交易的推荐方案。本站不形成编辑者与读者之间的律师—客户关系、会计师—客户关系或任何形式的专业顾问关系。</p>
      <p>尽管编辑团队努力确保信息的准确性与时效性，但无法保证所有内容在任何时刻均反映最新法律法规、司法解释、监管口径或市场实践。读者在依赖本站任何信息做出商业、法律或财务决策之前，<strong>必须咨询所在法域的合格专业人士</strong>。</p>
      <p>对外部链接的内容、准确性与合规性，本站不承担责任。</p>

      <h2>关于 SVG 与图片</h2>
      <p>所有图表均为原创 SVG 教学示意图。图片资产可合法使用，储存于本仓库中，记录于 <a href="${href('/assets/ASSET-SOURCES.md')}">ASSET-SOURCES.md</a>。不使用未经授权的商业摄影、书籍封面或品牌素材。</p>
    </div>
  </section>`;
}

/* -------- 工具函数 -------- */

function normalizePage(p) {
  let out = p.replace(/\/+$/, '/').replace(/\/{2,}/g, '/');
  if (out === '') return '/';
  if (!out.startsWith('/')) out = '/' + out;
  return out;
}

function copyDir(srcRel, destRel) {
  const srcDir = path.resolve(ROOT, srcRel);
  const destDir = path.resolve(ROOT, destRel);
  if (!fs.existsSync(srcDir)) return;
  const walk = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const source = path.join(from, entry.name);
      const target = path.join(to, entry.name);
      if (entry.isDirectory()) walk(source, target);
      else if (entry.isFile()) fs.writeFileSync(target, fs.readFileSync(source));
    }
  };
  walk(srcDir, destDir);
}

function iconSearch() {
  return '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/></svg>';
}

function iconSvg(name) {
  return icon(name || 'sliders', 20);
}

function generateSearchIndex(articles, strip) {
  const docs = articles.map((article) => ({
    t: article.title,
    u: article.path,
    c: article.categoryTitle,
    d: article.description,
    g: article.tags,
    k: strip(article.body).slice(0, 1800),
    type: article.contentType,
    jur: article.jurisdiction,
    date: article.publishedAt
  }));
  writeFile('dist/search-index.json', JSON.stringify({ generated: new Date().toISOString(), count: docs.length, docs }, null, 2));
}

function checkLinksAndAssets() {
  const missing = new Set();
  const pattern = /(?:href|src)="(\/[^"']+)"/g;
  for (const page of pages) {
    let match;
    while ((match = pattern.exec(page.html))) {
      let target = match[1].split(/[?#]/)[0];
      if (site.base !== '/' && target.startsWith(site.base.replace(/\/$/, ''))) {
        target = '/' + target.slice(site.base.replace(/\/$/, '').length);
      }
      if (!target.startsWith('/')) continue;
      const normalized = normalizePage(target);
      if (routeMap.has(normalized)) continue;
      const file = path.join(ROOT, 'dist', target.replace(/^\/+/, ''));
      if (fs.existsSync(file)) continue;
      missing.add(`${page.path} → ${target}`);
    }
  }
  if (missing.size) {
    [...missing].slice(0, 20).forEach((item) => logWarn(`内部目标可能不存在：${item}`));
    if (missing.size > 20) logWarn(`另有 ${missing.size - 20} 个内部目标未列出`);
  }
}

function generateSitemap() {
  const urls = pages
    .filter((p) => !p.isFile)
    .map((p) => {
      const now = new Date().toISOString().slice(0, 10);
      return `  <url><loc>${site.siteUrl || 'http://localhost'}${escapeXml(p.path)}</loc><lastmod>${now}</lastmod></url>`;
    })
    .join('\n');
  writeFile(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}