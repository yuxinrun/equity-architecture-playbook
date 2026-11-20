import { getRoot, panel, section, select, field, esc, bindCommon } from './shared.js';
import { downloadCsv } from '../store.js';

const root = getRoot('governance-matrix');
if (root) {
  const roles = ['股东会', '董事会', '经理层', '特定股东'];
  const matters = ['信息获取', '董事提名', '重大事项表决', '预算审批', '重大交易', '日常经营'];
  const options = [['decide', '决定'], ['propose', '提议'], ['execute', '执行'], ['supervise', '监督'], ['inform', '知情'], ['veto', '否决'], ['recuse', '回避'], ['none', '—']];
  const defaults = {
    '股东会|信息获取': 'inform', '股东会|董事提名': 'decide', '股东会|重大事项表决': 'decide', '股东会|预算审批': 'inform', '股东会|重大交易': 'decide', '股东会|日常经营': 'none',
    '董事会|信息获取': 'inform', '董事会|董事提名': 'propose', '董事会|重大事项表决': 'propose', '董事会|预算审批': 'decide', '董事会|重大交易': 'propose', '董事会|日常经营': 'supervise',
    '经理层|信息获取': 'decide', '经理层|董事提名': 'none', '经理层|重大事项表决': 'execute', '经理层|预算审批': 'execute', '经理层|重大交易': 'execute', '经理层|日常经营': 'decide',
    '特定股东|信息获取': 'inform', '特定股东|董事提名': 'veto', '特定股东|重大事项表决': 'veto', '特定股东|预算审批': 'none', '特定股东|重大交易': 'veto', '特定股东|日常经营': 'none'
  };
  let state = { ...defaults };

  function render() {
    const form = panel('使用说明', `
      <p class="field-hint">矩阵中的角色由用户自行填写，默认标注仅供讨论参照。每个单元格都可修改。</p>
      ${field('角色数量', `<input class="input" value="4" disabled>`, '固定为四类常见角色。')}
      <p class="field-hint">请按适用法域、章程和协议核对法定表决要求。此工具不判断任何安排是否有效。</p>
    `, '<button class="btn btn-ghost" type="button" data-reset>重置</button><button class="btn btn-ghost" type="button" data-example>加载示例</button>');

    const rows = roles.map((role) => `<tr><th scope="row">${esc(role)}</th>${matters.map((m) => {
      const key = `${role}|${m}`;
      return `<td>${select(`cell-${roles.indexOf(role)}-${matters.indexOf(m)}`, options, state[key]).replace('class="select"', `class="select" data-cell="${esc(key)}"`)}</td>`;
    }).join('')}</tr>`).join('');

    const matrix = section('控制权与治理矩阵', `<div class="table-scroll"><table class="data-table" style="min-width:860px"><thead><tr><th>角色 / 事项</th>${matters.map((m) => `<th scope="col">${esc(m)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <div class="formula-box">标注只表达讨论中的角色定位，不改变法定职权。导出 CSV 后请与章程、股东协议和内部授权制度逐项核对。</div>`);

    const legend = section('标注图例', `<div class="scenario-grid">${options.map(([v, l]) => `<div class="scenario-card"><strong>${esc(l)}</strong><p class="field-hint" style="margin-top:6px">${esc(v)}</p></div>`).join('')}</div>`);

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${matrix}${legend}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-primary" type="button" id="export-matrix">导出 CSV</button><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div></div></div>`;

    root.querySelectorAll('[data-cell]').forEach((el) => el.addEventListener('change', () => {
      state[el.dataset.cell] = el.value;
    }));
    root.querySelector('#export-matrix')?.addEventListener('click', () => {
      downloadCsv('governance-matrix.csv', [
        ['角色', ...matters],
        ...roles.map((role) => [role, ...matters.map((m) => {
          const label = options.find(([v]) => v === state[`${role}|${m}`]);
          return label ? label[1] : '—';
        })])
      ]);
    });
    bindCommon(root, {
      onReset: () => { state = { ...defaults }; render(); },
      onExample: () => { state = { ...defaults }; render(); }
    });
  }

  render();
}
