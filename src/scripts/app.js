import { initSearchDialog } from './search.js';

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('primary-nav');
  const scrim = document.querySelector('[data-nav-scrim]');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    if (open) {
      document.body.classList.add('no-scroll');
      window.dispatchEvent(new Event('eap:close-search'));
    } else if (document.querySelector('[data-search-overlay]')?.hidden !== false) {
      document.body.classList.remove('no-scroll');
    }
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    if (scrim) scrim.hidden = !open;
  };

  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  window.addEventListener('eap:close-nav', () => setOpen(false));
  if (scrim) scrim.addEventListener('click', () => setOpen(false));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1240 && document.body.classList.contains('nav-open')) setOpen(false);
  });
}

function initHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initToTop() {
  const button = document.querySelector('[data-to-top]');
  if (!button) return;
  const update = () => {
    const shouldShow = window.scrollY > 700;
    button.hidden = !shouldShow;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy-text]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copyText;
      try {
        await navigator.clipboard.writeText(text);
        button.dataset.originalLabel = button.dataset.originalLabel || button.textContent.trim();
        button.textContent = '已复制';
        window.setTimeout(() => {
          button.textContent = button.dataset.originalLabel;
        }, 1500);
      } catch {
        button.textContent = '复制失败';
      }
    });
  });
}

initNav();
initHeader();
initToTop();
initSearchDialog();
initCopyButtons();