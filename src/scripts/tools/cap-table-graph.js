import { getRoot, panel, section, input, field, esc, num, bindCommon } from './shared.js';
import { downloadSvg } from '../store.js';

const root = getRoot('cap-table-graph');
if (root) {
  const defaults = {
    nodes: [
      { id: 'company', name: '目标公司', type: 'company', parent: '', pct: 100 },
      { id: 'founder', name: '创始团队', type: 'shareholder', parent: 'company', pct: 55 },
      { id: 'investor', name: '投资人', type: 'shareholder', parent: 'company', pct: 25 },
      { id: 'esop', name: '员工持股平台', type: 'platform', parent: 'company', pct: 20 },
      { id: 'employee', name: '核心员工', type: 'shareholder', parent: 'esop', pct: 100 }
    ]
  };
  let state = structuredClone(defaults);
  let svgEl = null;

  const typeLabel = { company: '公司实体', shareholder: '股东', platform: '持股平台' };

  function buildSvg() {
    const nodes = state.nodes;
    const rootNode = nodes.find((n) => n.type === 'company') || nodes[0];
    const childrenOf = (id) => nodes.filter((n) => n.parent === id);
    const depth1 = childrenOf(rootNode.id);
    const depth2 = depth1.flatMap((n) => childrenOf(n.id));
    const positions = new Map();
    positions.set(rootNode.id, { x: 480, y: 90 });
    depth1.forEach((n, i) => positions.set(n.id, { x: 170 + i * (620 / Math.max(1, depth1.length - 1 || 1)), y: 240 }));
    depth2.forEach((n, i) => positions.set(n.id, { x: 170 + i * (620 / Math.max(1, depth2.length - 1 || 1)), y: 400 }));

    const edges = nodes.filter((n) => n.parent && positions.has(n.parent) && positions.has(n.id)).map((n) => {
      const p = positions.get(n.parent);
      const c = positions.get(n.id);
      const color = n.type === 'platform' ? '#168A82' : '#18324B';
      return `<path d="M ${p.x} ${p.y + 34} L ${c.x} ${c.y - 34}" fill="none" stroke="${color}" stroke-width="1.8" marker-end="url(#garrow)"/><text x="${(p.x + c.x) / 2}" y="${(p.y + c.y) / 2}" fill="#657080" font-size="12" text-anchor="middle">${esc(n.pct)}%</text>`;
    }).join('');

    const shapes = nodes.filter((n) => positions.has(n.id)).map((n) => {
      const p = positions.get(n.id);
      const fill = n.type === 'company' ? '#18324B' : n.type === 'platform' ? '#168A82' : '#FFFFFF';
      const textFill = n.type === 'company' || n.type === 'platform' ? '#FFFFFF' : '#202733';
      const w = Math.max(120, String(n.name).length * 15 + 28);
      return `<g><rect x="${p.x - w / 2}" y="${p.y - 34}" width="${w}" height="68" rx="10" fill="${fill}" stroke="${fill === '#FFFFFF' ? '#8FA3B3' : fill}"/><text x="${p.x}" y="${p.y - 4}" fill="${textFill}" font-size="14" font-weight="600" text-anchor="middle">${esc(n.name)}</text><text x="${p.x}" y="${p.y + 16}" fill="${textFill}" font-size="11" text-anchor="middle">${typeLabel[n.type] || n.type}</text></g>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" role="img" aria-labelledby="gtitle gdesc" id="cap-svg">
      <title id="gtitle">用户生成的股权结构示意图</title><desc id="gdesc">由本地输入生成，不上传服务器。</desc>
      <defs><marker id="garrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#18324B"/></marker></defs>
      <rect width="960" height="520" fill="#F6F7F8"/><rect x="20" y="20" width="920" height="480" rx="14" fill="#FFFFFF" stroke="#E2E7EB"/>
      <text x="40" y="56" fill="#18324B" font-size="20" font-weight="700">股权结构示意图（教学模型）</text>
      ${edges}${shapes}
      <text x="920" y="486" fill="#657080" font-size="11" text-anchor="end">比例为用户输入，不代表登记或法律权属证明</text>
    </svg>`;
  }

  function render() {
    const form = panel('本地输入', `
      ${state.nodes.map((n, i) => `<div class="scenario-card" style="margin-bottom:10px">
        <div class="field-row"><div class="field"><label>名称</label><input class="input" data-n="name" data-i="${i}" value="${esc(n.name)}"></div>
        <div class="field"><label>类型</label><select class="select" data-n="type" data-i="${i}">${Object.entries(typeLabel).map(([v, l]) => `<option value="${v}"${n.type === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div class="field-row"><div class="field"><label>上级节点</label><select class="select" data-n="parent" data-i="${i}"><option value="">无</option>${state.nodes.filter((x) => x.id !== n.id).map((x) => `<option value="${esc(x.id)}"${n.parent === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label>比例 %</label><input class="input" type="number" min="0" max="100" step="0.01" data-n="pct" data-i="${i}" value="${esc(n.pct)}"></div></div>
        <button class="quote-btn" type="button" data-remove-node="${i}">删除节点</button>
      </div>`).join('')}
      <button class="btn btn-ghost" type="button" id="add-node">添加节点</button>
      <p class="field-hint" style="margin-top:12px">所有输入只保存在当前浏览器页面，不会上传。结构图只展示两层关系。</p>
    `, '<button class="btn btn-ghost" type="button" data-reset>重置</button><button class="btn btn-ghost" type="button" data-example>加载示例</button>');

    const preview = section('结构图预览', `<div class="chart-box" id="graph-preview">${buildSvg()}</div>`, '本地 SVG');
    const actions = `<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-primary" type="button" id="export-svg">导出 SVG</button><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div>`;
    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${preview}${actions}</div></div>`;
    svgEl = root.querySelector('#cap-svg');

    root.querySelectorAll('[data-n]').forEach((el) => el.addEventListener('input', () => {
      const node = state.nodes[Number(el.dataset.i)];
      const key = el.dataset.n;
      node[key] = key === 'pct' ? num(el.value) : el.value;
      render();
    }));
    root.querySelectorAll('[data-remove-node]').forEach((btn) => btn.addEventListener('click', () => {
      state.nodes.splice(Number(btn.dataset.removeNode), 1);
      render();
    }));
    root.querySelector('#add-node')?.addEventListener('click', () => {
      state.nodes.push({ id: `n${Date.now()}`, name: '新节点', type: 'shareholder', parent: state.nodes[0]?.id || '', pct: 0 });
      render();
    });
    root.querySelector('#export-svg')?.addEventListener('click', () => {
      if (svgEl) downloadSvg('cap-table-structure.svg', svgEl);
    });
    bindCommon(root, {
      onReset: () => { state = structuredClone(defaults); render(); },
      onExample: () => { state = structuredClone(defaults); render(); }
    });
  }

  render();
}
