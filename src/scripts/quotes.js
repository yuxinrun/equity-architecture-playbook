import { copyText, flashButton, store, downloadSvg } from './store.js';

function shareCard(text, source, topic) {
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const lines = [];
  const max = 18;
  for (let i = 0; i < text.length; i += max) lines.push(text.slice(i, i + max));
  const body = lines.slice(0, 5).map((line, i) => `<text x="60" y="${210 + i * 46}" fill="#202733" font-size="24" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif">${esc(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="金句分享卡片">
    <rect width="800" height="520" rx="20" fill="#F6F7F8"/><rect x="24" y="24" width="752" height="472" rx="16" fill="#FFFFFF" stroke="#E2E7EB"/>
    <rect x="24" y="24" width="752" height="8" rx="4" fill="#18324B"/>
    <text x="60" y="92" fill="#168A82" font-size="16" font-family="sans-serif" letter-spacing="3">EQUITY ARCHITECTURE PLAYBOOK</text>
    <text x="60" y="150" fill="#657080" font-size="15" font-family="sans-serif">${esc(topic)}</text>
    ${body}
    <line x1="60" y1="450" x2="740" y2="450" stroke="#E2E7EB"/>
    <text x="60" y="480" fill="#657080" font-size="15" font-family="sans-serif">${esc(source)}</text>
    <text x="740" y="480" fill="#18324B" font-size="14" font-family="sans-serif" text-anchor="end">公司架构与股权设计</text>
  </svg>`;
}

document.querySelectorAll('.quote-card').forEach((card) => {
  const id = card.querySelector('[data-quote]')?.dataset.quote;
  const text = card.querySelector('.quote-text')?.textContent.trim() || '';
  const source = card.querySelector('.quote-source')?.textContent.replace(/^—\s*/, '').trim() || '';
  const topic = card.querySelector('.quote-topic')?.textContent.trim() || '';

  const share = document.createElement('button');
  share.className = 'quote-btn';
  share.type = 'button';
  share.textContent = '生成分享卡片';
  share.addEventListener('click', () => {
    const svg = new DOMParser().parseFromString(shareCard(text, source, topic), 'image/svg+xml').documentElement;
    downloadSvg(`quote-${id || 'card'}.svg`, svg);
  });
  card.querySelector('.quote-actions')?.appendChild(share);

  const bookmark = card.querySelector('[data-quote]');
  if (bookmark) {
    const render = () => {
      const saved = store.hasQuote(id);
      bookmark.textContent = saved ? '已收藏' : '收藏';
      bookmark.setAttribute('aria-pressed', String(saved));
    };
    bookmark.addEventListener('click', () => { store.toggleQuote(id); render(); });
    render();
  }
});
