import { getRoot, panel, section, esc, bindCommon } from './shared.js';

const root = getRoot('structure-checklist');
if (root) {
  const groups = [
    { id: 'stage', title: '业务阶段', items: [['seed', '仍处于小团队验证阶段'], ['growth', '进入快速增长与招聘阶段'], ['profit', '稳定盈利、暂不融资']] },
    { id: 'shareholders', title: '股东与激励', items: [['multi-founders', '存在两位以上创始人'], ['esop', '需要员工长期激励'], ['platform', '正在考虑持股平台']] },
    { id: 'capital', title: '资本与业务', items: [['fundraising', '计划未来 24 个月内融资'], ['cross-border', '存在跨境业务或投资人'], ['risk-isolation', '有业务风险隔离需求'], ['ip', '核心知识产权需要专门安排']] }
  ];
  const questions = {
    seed: ['当前职责是否已经写清？', '创始股权是否有归属与退出规则？', '是否需要在早期预留激励空间？'],
    growth: ['完全稀释口径是否统一？', '激励池规模是否由招聘计划倒推？', '重大事项授权清单是否需要更新？'],
    profit: ['分红政策与再投资比例如何决定？', '股东退出与继承规则是否已经约定？', '公司资金与股东个人资金是否严格分开？'],
    'multi-founders': ['角色、投入与贡献是否有书面记录？', '僵局机制是否存在且可执行？'],
    esop: ['激励工具、归属与离职处理是否已明确？', '员工能否理解授予文件的核心条款？'],
    platform: ['平台的治理、信息权与退出规则是否完整？', '平台设立地规则是否已由专业人士核验？'],
    fundraising: ['投前投后与期权池口径是否统一？', '历史 cap table 是否按事件顺序重算？'],
    'cross-border': ['涉及哪些法域？', '资金流、外汇登记与受益所有人披露如何核验？'],
    'risk-isolation': ['业务边界、合同主体与资金流是否真实分离？', '多主体是否带来新的关联交易？'],
    ip: ['核心知识产权的权利人与登记状态是否清楚？', '实际使用主体是否有书面许可？']
  };
  let state = {};

  function render() {
    const form = panel('勾选当前情况', groups.map((g) => `<fieldset class="field-group"><legend>${esc(g.title)}</legend>${g.items.map(([id, label]) => `<label class="check-row"><input type="checkbox" data-check="${id}" ${state[id] ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}</fieldset>`).join(''));

    const selected = Object.keys(state).filter((k) => state[k]);
    const list = selected.length
      ? [...new Set(selected.flatMap((id) => questions[id] || []))].map((q, i) => `<li>${i + 1}. ${esc(q)}</li>`).join('')
      : '<li>请先勾选左侧情况，工具会列出应进一步研究的问题。</li>';

    const output = section('需要进一步研究的问题', `<ol class="compact-list" style="border-top:0">${list}</ol>
      <div class="formula-box">本工具只提示研究方向，不推荐具体公司类型、注册地或法律架构，也不生成法律结论。</div>`);

    root.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:24px;align-items:start">${form}<div>${output}<div class="tool-section"><div class="form-actions" style="margin:0;padding:0;border:0"><button class="btn btn-ghost" type="button" data-print>打印本页</button></div></div></div></div>`;

    root.querySelectorAll('[data-check]').forEach((el) => el.addEventListener('change', () => {
      state[el.dataset.check] = el.checked;
      render();
    }));
    bindCommon(root, {
      onReset: () => { state = {}; render(); },
      onExample: () => { state = { growth: true, esop: true, fundraising: true, 'risk-isolation': true }; render(); }
    });
  }

  render();
}
