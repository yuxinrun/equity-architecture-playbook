import { getRoot, panel, section, input, field, table, kpi, num, pct, bindCommon } from './shared.js';

const root = getRoot('vesting-timeline');
if (root) {
  const defaults = { grant: 1000000, years: 4, cliff: 1, frequency: 12 };
  let state = { ...defaults };

  function schedule() {
    const years = Math.max(0.1, num(state.years, 4));
    const cliff = Math.min(years, Math.max(0, num(state.cliff)));
    const freq = Math.max(1, num(state.frequency, 12));
    const totalMonths = Math.round(years * 12);
    const cliffMonths = Math.round(cliff * 12);
    const events = [];
    if (cliffMonths > 0) events.push({ month: cliffMonths, vested: cliff / years, label: 'Cliff 归属' });
    const remainingMonths = totalMonths - cliffMonths;
    const periods = Math.max(1, Math.round(remainingMonths / (12 / freq)));
    for (let i = 1; i <= periods; i += 1) {
      const month = cliffMonths + Math.round((remainingMonths / periods) * i);
      events.push({ month, vested: Math.min(1, cliff / years + (1 - cliff / years) * (i / periods)), label: `第 ${i} 期归属` });
    }
    return { events, totalMonths, cliffMonths };
  }

  function render() {
    const { events, totalMonths, cliffMonths } = schedule();
    const last = events[events.length - 1] || { vested: 0, month: 0, label: '—' };
    const form = panel('授予参数', `
      ${field('授予数量', input('grant', state.grant, { min: 0, step: 10000 }))}
      ${field('归属期限（年）', input('years', state.years, { min: 0.5, max: 10, step: 0.5 }))}
      ${field('Cliff（年）', input('cliff', state.cliff, { min: 0, max: 10, step: 0.25 }), '到达节点前归属 0；到达时一次性归属对应期间。')}
      ${field('归属频率（次 / 年）', input('frequency', state.frequency, { min: 1, max: 12, step: 1 }))}
    `);

    const bars = events.slice(0, 18).map((e) => `
      <div class="bar-item"><span class="bar-name">第 ${(e.month / 12).toFixed(2)} 年</span><span class="bar-track"><span class="bar-fill" style="width:${(e.vested * 100).toFixed(1)}%"></span></span><span class="bar-value">${pct(e.vested, 1)}</span></div>
    `).join('');

    const kpis = section('归属概览', `
      <div class="kpi-row">
        ${kpi('授予数量', num(state.grant).toLocaleString('zh-CN'), '名义数量')}
        ${kpi('Cliff 节点', `${(cliffMonths / 12).toFixed(2)} 年`, '')}
        ${kpi('最终归属比例', pct(last.vested, 1), '模型上限 100%', true)}
      </div>
      <div class="bar-list">${bars}</div>
      <div class="formula-box">本工具只演示归属时间线，不等于实际可行权数量、税后收益、可售出数量或法律权利。离职、加速、回购与税务均未纳入。</div>
    `);

    const rows = events.map((e) => `<tr><td>${(e.month / 12).toFixed(2)}</td><td>${e.label}</td><td class="num">${Math.round(num(state.grant) * e.vested).toLocaleString('zh-CN')}</td><td class="num">${pct(e.vested, 2)}</td></tr>`);
    const tableSection = section('归属事件表', table(['时间（年）', '事件', '累计归属数量', '累计比例'], rows));

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
