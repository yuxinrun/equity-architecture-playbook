import { copyText, flashButton, sitePath, store } from './store.js';

const body = document.body;
const articlePath = body.dataset.articlePath;
const articleTitle = body.dataset.articleTitle || document.title;
const articleCategory = body.dataset.articleCategory || '';

/* 阅读进度 */
function initProgress() {
  const bar = document.querySelector('[data-reading-progress] span');
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.width = `${(ratio * 100).toFixed(1)}%`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* 目录高亮 */
function initTocHighlight() {
  const links = [...document.querySelectorAll('.toc-link')];
  if (!links.length) return;
  const map = new Map();
  links.forEach((link) => {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const heading = document.getElementById(id);
    if (heading) map.set(heading, link);
  });
  const headings = [...map.keys()];
  if (!headings.length) return;

  let active = null;
  const setActive = (link) => {
    if (active === link) return;
    if (active) active.classList.remove('is-active');
    active = link;
    if (active) active.classList.add('is-active');
  };

  const update = () => {
    const offset = window.innerHeight * 0.32;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= offset) current = heading;
      else break;
    }
    setActive(map.get(current));
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* 收藏 */
function initBookmark() {
  const buttons = [...document.querySelectorAll('[data-bookmark]')];
  if (!buttons.length || !articlePath) return;

  const render = () => {
    const saved = store.isBookmarked(articlePath);
    buttons.forEach((button) => {
      button.classList.toggle('is-active', saved);
      button.setAttribute('aria-pressed', String(saved));
      const label = button.querySelector('[data-bookmark-label]');
      if (label) label.textContent = saved ? '已收藏' : '收藏本文';
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      store.toggleBookmark({ path: articlePath, title: articleTitle, category: articleCategory });
      render();
    });
  });

  render();
}

/* 复制链接 */
function initCopyLink() {
  const button = document.querySelector('[data-copy-link]');
  if (!button) return;
  button.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    const ok = await copyText(url);
    const label = button.querySelector('[data-copy-label]');
    if (!label) return;
    const original = label.textContent;
    label.textContent = ok ? '链接已复制' : '复制失败';
    window.setTimeout(() => {
      label.textContent = original;
    }, 1600);
  });
}

/* 记录最近阅读 */
function initRecent() {
  if (!articlePath) return;
  store.addRecent({
    path: articlePath,
    title: articleTitle,
    category: articleCategory
  });
}

/* 打印 */
function initPrint() {
  document.querySelectorAll('[data-print]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });
}

/* 提示条关闭（如有） */
function initFlash() {
  document.querySelectorAll('[data-flash]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.flash);
      if (target) target.hidden = true;
    });
  });
}

initProgress();
initTocHighlight();
initBookmark();
initCopyLink();
initRecent();
initPrint();
initFlash();

/* 供其他脚本复用 */
export { sitePath, flashButton };