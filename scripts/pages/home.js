import { escapeHtml, formatDateShort } from '../lib/utils.js';
import { icon, sectionHead, statBlock } from '../lib/components.js';

function compactList(articles, href, limit = 4) {
  return `<ul class="compact-list">
    ${articles
      .slice(0, limit)
      .map(
        (article) => `<li class="compact-item">
      <a href="${href(article.path)}">
        <span class="compact-no">${String(article.position).padStart(2, '0')}</span>
        <span class="compact-body">
          <span class="compact-title">${escapeHtml(article.title)}</span>
          <span class="compact-meta">${escapeHtml(article.contentType)} · ${article.readingTime} 分钟 · ${escapeHtml(article.description.slice(0, 34))}…</span>
        </span>
      </a>
    </li>`
      )
      .join('')}
  </ul>`;
}

function topicSection({ category, articles, href, index }) {
  return `<section class="topic-section" aria-labelledby="topic-${category.id}">
    <div class="topic-intro">
      <p class="eyebrow">专题 ${String(index).padStart(2, '0')}</p>
      <h2 id="topic-${category.id}">${escapeHtml(category.title)}</h2>
      <p>${escapeHtml(category.description)}</p>
      <a class="section-link" href="${href(category.path)}">进入栏目${icon('arrow', 16)}</a>
    </div>
    <div>
      ${compactList(articles, href, 4)}
    </div>
  </section>`;
}

export function renderHome(ctx) {
  const { site, href, articles, categories, tools, books, sources, stats } = ctx;
  const featured = articles.filter((a) => a.featured);
  const featuredMain = featured[0] || articles[0];
  const featuredSide = featured.slice(1, 4);
  const latest = [...articles]
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, 6);
  const cases = articles.filter((a) => a.category === 'case-studies');
  const catById = new Map(categories.map((c) => [c.id, c]));

  const topicTiles = [
    { id: 'company-structure', no: '01', text: '法律主体、组织形态与集团结构如何支撑业务。' },
    { id: 'equity-design', no: '02', text: '比例、表决权与分红权的基础概念与常见误区。' },
    { id: 'control-rights', no: '03', text: '董事会、保留事项与表决机制如何真正运行。' },
    { id: 'equity-incentives', no: '04', text: '期权、限制性股权与激励池的长期安排。' },
    { id: 'fundraising', no: '05', text: '投前投后、完全稀释与多轮融资的算术。' },
    { id: 'shareholder-exit', no: '06', text: '转让、回购、僵局与争议解决的机制设计。' }
  ]
    .map((tile) => {
      const category = catById.get(tile.id);
      return `<a class="topic-tile" href="${href(category.path)}">
        <span class="topic-no">${tile.no} / ${escapeHtml(category.english)}</span>
        <span class="topic-title">${escapeHtml(category.title)}</span>
        <span class="topic-text">${escapeHtml(tile.text)}</span>
      </a>`;
    })
    .join('');

  const fundamentals = site.fundamentals
    .map(
      (item) => `<a class="fundamental" href="${href(item.href)}">
      <span class="fundamental-no">${escapeHtml(item.no)}</span>
      <span class="fundamental-title">${escapeHtml(item.title)}</span>
      <span class="fundamental-text">${escapeHtml(item.text)}</span>
    </a>`
    )
    .join('');

  const sections = ['founder-equity', 'corporate-governance', 'control-rights', 'equity-incentives', 'fundraising', 'shareholder-exit']
    .map((id, index) => {
      const category = catById.get(id);
      const list = articles.filter((a) => a.category === id);
      if (!category || !list.length) return '';
      return topicSection({ category, articles: list, href, index: index + 5 });
    })
    .join('');

  const toolCards = tools
    .slice(0, 4)
    .map(
      (tool) => `<a class="tool-card" href="${href(`/tools/${tool.slug}/`)}">
      <span class="tool-icon">${icon(tool.icon || 'sliders', 20)}</span>
      <h3>${escapeHtml(tool.title)}</h3>
      <p>${escapeHtml(tool.description)}</p>
      <span class="tool-meta">本地运行 · 不上传数据</span>
    </a>`
    )
    .join('');

  const caseCards = cases
    .slice(0, 3)
    .map((article) => {
      const label = article.caseType || article.contentType;
      return `<article class="card"><a class="card-link" href="${href(article.path)}">
        <p class="card-eyebrow"><span class="card-cat">${escapeHtml(label)}</span><span class="dot"></span><span>${escapeHtml(article.jurisdiction.join(' / ') || '未标注法域')}</span></p>
        <h3 class="card-title">${escapeHtml(article.title)}</h3>
        <p class="card-text">${escapeHtml(article.description)}</p>
      </a></article>`;
    })
    .join('');

  const bookList = books
    .slice(0, 3)
    .map(
      (book) => `<li class="compact-item"><a href="${href('/books/#' + book.id)}">
        <span class="compact-no">${escapeHtml(book.year || '—')}</span>
        <span class="compact-body"><span class="compact-title">${escapeHtml(book.title)}</span><span class="compact-meta">${escapeHtml(book.author)} · ${escapeHtml(book.topic)}</span></span>
      </a></li>`
    )
    .join('');

  const resourceList = sources
    .filter((source) => source.featured)
    .slice(0, 4)
    .map(
      (source) => `<li class="compact-item"><a href="${href('/resources/#' + source.id)}">
        <span class="compact-no">${escapeHtml(source.jurisdiction)}</span>
        <span class="compact-body"><span class="compact-title">${escapeHtml(source.title)}</span><span class="compact-meta">${escapeHtml(source.publisher)}</span></span>
      </a></li>`
    )
    .join('');

  const main = `
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="hero-eyebrow"><span class="pulse" aria-hidden="true"></span>Equity Architecture Playbook</p>
        <h1 class="hero-title">好的公司架构，<br><span class="accent">让企业走得更远。</span></h1>
        <p class="hero-sub">从组织结构到股权安排，从控制权到长期激励，理解公司如何建立清晰、稳定、可持续的治理体系。</p>
        <p class="hero-desc">不只讨论股份怎么分，更研究权责如何匹配、决策如何运行、人才如何激励，以及企业如何面对融资、变化与退出。</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${href('/equity-design/')}">探索股权设计${icon('arrow', 17)}</a>
          <a class="btn btn-ghost" href="${href('/tools/')}">查看实用工具</a>
        </div>
        <div class="hero-stats">
          ${statBlock(stats.articles, '篇研究文章')}
          ${statBlock(stats.cases, '个案例与情景')}
          ${statBlock(stats.tools, '个交互工具')}
          ${statBlock(stats.glossary, '条术语释义')}
        </div>
      </div>
      <figure class="hero-visual">
        <img src="${href('/assets/illustrations/hero-architecture.svg')}" width="720" height="600" alt="公司架构示意图：创始人、员工、投资人通过持股平台与公司连接，董事会与经理层形成治理关系。" fetchpriority="high" decoding="async">
        <figcaption class="hero-visual-caption">示意图 / 教学模型：多层持股与治理关系，非真实公司结构</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section-tight" aria-labelledby="topic-nav-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '主题导航',
        title: '按问题进入，而不是按概念阅读',
        description: '六个入口对应创业与经营中最常被追问的问题。每个栏目都可以独立检索与筛选。',
        id: 'topic-nav-title'
      })}
      <div class="topic-grid">${topicTiles}</div>
    </div>
  </section>

  <section class="section section-alt" aria-labelledby="fundamentals-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '先理解这六件事',
        title: '六个基础判断，决定后面所有的设计',
        description: '如果只能先记住六件事，就是这六件。它们会在后面的每一篇文章里反复出现。',
        link: { label: '从股权设计基础开始', path: '/equity-design/' },
        href,
        id: 'fundamentals-title'
      })}
      <div class="fundamentals">${fundamentals}</div>
    </div>
  </section>

  <section class="section" aria-labelledby="featured-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '编辑精选',
        title: '值得先读的深度研究',
        description: '从框架到操作，这几篇构成本站的基础阅读路径。',
        link: { label: '全部文章', path: '/search/' },
        href,
        id: 'featured-title'
      })}
      <div class="feature-grid">
        <a class="feature-main" href="${href(featuredMain.path)}">
          <span class="card-eyebrow"><span>${escapeHtml(featuredMain.categoryTitle)}</span><span class="dot"></span><span>${escapeHtml(featuredMain.contentType)}</span></span>
          <h3 class="card-title">${escapeHtml(featuredMain.title)}</h3>
          <p class="card-text">${escapeHtml(featuredMain.description)}</p>
          <span class="feature-cta">${featuredMain.readingTime} 分钟阅读${icon('arrow', 15)}</span>
        </a>
        <div class="feature-side">
          ${featuredSide
            .map(
              (article, index) => `<article class="card">
            <a class="card-link" href="${href(article.path)}">
              <span class="card-no">0${index + 1}</span>
              <span class="card-body">
                <span class="card-eyebrow">${escapeHtml(article.categoryTitle)}</span>
                <span class="card-title">${escapeHtml(article.title)}</span>
                <span class="card-meta">${article.readingTime} 分钟阅读</span>
              </span>
            </a>
          </article>`
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="rule-label">专题研读</div>
      ${sections}
    </div>
  </section>

  <section class="section" aria-labelledby="tools-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '交互工具',
        title: '把结构问题算清楚',
        description: '所有工具在浏览器本地运行，不上传任何输入数据。计算结果为教学示意模型，不构成法律、税务或估值结论。',
        link: { label: '进入工具箱', path: '/tools/' },
        href,
        id: 'tools-title'
      })}
      <div class="tool-grid">${toolCards}</div>
      <p style="margin-top:20px;font-size:12.5px;color:var(--ink-faint)">共 ${stats.tools} 个工具，包含股权分配讨论、稀释计算、估值换算、归属时间线、结构图、治理矩阵与检查清单。</p>
    </div>
  </section>

  <section class="section section-alt" aria-labelledby="cases-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '案例与情境',
        title: '真实结构，和不能被简单复制的条件',
        description: '案例栏区分公开事实、媒体报道与结构情景分析。资料不足时不补齐数字，只讨论可核验的机制。',
        link: { label: '全部案例', path: '/case-studies/' },
        href,
        id: 'cases-title'
      })}
      <div class="grid grid-3">
        ${caseCards}
      </div>
      <div style="margin-top:18px">
        <a class="section-link" href="${href('/scenarios/')}">查看实操场景与决策指南${icon('arrow', 16)}</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="library-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '阅读与来源',
        title: '书籍、法规与专业资源',
        description: '书目信息以可核验的出版资料为准；法规资源记录发布机构、状态与最后核验日期。',
        link: { label: '完整书单', path: '/books/' },
        href,
        id: 'library-title'
      })}
      <div class="grid grid-2">
        <div>
          <p class="rule-label">股权与治理书单</p>
          <ul class="compact-list" style="border-top:0">${bookList}</ul>
          <a class="section-link" style="margin-top:16px" href="${href('/books/')}">查看 ${stats.books} 本书目${icon('arrow', 16)}</a>
        </div>
        <div>
          <p class="rule-label">官方来源与核验</p>
          <ul class="compact-list" style="border-top:0">${resourceList}</ul>
          <a class="section-link" style="margin-top:16px" href="${href('/resources/')}">查看 ${stats.sources} 条法规资源${icon('arrow', 16)}</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-alt" aria-labelledby="latest-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '最新更新',
        title: '最近修订与新增',
        description: '内容会随法规与实务变化更新，每篇文章标注发布时间与（如适用）资料核验日期。',
        link: { label: '全部内容', path: '/search/' },
        href,
        id: 'latest-title'
      })}
      <div class="grid grid-3">
        ${latest
          .map(
            (article) => `<article class="card"><a class="card-link" href="${href(article.path)}">
            <p class="card-eyebrow"><span class="card-cat">${escapeHtml(article.categoryTitle)}</span><span class="dot"></span><span>${formatDateShort(article.publishedAt)}</span></p>
            <h3 class="card-title" style="font-size:16px">${escapeHtml(article.title)}</h3>
            <p class="card-text">${escapeHtml(article.description)}</p>
          </a></article>`
          )
          .join('')}
      </div>
    </div>
  </section>

  <section class="section section-ink" aria-labelledby="method-title">
    <div class="container">
      ${sectionHead({
        eyebrow: '研究方法',
        title: '我们如何处理法律、税务与不确定性',
        description: '这不是法律意见书。所有涉及法律、税务、监管与跨境安排的内容，都标注法域、资料日期与不确定性。',
        link: { label: '关于本站与免责声明', path: '/about/' },
        href,
        id: 'method-title'
      })}
      <div class="grid grid-3" style="color:#b9c9d8">
        <div>
          <p style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.12em;color:#8fc3d8">01 / 法域分明</p>
          <p style="margin-top:8px;font-size:13.5px;line-height:1.85">中国大陆、香港、新加坡、美国等制度分别组织，不把某一法域的规则直接套用到另一法域。</p>
        </div>
        <div>
          <p style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.12em;color:#8fc3d8">02 / 来源可查</p>
          <p style="margin-top:8px;font-size:13.5px;line-height:1.85">优先引用官方一手来源，记录发布机构、发布日期与最后核验日期；无法确认的不写成结论。</p>
        </div>
        <div>
          <p style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.12em;color:#8fc3d8">03 / 边界清楚</p>
          <p style="margin-top:8px;font-size:13.5px;line-height:1.85">区分强制性规定、章程自治、合同安排与市场惯例，并说明结论成立的条件与不适用情形。</p>
        </div>
      </div>
    </div>
  </section>`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      alternateName: site.nameEn,
      description: site.description,
      inLanguage: 'zh-Hans-CN',
      url: site.siteUrl || undefined
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      alternateName: site.nameEn,
      description: site.description
    }
  ];

  return { main, schema };
}