import { loadIndex, searchDocs, highlight } from './search.js';
import { sitePath } from './store.js';

const root = document.querySelector('[data-search-page]');
if (!root) {
  // 兼容其他页面：此处无需执行。
} else {
  const input = root.querySelector('[data-search-page-input]');
  const results = root.querySelector('[data-search-page-results]');
  const params = new URLSearchParams(window.location.search);

  const filters = document.createElement('div');
  filters.className = 'filter-bar';
  filters.style.marginTop = '16px';
  filters.innerHTML = `
    <div class="filter-select"><select class="select" id="search-type"><option value="">所有类型</option><option value="指南">指南</option><option value="案例">案例</option><option value="教学案例">教学案例</option><option value="结构情景分析">结构情景分析</option></select></div>
    <div class="filter-select"><select class="select" id="search-jur"><option value="">所有法域</option><option value="中国大陆">中国大陆</option><option value="香港">香港</option><option value="新加坡">新加坡</option><option value="美国">美国</option><option value="教学情景">教学情景</option><option value="多法域比较">多法域比较</option></select></div>
    <span class="result-count" data-search-count>共 0 条结果</span>`;
  root.querySelector('.filter-bar')?.after(filters);

  let docs = [];
  let timer = null;
  loadIndex().then((data) => {
    docs = data;
    render(input.value || params.get('q') || '');
  });

  function render(query) {
    if (!query.trim()) {
      results.innerHTML = '<p class="search-result-empty">输入关键词开始检索，例如「稀释」「董事会」「期权池」「僵局」。</p>';
      root.querySelector('[data-search-count]').textContent = '共 0 条结果';
      return;
    }
    const type = document.getElementById('search-type')?.value || '';
    const jur = document.getElementById('search-jur')?.value || '';
    let found = searchDocs(docs, query, 100);
    if (type) found = found.filter((doc) => String(doc.type || '').includes(type));
    if (jur) found = found.filter((doc) => (doc.jur || []).some((j) => String(j).includes(jur)));
    root.querySelector('[data-search-count]').textContent = `共 ${found.length} 条结果`;
    if (!found.length) {
      results.innerHTML = `<p class="search-result-empty">没有找到符合条件的结果。试试更短的关键词或移除筛选。</p>`;
      return;
    }
    results.innerHTML = found.map((doc) => `<a class="search-result" href="${sitePath(doc.u)}">
      <span class="search-result-title">${highlight(doc.t, query)}</span>
      <span class="search-result-meta">${doc.c || ''} · ${doc.type || ''} · ${(doc.jur || []).join(' / ') || '未标注法域'}</span>
      <span class="search-result-desc">${highlight((doc.d || '').slice(0, 120), query)}</span>
    </a>`).join('');
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => render(input.value), 120);
  });
  ['search-type', 'search-jur'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => render(input.value));
  });
}
