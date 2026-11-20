const NS = 'eap:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const store = {
  get bookmarks() {
    return read('bookmarks', []);
  },
  isBookmarked(path) {
    return this.bookmarks.some((item) => item.path === path);
  },
  toggleBookmark(entry) {
    const list = this.bookmarks;
    const index = list.findIndex((item) => item.path === entry.path);
    if (index >= 0) {
      list.splice(index, 1);
      write('bookmarks', list);
      return false;
    }
    list.unshift({ ...entry, savedAt: Date.now() });
    write('bookmarks', list.slice(0, 60));
    return true;
  },
  clearBookmarks() {
    write('bookmarks', []);
  },
  get recent() {
    return read('recent', []);
  },
  addRecent(entry) {
    const list = this.recent.filter((item) => item.path !== entry.path);
    list.unshift({ ...entry, viewedAt: Date.now() });
    write('recent', list.slice(0, 12));
  },
  clearRecent() {
    write('recent', []);
  },
  get quoteBookmarks() {
    return read('quote-bookmarks', []);
  },
  toggleQuote(id) {
    const list = this.quoteBookmarks;
    const index = list.indexOf(id);
    if (index >= 0) {
      list.splice(index, 1);
      write('quote-bookmarks', list);
      return false;
    }
    list.push(id);
    write('quote-bookmarks', list);
    return true;
  },
  hasQuote(id) {
    return this.quoteBookmarks.includes(id);
  }
};

export function siteBase() {
  return (document.body.dataset.base || '/').replace(/\/$/, '');
}

export function sitePath(path) {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return siteBase() + path;
}

export function formatTimestamp(ts) {
  const date = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }
}

export function flashButton(button, message = '已复制', duration = 1600) {
  const original = button.dataset.originalLabel || button.textContent.trim();
  button.dataset.originalLabel = original;
  button.textContent = message;
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, duration);
}

/** 支持导出 CSV（带 BOM，便于 Excel 打开中文） */
export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(',')
    )
    .join('\r\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(filename, svgElement) {
  const source = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: 'image/svg+xml;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}