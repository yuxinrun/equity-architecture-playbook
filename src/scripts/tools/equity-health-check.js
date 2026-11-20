import { getRoot, panel, section, esc, bindCommon } from './shared.js';

const root = getRoot('equity-health-check');
if (root) {
  const groups = [
    { title: '主体与出资', items: ['股东身份与主体信息已核对', '出资形式、金额与期限已写明', '出资凭证与登记信息一致'] },
    { title: '权利与决策', items: ['表决权口径已明确', '董事提名与任免程序已明确', '重大事项清单已列明', '信息权与报告频率已约定'] },
    { title: '变动与退出', items: ['股权转让限制与优先购买权已约定', '离职与失能处理规则已写明', '回购或退出定价机制可执行', '僵局与争议解决路径已约定'] },
    { title: '资产与文件', items: ['知识产权权属已核对', '章程、协议与内部制度一致', '版本与签署文件已归档'] }
  ];
  const allItems = groups.flatMap((g) => g.items);
  let state = {};

  function render() {
    const checked = allItems.filter((item) => state[item]).length;
    const ratio = allItems.length ? checked / allItems.length : 0;
    const gaps = allItems.filter((item) => !state[item]);

    const form = panel('逐项核对', groups.map((g) => `<fieldset class="field-group"><legend>${esc(g.title)}</legend>${g.items.map((item) => `<label class="check-row"><input type="checkbox" data-item="${esc(item)}" ${state[item] ? 'checked' : ''}><span>${esc(item)}</span></label>`).join('')}</fieldset>`).join(''));

    const output = section('体检结果', `
      <div class="kpi-row">
        <div class="kpi"><p class="kpi-label">已明确条目</p><p class="kpi-value">${checked} / ${allItems.length}</p></div>
        <div class="kpi is-accent"><p class="kpi-label">完成度</p><p class="kpi-value">${(ratio * 100).toFixed(0)}%</p><p class="kpi-note">仅表示清单覆盖情况</p></div>
      </div>
      <div class="bar-item"><span class="bar-name">清单覆盖</span><span class="bar-track"><span class="bar-fill" style="width:${(ratio * 100).toFixed(1)}%"></span></span><span class="bar-value">${(ratio * 100).toFixed(0)}%</span></div>
      <h3 style="font-size:15px;margin-top:22px">尚未明确的缺口</h3>
      <ul class="compact-list">${gaps.length ? gaps.map((g) => `<li class="compact-item"><span class="compact-body"><span class="compact-title">${esc(g)}</span></span></li>`).join('') : '<li class="compact-item"><span class="compact-body"><span class="compact-title">清单条目均已勾选</span></span></li>'}</ul>
      <div class="formula-box">此结果只作为团队讨论起点，不是合规审查报告，也不评估法律风险或提供修正方案。</div>
    `);

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${output}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div></div></div>`;

    root.querySelectorAll('[data-item]').forEach((el) => el.addEventListener('change', () => {
      state[el.dataset.item] = el.checked;
      render();
    }));
    bindCommon(root, {
      onReset: () => { state = {}; render(); },
      onExample: () => { allItems.forEach((item, i) => { state[item] = i % 3 !== 0; }); render(); }
    });
  }

  render();
}
