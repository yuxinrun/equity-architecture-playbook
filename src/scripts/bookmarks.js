import { store, sitePath, formatTimestamp, copyText, flashButton } from './store.js';

const root = document.querySelector('[data-bookmarks-root]');
if (root) {
  const listEl = root.querySelector('[data-bookmarks-list]');
  const recentEl = root.querySelector('[data-recent-list]');

  function markup(items, emptyText) {
    if (!items.length) return `<p style="color:var(--ink-faint)">${emptyText}</p>`;
    return `<ul class="compact-list">${items.map((item) => `<li class="compact-item"><a href="${sitePath(item.path)}">
      <span class="compact-body"><span class="compact-title">${item.title || item.path}</span><span class="compact-meta">${item.category || ''} · ${formatTimestamp(item.savedAt || item.viewedAt)}</span></span>
    </a></li>`).join('')}</ul>`;
  }

  function render() {
    listEl.innerHTML = markup(store.bookmarks, '还没有收藏文章。');
    recentEl.innerHTML = markup(store.recent, '还没有最近阅读记录。');
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'form-actions';
  toolbar.innerHTML = '<button class="btn btn-ghost" type="button" id="copy-bookmarks">复制收藏链接</button><button class="btn btn-ghost" type="button" id="clear-bookmarks">清空收藏</button><button class="btn btn-ghost" type="button" id="clear-recent">清空最近阅读</button>';
  root.appendChild(toolbar);

  toolbar.querySelector('#copy-bookmarks').addEventListener('click', async (event) => {
    const text = store.bookmarks.map((b) => `${b.title || ''} ${window.location.origin}${sitePath(b.path)}`).join('\n');
    const ok = await copyText(text || '暂无收藏');
    flashButton(event.currentTarget, ok ? '已复制' : '复制失败');
  });
  toolbar.querySelector('#clear-bookmarks').addEventListener('click', () => { store.clearBookmarks(); render(); });
  toolbar.querySelector('#clear-recent').addEventListener('click', () => { store.clearRecent(); render(); });

  render();
}
