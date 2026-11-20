/** 极简 frontmatter 解析：只支持本项目用到的 YAML 子集，避免引入依赖。 */

function parseScalar(raw) {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => parseScalar(item));
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === 'null' || value === '~') return null;
  return value;
}

export function parseFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) {
    return { data: {}, body: text.trim() };
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    return { data: {}, body: text.trim() };
  }
  const header = text.slice(4, end);
  let body = text.slice(end + 4);
  body = body.replace(/^\n/, '').trim();

  const data = {};
  const lines = header.split('\n');
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(parseScalar(listItem[1]));
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const [, key, rest] = match;
    if (!rest.trim()) {
      data[key] = [];
      currentKey = key;
      continue;
    }
    data[key] = parseScalar(rest);
    currentKey = key;
  }

  // 空数组且下一行不是列表项时，视为空字符串
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length === 0) data[key] = [];
  }

  return { data, body };
}