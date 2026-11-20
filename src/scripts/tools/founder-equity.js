import { getRoot, panel, section, input, field, table, esc, num, bindCommon } from './shared.js';
import { downloadCsv } from '../store.js';

const root = getRoot('founder-equity-workshop');
if (root) {
  const defaults = [
    { name: '创始人 A', role: '产品与技术', time: 40, cash: 500000, contribution: '完成核心原型与技术架构', future: '持续负责产品迭代', proposal: 40 },
    { name: '创始人 B', role: '市场与客户', time: 40, cash: 300000, contribution: '带来首批客户与渠道', future: '负责销售与增长', proposal: 35 },
    { name: '创始人 C', role: '运营与组织', time: 25, cash: 200000, contribution: '建立初期运营流程', future: '兼职负责财务与人事', proposal: 15 },
    { name: '未来激励与融资预留', role: '预留', time: 0, cash: 0, contribution: '为未来员工与融资留空间', future: '按完全稀释口径复核', proposal: 10 }
  ];
  let founders = structuredClone(defaults);

  function render() {
    const form = panel('输入与说明', `
      ${field('创始人人数（含预留项）', input('founder-count', founders.length, { min: 1, max: 10, step: 1 }), '可增加或删除行；预留项也计入讨论。')}
      <p class="field-hint">此工具不计算“公平比例”。表格中的数值是讨论记录，所有权重与建议比例由团队自行填写。</p>
      <button class="btn btn-ghost" type="button" id="add-founder">增加一行</button>
    `, '<button class="btn btn-ghost" type="button" data-reset>重置</button><button class="btn btn-ghost" type="button" data-example>加载示例</button>');

    const rows = founders.map((f, i) => `
      <tr>
        <td><input class="input" data-f="name" data-i="${i}" value="${esc(f.name)}"></td>
        <td><input class="input" data-f="role" data-i="${i}" value="${esc(f.role)}"></td>
        <td><input class="input" type="number" min="0" max="80" data-f="time" data-i="${i}" value="${esc(f.time)}"></td>
        <td><input class="input" type="number" min="0" step="10000" data-f="cash" data-i="${i}" value="${esc(f.cash)}"></td>
        <td><input class="input" data-f="contribution" data-i="${i}" value="${esc(f.contribution)}"></td>
        <td><input class="input" data-f="future" data-i="${i}" value="${esc(f.future)}"></td>
        <td><input class="input" type="number" min="0" max="100" step="0.5" data-f="proposal" data-i="${i}" value="${esc(f.proposal)}"></td>
        <td><button class="quote-btn" type="button" data-remove="${i}">删除</button></td>
      </tr>`).join('');

    const total = founders.reduce((sum, f) => sum + num(f.proposal), 0);
    const diff = 100 - total;
    const status = Math.abs(diff) < 0.01
      ? '<span class="badge badge-ok">合计 100%</span>'
      : `<span class="badge ${diff > 0 ? 'badge-warn' : 'badge-risk'}">还差 ${diff.toFixed(2)} 个百分点</span>`;

    const matrix = section('可编辑讨论矩阵', `
      <div class="table-scroll"><table class="data-table" style="min-width:1080px"><thead><tr>
        <th>成员 / 预留项</th><th>主要角色</th><th>每周投入小时</th><th>已投入资金</th><th>已交付贡献</th><th>未来责任</th><th>建议比例（%）</th><th>操作</th>
      </tr></thead><tbody>${rows}</tbody></table></div>
      <div class="formula-box">比例合计：${total.toFixed(2)}% ${status}<br>说明：工具不会把投入小时、资金或贡献文本换算成“正确比例”。</div>
    `, '所有字段均可修改');

    const scenarios = section('情景比较', `
      <div class="scenario-grid">
        ${founders.map((f) => `<div class="scenario-card"><h4>${esc(f.name)}</h4>
          <dl><dt>投入时间</dt><dd>${esc(f.time)} h/周</dd></dl>
          <dl><dt>已投入现金</dt><dd>${num(f.cash).toLocaleString('zh-CN')}</dd></dl>
          <dl><dt>团队建议比例</dt><dd>${num(f.proposal).toFixed(2)}%</dd></dl>
          <p class="field-hint" style="margin-top:10px">${esc(f.future || '待补充')}</p>
        </div>`).join('')}
      </div>
      <p class="field-hint" style="margin-top:14px">请分别讨论：若某人全职程度变化、若融资提前、若关键贡献未兑现，比例应如何调整。工具不替团队给出结论。</p>
    `, '由团队手动调整');

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:24px;align-items:start">
      ${form}<div>${matrix}${scenarios}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-ghost" type="button" id="export-founder">导出 CSV</button>${actionButtons()}</div></div></div></div>
    </div>`;

    root.querySelectorAll('[data-f]').forEach((el) => {
      el.addEventListener('input', () => {
        const i = Number(el.dataset.i);
        const key = el.dataset.f;
        founders[i][key] = ['time', 'cash', 'proposal'].includes(key) ? num(el.value) : el.value;
        render();
      });
    });
    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        founders.splice(Number(btn.dataset.remove), 1);
        render();
      });
    });
    document.getElementById('add-founder')?.addEventListener('click', () => {
      founders.push({ name: `创始人 ${founders.length + 1}`, role: '', time: 0, cash: 0, contribution: '', future: '', proposal: 0 });
      render();
    });
    document.getElementById('export-founder')?.addEventListener('click', () => {
      downloadCsv('founder-equity-discussion.csv', [
        ['成员', '角色', '每周投入小时', '已投入资金', '已交付贡献', '未来责任', '建议比例'],
        ...founders.map((f) => [f.name, f.role, f.time, f.cash, f.contribution, f.future, f.proposal])
      ]);
    });

    bindCommon(root, {
      onReset: () => { founders = structuredClone(defaults); render(); },
      onExample: () => { founders = structuredClone(defaults); render(); }
    });
  }

  render();
}

function actionButtons() {
  return '<button class="btn btn-ghost" type="button" data-print>打印本页</button>';
}
