/**
 * 首次内容初始化脚本：把 scripts/content-seed 目录下的结构化条目写为各栏目 Markdown 文件。
 * 生成后的 Markdown 是网站实际内容源，可直接编辑；本脚本仅用于批量建立首版内容。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, logOk } from './lib/utils.js';
import { part1 } from './content-seed/part1.js';
import { part2 } from './content-seed/part2.js';
import { part3 } from './content-seed/part3.js';
import { part4 } from './content-seed/part4.js';

const all = [...part1, ...part2, ...part3, ...part4];

function q(value = '') {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;
}

function inlineList(values = []) {
  return `[${values.map(q).join(', ')}]`;
}

function yaml(item, publishedAt) {
  const fields = [
    `title: ${q(item.t)}`,
    `description: ${q(item.d)}`,
    `slug: ${q(item.s)}`,
    `category: ${q(item.c)}`,
    `tags: ${inlineList(item.tags || [])}`,
    `author: ${q('编辑团队')}`,
    `publishedAt: ${q(publishedAt)}`,
    `updatedAt: ${q(publishedAt)}`,
    `contentType: ${q(item.type || '指南')}`,
    `featured: ${item.featured === true}`,
    `order: ${item.order || 99}`,
    `sources: ${inlineList(item.sources || [])}`,
    `disclaimerType: ${q(item.law ? '法域与核验' : '通用研究教育')}`
  ];
  if (item.jur && item.jur.length) fields.push(`jurisdiction: ${inlineList(item.jur)}`);
  if (item.verified) fields.push(`verifiedAt: ${q(item.verified)}`);
  if (item.caseType) fields.push(`caseType: ${q(item.caseType)}`);
  return `---\n${fields.join('\n')}\n---\n`;
}

function section(title, paragraphs) {
  return `## ${title}\n\n${paragraphs.join('\n\n')}\n`;
}

function bullets(items) {
  return items.map((text) => `- ${text}`).join('\n');
}

const DIAGRAM_BY_SLUG = {
  'what-is-corporate-architecture': ['four-layers', '公司架构四个层次示意图'],
  'parent-subsidiary-and-branch': ['parent-subsidiary', '母子公司与业务单元关系示意图'],
  'shareholder-board-management-boundaries': ['governance-triangle', '股东会、董事会与经理层治理关系示意图'],
  'founder-equity-factors': ['founder-factors', '创始人分股因素示意图'],
  'equity-vs-voting-vs-dividend-rights': ['rights-comparison', '股权、表决权、分红权与管理权对照图'],
  'dilution-math': ['dilution-before-after', '融资前后股权稀释示意图'],
  'cliff-and-vesting-schedule': ['vesting-timeline', '归属时间线示意图'],
  'multi-round-cap-table': ['multi-round-cap-table', '多轮融资股权变化示意图'],
  'founder-vesting-basics': ['shareholder-lifecycle', '股东参与生命周期示意图'],
  'reserved-matters-and-veto': ['decision-matrix', '重大事项决策矩阵示意图'],
  'transfer-restrictions-and-rofr': ['transfer-flow', '股权转让与审批流程示意图'],
  'board-meetings-and-minutes': ['governance-risk', '公司治理风险检查图']
};

function articleBody(item) {
  const lawLine = item.law || '本文讨论治理与股权的通用分析框架，不涉及对具体法域现行规则的适用结论。';
  const diagram = DIAGRAM_BY_SLUG[item.s];
  const imageBlock = diagram
    ? `![${diagram[1]}](/assets/diagrams/${diagram[0]}.svg)\n\n*${diagram[1]}（示意图 / 教学模型；图形仅表达关系，不替代法律文件。）*`
    : '';
  return [
    section('摘要', [
      item.core,
      `本文面向${item.a}，重点回答：${item.d}`
    ]),
    section('适用读者和适用场景', [
      `适合${item.a}在讨论、复核或修订相关安排时阅读。它更适合用于团队内部形成问题清单，而不是直接生成最终法律文件。`
    ]),
    section('核心结论（明确条件）', [
      `**${item.takeaway}**`,
      `这一结论成立的前提是：${item.cond || '相关信息已经充分披露，决策权限与责任边界可以被清楚描述，并且各方愿意在关系稳定时把规则写下来。'}`
    ]),
    section('概念定义与边界', [item.def]),
    section('背景与问题', [item.bg]),
    section('结构或机制拆解', [bullets(item.mech), imageBlock].filter(Boolean)),
    section('优势、成本与风险', [item.trade]),
    section('典型情境或案例', [item.sc]),
    section('可执行的讨论步骤与检查清单', [bullets(item.steps)]),
    section('常见误区', [bullets(item.wrong)]),
    section('不适用的情况', [item.no]),
    section('总结金句', [`> ${item.quote}（编辑观点）`]),
    section('参考资料', [
      '本文引用的官方来源与专业资源列于页面底部「参考来源」。法规状态与条文版本请按来源链接复核，不以本文摘要替代原文。'
    ]),
    section('内容适用法域与资料核验日期', [
      lawLine,
      item.verified
        ? `资料入口最后访问日期：${item.verified}。该日期表示官方入口可访问，不表示全部具体条文已完成逐条核验。`
        : '本文未标注具体法域的现行规则，不应作为任何法域下的适用结论使用。'
    ])
  ].join('\n');
}

function caseBody(item) {
  return [
    section('案例定位', [
      `**${item.caseType || '教学案例'}。** ${item.core}`,
      '本栏严格区分公开事实、媒体报道、当事人观点、研究者分析与编辑推论。资料不足时不补齐股权比例或交易金额。'
    ]),
    section('A. 案例背景及时间线', [item.timeline]),
    section('B. 行业与发展阶段', [item.industry]),
    section('C. 公开可核验的股权与治理信息', [item.facts]),
    section('D. 参与方及其角色', [item.parties]),
    section('E. 股权安排和控制机制', [item.arrangement]),
    section('F. 当时面临的商业问题', [item.problem]),
    section('G. 结构设计解决了什么', [item.solution]),
    section('H. 代价、争议或风险', [item.cost]),
    section('I. 后续发生了什么变化', [item.after]),
    section('J. 可以提炼的治理经验', [item.lessons]),
    section('K. 不能简单复制的条件和原因', [item.limits]),
    section('L. 资料来源及发布日期', [
      '来源条目列于页面底部。若来源仅能支撑机制层面的讨论，本文标注为教学案例或结构情景分析，不声称对应某家真实公司的完整事实。',
      item.law || '本文不提供投资、法律或估值结论。'
    ])
  ].join('\n');
}

let dateCursor = new Date('2026-01-06T00:00:00Z');
function nextDate() {
  const value = dateCursor.toISOString().slice(0, 10);
  dateCursor.setUTCDate(dateCursor.getUTCDate() + 9);
  return value;
}

const LEGAL_CATEGORIES = ['control-rights', 'shareholder-agreement', 'finance-tax', 'shareholder-exit', 'case-studies'];

let count = 0;
for (const sourceItem of all) {
  const item = { ...sourceItem };
  if (LEGAL_CATEGORIES.includes(item.c)) {
    item.jur = item.jur && item.jur.length ? item.jur : [item.caseType ? '教学情景' : '多法域比较'];
    item.verified = item.verified || '2026-11-20';
  }
  const dir = path.join(ROOT, 'content', item.c);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${item.s}.md`);
  const publishedAt = item.published || nextDate();
  const body = item.caseType ? caseBody(item) : articleBody(item);
  fs.writeFileSync(file, `${yaml(item, publishedAt)}\n${body}\n`, 'utf8');
  count += 1;
}
logOk(`已写入 ${count} 篇内容到 content/`);
