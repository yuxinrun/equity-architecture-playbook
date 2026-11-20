/**
 * 通用列表筛选器。
 * 约定：
 *   容器 [data-filter-root]
 *   输入 [data-filter-search]
 *   下拉 [data-filter-select] + data-filter-key="type|jur|letter"
 *   标签按钮 [data-filter-chip] + data-filter-key + data-value
 *   卡片 [data-filter-item] + data-type / data-jur / data-tags / data-text
 *   计数 [data-result-count]
 */

function normalize(value) {
  return String(value || '').toLowerCase();
}

export function initFilters(root = document) {
  const containers = [...root.querySelectorAll('[data-filter-root]')];
  containers.forEach(setupContainer);
}

function setupContainer(container) {
  const items = [...container.querySelectorAll('[data-filter-item]')];
  if (!items.length) return;

  const searchInput = container.querySelector('[data-filter-search]');
  const selects = [...container.querySelectorAll('[data-filter-select]')];
  const chips = [...container.querySelectorAll('[data-filter-chip]')];
  const countEl = container.querySelector('[data-result-count]');
  const emptyEl = container.querySelector('[data-empty-state]');
  const emptyQuery = emptyEl ? emptyEl.querySelector('[data-empty-query]') : null;

  const state = {
    text: new URLSearchParams(window.location.search).get('q') || '',
    type: '',
    jur: '',
    letter: '',
    tag: ''
  };

  // 初始化标签：支持 ?tag= 直达
  const initialTag = new URLSearchParams(window.location.search).get('tag');
  if (initialTag) {
    const chip = chips.find((c) => c.dataset.value === initialTag);
    if (chip) {
      state.tag = initialTag;
      chip.classList.add('is-active');
    }
  }

  if (searchInput) {
    searchInput.value = state.text;
    searchInput.addEventListener('input', () => {
      state.text = searchInput.value;
      apply();
    });
  }

  selects.forEach((select) => {
    select.addEventListener('change', () => {
      const key = select.dataset.filterKey || 'type';
      state[key] = select.value;
      apply();
    });
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filterKey || 'tag';
      const value = chip.dataset.value || '';
      if (key === 'tag') {
        const isSame = state.tag === value;
        chips.forEach((c) => {
          if ((c.dataset.filterKey || 'tag') === 'tag') c.classList.remove('is-active');
        });
        state.tag = isSame ? '' : value;
        if (!isSame) chip.classList.add('is-active');
      }
      apply();
    });
  });

  function matches(item) {
    if (state.text) {
      const haystack = normalize(item.dataset.text);
      const terms = state.text.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    if (state.type && (item.dataset.type || '') !== state.type) return false;
    if (state.jur && !normalize(item.dataset.jur).includes(state.jur.toLowerCase())) return false;
    if (state.letter && (item.dataset.letter || '') !== state.letter) return false;
    if (state.tag) {
      const tags = (item.dataset.tags || '').split('|');
      if (!tags.includes(state.tag)) return false;
    }
    return true;
  }

  function apply() {
    let visible = 0;
    items.forEach((item) => {
      const show = matches(item);
      item.hidden = !show;
      if (show) visible += 1;
    });
    if (countEl) countEl.textContent = `共 ${visible} 条`;
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (emptyQuery && visible === 0) {
      emptyQuery.textContent = state.text ? `「${state.text}」` : '当前筛选条件';
    }
  }

  apply();
}