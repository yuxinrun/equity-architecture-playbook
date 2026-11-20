import { getRoot, panel, section, input, field, table, kpi, num, pct, bindCommon } from './shared.js';

const root = getRoot('pre-post-money');
if (root) {
  const defaults = { pre: 90000000, investment: 10000000 };
  let state = { ...defaults };

  function result() {
    const post = state.pre + state.investment;
    const investor = post > 0 ? state.investment / post : 0;
    const existing = 1 - investor;
    return { post, investor, existing };
  }

  function render() {
    const { post, investor, existing } = result();
    const form = panel('输入', `
      ${field('投前估值（元）', input('pre', state.pre, { min: 0, step: 1000000 }))}
      ${field('本轮投资金额（元）', input('investment', state.investment, { min: 0, step: 1000000 }))}
      <p class="field-hint">所有金额按同一币种输入。工具不判断估值是否公允。</p>
    `);

    const kpis = section('换算结果', `
      <div class="kpi-row">
        ${kpi('投后估值', `${(post / 100000000).toFixed(4)} 亿元`, '投前 + 投资额', true)}
        ${kpi('投资人理论持股', pct(investor), '投资额 ÷ 投后估值')}
        ${kpi('原股东合计', pct(existing), '简化增资口径')}
      </div>
      <div class="formula-box">投后估值 = 投前估值 + 投资金额<br>投资人理论持股比例 = 投资金额 ÷ 投后估值<br>本结果不包含期权池、优先权、分期交割、可转债、反稀释与税费影响。</div>
    `);

    const tableSection = section('情景敏感性', table(
      ['情景', '投前估值', '投资额', '投后估值', '投资人比例'],
      [0.8, 1, 1.25].map((m) => {
        const pre = state.pre * m;
        const postValue = pre + state.investment;
        const ratio = postValue > 0 ? state.investment / postValue : 0;
        return `<tr><td>${m === 1 ? '基准' : `投前 × ${m}`}</td><td class="num">${(pre / 100000000).toFixed(2)} 亿</td><td class="num">${(state.investment / 100000000).toFixed(2)} 亿</td><td class="num">${(postValue / 100000000).toFixed(2)} 亿</td><td class="num">${pct(ratio)}</td></tr>`;
      })
    ));

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${kpis}${tableSection}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div></div></div>`;

    root.querySelectorAll('input').forEach((el) => {
      el.addEventListener('input', () => {
        state[el.id] = num(el.value);
        render();
      });
    });
    bindCommon(root, {
      onReset: () => { state = { ...defaults }; render(); },
      onExample: () => { state = { ...defaults }; render(); }
    });
  }

  render();
}
