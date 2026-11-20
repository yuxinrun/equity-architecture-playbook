import { copyText, flashButton } from './store.js';

document.querySelectorAll('.term-card').forEach((card) => {
  const actions = document.createElement('div');
  actions.className = 'quote-actions';
  actions.style.marginTop = '14px';
  actions.innerHTML = '<button class="quote-btn" type="button">复制词条</button>';
  const button = actions.querySelector('button');
  button.addEventListener('click', async () => {
    const text = [
      card.querySelector('.term-name')?.textContent.trim() || '',
      card.querySelector('.term-en')?.textContent.trim() || '',
      card.querySelector('.term-def')?.textContent.trim() || '',
      card.querySelector('.term-misuse')?.textContent.trim() || ''
    ].filter(Boolean).join('\n');
    const ok = await copyText(text);
    flashButton(button, ok ? '已复制' : '复制失败');
  });
  card.appendChild(actions);
});
