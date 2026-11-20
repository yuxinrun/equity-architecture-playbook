import { getRoot, panel, section, input, field, table, kpi, esc, num, pct, bindCommon } from './shared.js';

const root = getRoot('dilution-calculator');
if (root) {
  const defaults = {
    holders: [
      { name: '创始人 A', pct: 50 },
      { name: '创始人 B', pct: 30 },
      { name: '早期员工', pct: 10 },
      { name: '天使投资人', pct: 10 }
    ],
    preMoney: 90000000,
    investment: 10000000,
    poolPct: 5
  };
  let state = structuredClone(defaults);

  function calc() {
    const sum = state.holders.reduce((s, h) => s + num(h.pct), 0);
    const investorPct = state.preMoney + state.investment > 0 ? state.investment / (state.preMoney + state.investment) : 0;
    const pool = Math.max(0, num(state.poolPct)) / 100;
    const available = Math.max(0, 1 - investorPct - pool);
    const rows = state.holders.map((h) => ({
      name: h.name,
      before: sum > 0 ? num(h.pct) / sum : 0,
      after: sum > 0 ? (num(h.pct) / sum) * available : 0
    }));
    return { sum, investorPct, pool, available, rows, postMoney: state.preMoney + state.investment };
  }

  function render() {
    const { sum, investorPct, pool, available, rows, postMoney } = calc();
    const form = panel('输入与假设', `
      ${field('融资前估值（元）', input('pre-money', state.preMoney, { min: 0, step: 1000000 }))}
      ${field('本轮新增投资（元）', input('investment', state.investment, { min: 0, step: 1000000 }))}
      ${field('期权池（投后占比 %）', input('pool-pct', state.poolPct, { min: 0, max: 50, step: 0.5 }), '按投后口径建模，稀释先由现有股东承担。')}
      <fieldset class="field-group"><legend>当前股东比例</legend>
        ${state.holders.map((h, i) => `<div class="field-row">
          <div class="field"><label>股东 ${i + 1}</label><input class="input" data-h="name" data-i="${i}" value="${esc(h.name)}"></div>
          <div class="field"><label>比例 %</label><input class="input" type="number" min="0" max="100" step="0.01" data-h="pct" data-i="${i}" value="${esc(h.pct)}"></div>
        </div>`).join('')}
        <button class="btn btn-ghost" type="button" id="add-holder">增加股东</button>
      </fieldset>
      <p class="field-hint">当前比例合计：${sum.toFixed(2)}%。工具会按输入比例归一化，但若合计不是 100%，请检查原始数据。</p>
    `);

    const kpis = section('计算结果', `
      <div class="kpi-row">
        ${kpi('投后估值', `${(postMoney / 100000000).toFixed(4)} 亿元`, '投前 + 本轮投资')}
        ${kpi('投资人理论比例', pct(investorPct), '投资额 ÷ 投后估值', true)}
        ${kpi('期权池比例', pct(pool), '按投后口径')}
        ${kpi('原股东合计', pct(available), '扣除投资人与期权池后')}
      </div>
      <div class="formula-box">投后估值 = 投前估值 + 新增投资<br>投资人比例 = 新增投资 ÷ 投后估值<br>原股东稀释后比例 = 原比例 ÷ 原合计 × (1 − 投资人比例 − 期权池比例)<br>本模型不包含清算优先权、反稀释、可转债、分层证券与分期交割。</div>
    `);

    const tableSection = section('稀释前后对照', table(
      ['股东', '融资前比例', '融资后比例', '变化'],
      [
        ...rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="num">${pct(r.before)}</td><td class="num">${pct(r.after)}</td><td class="num">${((r.after - r.before) * 100).toFixed(2)} pp</td></tr>`),
        `<tr class="is-emphasis"><td>本轮投资人</td><td class="num">—</td><td class="num">${pct(investorPct)}</td><td class="num">新增</td></tr>`,
        `<tr class="is-emphasis"><td>期权池</td><td class="num">—</td><td class="num">${pct(pool)}</td><td class="num">预留</td></tr>`
      ]
    ));

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${kpis}${tableSection}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div></div></div>`;

    const bind = (selector, key) => root.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('input', () => {
        if (el.dataset.h) {
          state.holders[Number(el.dataset.i)][key] = key === 'pct' ? num(el.value) : el.value;
        } else {
          state[key] = num(el.value);
        }
        render();
      });
    });
    bind('#pre-money', 'preMoney');
    bind('#investment', 'investment');
    bind('#pool-pct', 'poolPct');
    bind('[data-h="name"]', 'name');
    bind('[data-h="pct"]', 'pct');
    root.querySelector('#add-holder')?.addEventListener('click', () => {
      state.holders.push({ name: `股东 ${state.holders.length + 1}`, pct: 0 });
      render();
    });
    bindCommon(root, {
      onReset: () => { state = structuredClone(defaults); render(); },
      onExample: () => { state = structuredClone(defaults); render(); }
    });
  }

  render();
}
