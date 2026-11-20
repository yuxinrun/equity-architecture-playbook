import { sitePath, store } from './store.js';

let indexPromise = null;

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(sitePath('/search-index.json'), { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => data.docs || [])
      .catch((error) => {
        console.warn('搜索索引加载失败：', error);
        return [];
      });
  }
  return indexPromise;
}

const FIELD_WEIGHTS = { title: 60, tags: 26, description: 18, category: 12, body: 4 };

function tokenize(query) {
  return String(query)
    .toLowerCase()
    .replace(/[，。、；：？！“”‘’（）《》【】]/g, ' ')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function searchDocs(docs, query, limit = 20) {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const results = [];
  for (const doc of docs) {
    const title = (doc.t || '').toLowerCase();
    const tags = (doc.g || []).join(' ').toLowerCase();
    const description = (doc.d || '').toLowerCase();
    const category = (doc.c || '').toLowerCase();
    const body = (doc.k || '').toLowerCase();
    let score = 0;
    let allMatched = true;
    for (const term of terms) {
      let termScore = 0;
      if (title.includes(term)) termScore += FIELD_WEIGHTS.title + (title.startsWith(term) ? 20 : 0);
      if (tags.includes(term)) termScore += FIELD_WEIGHTS.tags;
      if (description.includes(term)) termScore += FIELD_WEIGHTS.description;
      if (category.includes(term)) termScore += FIELD_WEIGHTS.category;
      if (!termScore && body.includes(term)) termScore += FIELD_WEIGHTS.body;
      if (!termScore) {
        allMatched = false;
        break;
      }
      score += termScore;
    }
    if (!allMatched) continue;
    results.push({ doc, score });
  }
  return results
    .sort((a, b) => b.score - a.score || String(b.doc.date || '').localeCompare(String(a.doc.date || '')))
    .slice(0, limit)
    .map((item) => item.doc);
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function highlight(text, query) {
  const safe = String(text || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const terms = tokenize(query);
  if (!terms.length) return safe;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
}

export function resultMarkup(doc, query) {
  const meta = escapeHtml([doc.c, doc.type].filter(Boolean).join(' · '));
  return `<a class="search-result" href="${escapeHtml(sitePath(doc.u))}">
    <span class="search-result-title">${highlight(doc.t, query)}</span>
    <span class="search-result-meta">${meta}</span>
  </a>`;
}

export function initSearchDialog() {
  const overlay = document.querySelector('[data-search-overlay]');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  if (!overlay || !input || !results) return;

  let docs = [];
  let lastFocus = null;
  let timer = null;

  const open = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    window.setTimeout(() => input.focus(), 30);
    loadIndex().then((data) => {
      docs = data;
      if (input.value.trim()) render(input.value);
    });
  };

  const close = () => {
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const render = (query) => {
    if (!query.trim()) {
      results.innerHTML = `<p class="search-result-empty">输入关键词开始检索，例如「稀释」「董事会」「期权池」「僵局」。</p>`;
      return;
    }
    if (!docs.length) {
      results.innerHTML = `<p class="search-result-empty">搜索索引尚未就绪，请稍后重试，或前往完整搜索页。</p>`;
      return;
    }
    const found = searchDocs(docs, query, 8);
    if (!found.length) {
      results.innerHTML = `<p class="search-result-empty">没有找到与「${escapeHtml(query)}」相关的内容。试试更短的关键词。</p>`;
      return;
    }
    results.innerHTML =
      found.map((doc) => resultMarkup(doc, query)).join('') +
      `<div class="search-results-foot"><a href="${sitePath('/search/?q=' + encodeURIComponent(query))}">查看全部结果 →</a></div>`;
  };

  document.querySelectorAll('[data-search-open]').forEach((button) => {
    button.addEventListener('click', open);
  });
  document.querySelectorAll('[data-search-close]').forEach((button) => {
    button.addEventListener('click', close);
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const focusable = overlay.querySelectorAll('input, button, a[href]');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden) close();
    if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (overlay.hidden) open();
      else close();
    }
  });

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const value = input.value;
    timer = window.setTimeout(() => render(value), 120);
  });

  results.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link) close();
  });
}

/** 最近阅读记录（文章页调用） */
export function trackReading(entry) {
  store.addRecent(entry);
}