import { copyText, flashButton, downloadCsv } from './store.js';

const items = [...document.querySelectorAll('.book-item')];
if (!items.length) {
  // 书单页空状态时仍提供导出按钮，避免无功能占位。
}

const toolbar = document.createElement('div');
toolbar.className = 'form-actions';
toolbar.style.marginTop = '18px';
toolbar.innerHTML = '<button class="btn btn-ghost" type="button" id="export-books">导出书单 CSV</button>';
document.querySelector('.page-books .container[data-filter-root]')?.appendChild(toolbar);

items.forEach((item) => {
  const actions = document.createElement('div');
  actions.className = 'quote-actions';
  actions.style.marginTop = '14px';
  actions.innerHTML = '<button class="quote-btn" type="button">复制书目信息</button>';
  const button = actions.querySelector('button');
  button.addEventListener('click', async () => {
    const text = [
      item.querySelector('.book-title')?.textContent.trim() || '',
      item.querySelector('.book-meta')?.textContent.trim() || '',
      item.querySelector('.book-body > p:not(.book-topic):not(.book-meta)')?.textContent.trim() || ''
    ].filter(Boolean).join('\n');
    const ok = await copyText(text);
    flashButton(button, ok ? '已复制' : '复制失败');
  });
  item.querySelector('.book-body')?.appendChild(actions);
});

document.getElementById('export-books')?.addEventListener('click', () => {
  const rows = [['主题', '书名', '原书名', '作者', '出版方', '年份', '概览', '局限']];
  items.forEach((item) => {
    rows.push([
      item.querySelector('.book-topic')?.textContent.trim() || '',
      item.querySelector('.book-title')?.childNodes[0]?.textContent.trim() || '',
      item.querySelector('.book-title-en')?.textContent.trim() || '',
      item.querySelector('.book-meta')?.textContent.split('·')[0]?.trim() || '',
      item.querySelector('.book-meta')?.textContent.split('·')[1]?.trim() || '',
      item.querySelector('.book-meta')?.textContent.split('·')[2]?.trim() || '',
      item.querySelector('.book-body > p:not(.book-topic):not(.book-meta)')?.textContent.trim() || '',
      item.querySelector('.book-limits')?.textContent.replace(/^阅读注意[：:]?/, '').trim() || ''
    ]);
  });
  downloadCsv('equity-reading-list.csv', rows);
});
