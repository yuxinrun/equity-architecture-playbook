export const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

export function getRoot(expectedSlug) {
  const root = document.querySelector(`[data-tool="${expectedSlug}"]`);
  if (!root) return null;
  root.classList.remove('tool-layout');
  root.classList.add('tool-canvas');
  root.innerHTML = '';
  return root;
}

export function field(label, control, hint = '') {
  return `<div class="field"><label>${esc(label)}</label>${control}${hint ? `<p class="field-hint">${esc(hint)}</p>` : ''}</div>`;
}

export function input(id, value, options = {}) {
  const type = options.type || 'number';
  const attrs = [
    `id="${esc(id)}"`,
    `type="${type}"`,
    `value="${esc(value)}"`
  ];
  if (options.min !== undefined) attrs.push(`min="${options.min}"`);
  if (options.max !== undefined) attrs.push(`max="${options.max}"`);
  if (options.step !== undefined) attrs.push(`step="${options.step}"`);
  if (options.placeholder) attrs.push(`placeholder="${esc(options.placeholder)}"`);
  return `<input class="input" ${attrs.join(' ')}>`;
}

export function select(id, options, value = '') {
  return `<select class="select" id="${esc(id)}">${options.map(([v, label]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
}

export function panel(title, content, actions = '') {
  return `<aside class="tool-panel"><p class="tool-panel-title">${esc(title)}</p>${content}<div class="form-actions">${actions || '<button class="btn btn-ghost" type="button" data-reset>重置</button><button class="btn btn-ghost" type="button" data-example>加载示例</button>'}</div></aside>`;
}

export function section(title, body, note = '') {
  return `<section class="tool-section"><div class="tool-section-title"><h2>${esc(title)}</h2>${note ? `<p>${esc(note)}</p>` : ''}</div>${body}</section>`;
}

export function kpi(label, value, note = '', accent = false) {
  return `<div class="kpi${accent ? ' is-accent' : ''}"><p class="kpi-label">${esc(label)}</p><p class="kpi-value">${esc(value)}</p>${note ? `<p class="kpi-note">${esc(note)}</p>` : ''}</div>`;
}

export function table(headers, rows, className = '') {
  return `<div class="table-scroll"><table class="data-table ${className}"><thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

export function actionButtons(extra = '') {
  return `${extra}<button class="btn btn-ghost" type="button" data-print>打印本页</button>`;
}

export function bindCommon(root, { onReset, onExample, onPrint }) {
  root.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', onReset));
  root.querySelectorAll('[data-example]').forEach((btn) => btn.addEventListener('click', onExample));
  root.querySelectorAll('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));
  if (onPrint) onPrint();
}

export function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function pct(value, digits = 2) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : '—';
}
