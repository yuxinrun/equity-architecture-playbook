/**
 * 原创 SVG 资产生成器。所有图形由代码绘制，不引用任何外部图片。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, logOk } from './lib/utils.js';

const C = {
  ink: '#202733',
  navy: '#18324B',
  teal: '#168A82',
  amber: '#C58A3A',
  line: '#8FA3B3',
  light: '#F6F7F8',
  white: '#FFFFFF',
  blue: '#4C7EA8'
};

const font = "'Noto Sans SC','Microsoft YaHei','PingFang SC',sans-serif";

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function text(x, y, value, opts = {}) {
  const size = opts.size || 16;
  const fill = opts.fill || C.ink;
  const anchor = opts.anchor || 'middle';
  const weight = opts.weight || 400;
  const family = opts.mono ? 'ui-monospace,SFMono-Regular,Consolas,monospace' : font;
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-family="${family}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function rect(x, y, w, h, label, opts = {}) {
  const fill = opts.fill || C.white;
  const stroke = opts.stroke || C.line;
  const rx = opts.rx ?? 10;
  const dash = opts.dash ? ` stroke-dasharray="${opts.dash}"` : '';
  const labelY = y + h / 2 + (opts.size || 16) / 3;
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${opts.width || 1.5}"${dash}/>${text(x + w / 2, labelY, label, { size: opts.size || 16, fill: opts.textFill || C.ink, weight: opts.weight || 600 })}</g>`;
}

function arrow(x1, y1, x2, y2, opts = {}) {
  const stroke = opts.stroke || C.line;
  const dash = opts.dash ? ` stroke-dasharray="${opts.dash}"` : '';
  const marker = opts.noMarker ? '' : ' marker-end="url(#arrow)"';
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${opts.width || 1.8}"${dash}${marker}/>`;
}

function line(x1, y1, x2, y2, opts = {}) {
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${opts.stroke || C.line}" stroke-width="${opts.width || 1.4}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ''}/>`;
}

function doc(name, title, desc, body, legend = []) {
  const legendHtml = legend.length
    ? legend.map((item, i) => `<g transform="translate(${40 + i * 210},520)">${line(0, 0, 26, 0, item)}${text(34, 5, item.label, { anchor: 'start', size: 12, fill: C.ink })}</g>`).join('')
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 560" role="img" aria-labelledby="title desc" preserveAspectRatio="xMidYMid meet">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.line}"/></marker>
  </defs>
  <rect width="960" height="560" fill="${C.light}"/>
  <rect x="20" y="20" width="920" height="520" rx="14" fill="${C.white}" stroke="#E2E7EB"/>
  ${text(40, 58, title, { anchor: 'start', size: 22, weight: 700, fill: C.navy })}
  ${line(40, 72, 920, 72, { stroke: '#E2E7EB' })}
  ${body}
  ${legendHtml}
  ${text(920, 526, '示意图 / 教学模型', { anchor: 'end', size: 11, fill: '#657080' })}
</svg>`;
  write(`public/assets/diagrams/${name}.svg`, svg);
}

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  logOk(rel);
}

/* Hero 主视觉 */
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 600" role="img" aria-labelledby="hero-title hero-desc" preserveAspectRatio="xMidYMid meet">
  <title id="hero-title">公司架构与股权关系教学示意图</title>
  <desc id="hero-desc">创始团队、员工、投资人通过持股平台与公司法主体连接，董事会与经理层形成治理与执行关系。图中实线为股权关系，虚线为治理或合同关系。</desc>
  <rect width="720" height="600" rx="24" fill="#F6F7F8"/>
  <circle cx="360" cy="300" r="242" fill="#E8EFF2"/>
  <circle cx="360" cy="300" r="190" fill="none" stroke="#D4E0E6" stroke-dasharray="6 8"/>
  <g stroke-width="1.8" fill="none">
    <path d="M360 260 L360 196" stroke="#18324B"/>
    <path d="M360 196 C260 196 224 174 180 148" stroke="#18324B"/>
    <path d="M360 196 C460 196 500 174 548 148" stroke="#168A82"/>
    <path d="M360 340 C300 380 258 414 220 462" stroke="#168A82" stroke-dasharray="6 6"/>
    <path d="M360 340 C420 380 470 414 510 462" stroke="#C58A3A" stroke-dasharray="6 6"/>
    <path d="M360 340 L360 430" stroke="#18324B" stroke-dasharray="6 6"/>
  </g>
  ${rect(288, 112, 144, 84, '公司法主体', { fill: C.navy, stroke: C.navy, textFill: C.white, size: 17 })}
  ${rect(88, 104, 148, 72, '创始团队', { fill: C.white, stroke: C.navy })}
  ${rect(482, 104, 148, 72, '投资人', { fill: C.white, stroke: C.teal })}
  ${rect(112, 444, 142, 72, '员工激励池', { fill: C.white, stroke: C.teal })}
  ${rect(452, 444, 142, 72, '业务与现金流', { fill: C.white, stroke: C.amber })}
  ${rect(298, 428, 124, 72, '董事会 / 经理层', { fill: C.white, stroke: C.navy, size: 13 })}
  ${text(360, 82, '股权关系 / 治理关系 / 业务关系', { size: 13, fill: '#657080' })}
  ${line(40, 552, 78, 552, { stroke: C.navy })}
  ${text(86, 557, '股权线', { anchor: 'start', size: 12, fill: '#657080' })}
  ${line(170, 552, 208, 552, { stroke: C.teal, dash: '6 6' })}
  ${text(216, 557, '治理 / 合同线', { anchor: 'start', size: 12, fill: '#657080' })}
  ${line(350, 552, 388, 552, { stroke: C.amber, dash: '3 5' })}
  ${text(396, 557, '业务 / 现金流', { anchor: 'start', size: 12, fill: '#657080' })}
</svg>`;
write('public/assets/illustrations/hero-architecture.svg', hero);

const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-labelledby="og-title">
  <title id="og-title">公司架构与股权设计 — Equity Architecture Playbook</title>
  <rect width="1200" height="630" fill="#18324B"/>
  <circle cx="960" cy="180" r="220" fill="#20445F"/>
  <circle cx="1010" cy="450" r="150" fill="#168A82" opacity="0.55"/>
  ${text(80, 180, '公司架构与股权设计', { anchor: 'start', size: 56, weight: 700, fill: '#FFFFFF' })}
  ${text(82, 232, 'Equity Architecture Playbook', { anchor: 'start', size: 24, fill: '#8FC3D8' })}
  ${text(82, 310, '好的公司架构，让企业走得更远。', { anchor: 'start', size: 30, fill: '#E8EFF2' })}
  ${line(82, 350, 560, 350, { stroke: '#C58A3A', width: 3 })}
  ${text(82, 400, '治理 · 股权 · 控制权 · 激励 · 融资 · 退出', { anchor: 'start', size: 20, fill: '#B9C9D8' })}
</svg>`;
write('public/assets/images/og-cover.svg', og);

/* 1 四层架构 */
doc('four-layers', '公司架构的四个层次', '法律、股权、组织与业务架构分别回答不同问题。', `
  ${rect(60, 110, 180, 74, '法律架构', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${rect(280, 110, 180, 74, '股权架构', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${rect(500, 110, 180, 74, '组织架构', { fill: C.blue, stroke: C.blue, textFill: C.white })}
  ${rect(720, 110, 180, 74, '业务架构', { fill: C.amber, stroke: C.amber, textFill: C.white })}
  ${text(150, 214, '主体 · 责任 · 登记', { size: 14, fill: '#657080' })}
  ${text(370, 214, '所有权 · 权利 · 控制', { size: 14, fill: '#657080' })}
  ${text(590, 214, '决策 · 执行 · 监督', { size: 14, fill: '#657080' })}
  ${text(810, 214, '产品 · 客户 · 现金流', { size: 14, fill: '#657080' })}
  ${line(60, 250, 900, 250, { stroke: '#E2E7EB' })}
  ${rect(100, 290, 700, 150, '', { fill: '#F6F7F8', stroke: '#E2E7EB' })}
  ${text(450, 330, '同一家公司可以同时拥有四张不同的图', { size: 20, weight: 700, fill: C.navy })}
  ${text(450, 370, '不能用一张图回答所有问题，也不能把不同层次的关系混为一条线。', { size: 15, fill: '#657080' })}
`);

/* 2 母子公司 */
doc('parent-subsidiary', '母公司、子公司与业务单元', '实线表示股权关系，虚线表示业务管理关系。', `
  ${rect(360, 110, 240, 84, '母公司', { fill: C.navy, stroke: C.navy, textFill: C.white, size: 20 })}
  ${arrow(400, 194, 240, 268)}
  ${arrow(560, 194, 720, 268)}
  ${rect(100, 270, 260, 84, '子公司 A', { fill: C.white, stroke: C.teal })}
  ${rect(600, 270, 260, 84, '子公司 B', { fill: C.white, stroke: C.amber })}
  ${arrow(230, 354, 230, 420)}
  ${arrow(730, 354, 730, 420)}
  ${rect(120, 422, 220, 62, '业务单元 / 产品线', { size: 14 })}
  ${rect(620, 422, 220, 62, '业务单元 / 服务线', { size: 14 })}
  ${text(480, 300, '独立法律主体', { size: 14, fill: '#657080' })}
  ${text(480, 330, '各自承担相应责任', { size: 14, fill: '#657080' })}
`, [
  { stroke: C.navy, label: '持股关系' },
  { stroke: C.teal, dash: '6 6', label: '业务管理关系' }
]);

/* 3 治理关系 */
doc('governance-triangle', '股东会 — 董事会 — 经理层', '所有权、决策与执行形成相互衔接但不等同的治理链。', `
  ${rect(330, 100, 300, 84, '股东会', { fill: C.navy, stroke: C.navy, textFill: C.white, size: 20 })}
  ${arrow(480, 184, 480, 240)}
  ${rect(330, 244, 300, 84, '董事会', { fill: C.teal, stroke: C.teal, textFill: C.white, size: 20 })}
  ${arrow(480, 328, 480, 384)}
  ${rect(330, 388, 300, 84, '经理层', { fill: C.blue, stroke: C.blue, textFill: C.white, size: 20 })}
  ${text(180, 286, '重大事项', { size: 15, weight: 600, fill: C.navy })}
  ${text(180, 312, '选举与授权', { size: 14, fill: '#657080' })}
  ${text(690, 286, '经营决策', { size: 15, weight: 600, fill: C.navy })}
  ${text(690, 312, '聘任与监督', { size: 14, fill: '#657080' })}
`);

/* 4 创始人分股因素 */
doc('founder-factors', '创始人股权讨论因素图', '现金、时间、技术、资源、风险与未来责任应同时进入讨论。', `
  <circle cx="480" cy="290" r="92" fill="${C.navy}"/>
  ${text(480, 284, '创始人', { size: 24, weight: 700, fill: C.white })}
  ${text(480, 312, '股权讨论', { size: 16, fill: '#C8DAE8' })}
  ${rect(90, 110, 190, 60, '现金出资', { fill: C.white, stroke: C.teal })}
  ${rect(680, 110, 190, 60, '全职投入', { fill: C.white, stroke: C.teal })}
  ${rect(70, 260, 190, 60, '技术与知识产权', { fill: C.white, stroke: C.blue, size: 14 })}
  ${rect(700, 260, 190, 60, '客户与资源', { fill: C.white, stroke: C.blue })}
  ${rect(120, 410, 190, 60, '承担风险', { fill: C.white, stroke: C.amber })}
  ${rect(650, 410, 190, 60, '未来责任', { fill: C.white, stroke: C.amber })}
  ${arrow(290, 140, 392, 240)}
  ${arrow(670, 140, 568, 240)}
  ${arrow(265, 290, 384, 290)}
  ${arrow(695, 290, 576, 290)}
  ${arrow(310, 440, 404, 350)}
  ${arrow(650, 440, 556, 350)}
  ${text(480, 470, '没有单一公式可以替代团队对假设的显式讨论。', { size: 14, fill: '#657080' })}
`);

/* 5 权利对照 */
doc('rights-comparison', '股权、表决权、分红权与管理权对照', '同一种持股比例，可以对应不同的权利组合。', `
  ${rect(60, 110, 190, 70, '股权比例', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${rect(280, 110, 190, 70, '表决权', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${rect(500, 110, 190, 70, '分红权', { fill: C.blue, stroke: C.blue, textFill: C.white })}
  ${rect(720, 110, 180, 70, '管理权', { fill: C.amber, stroke: C.amber, textFill: C.white })}
  ${text(155, 210, '法律所有权口径', { size: 13, fill: '#657080' })}
  ${text(375, 210, '决议表达口径', { size: 13, fill: '#657080' })}
  ${text(595, 210, '利润分配口径', { size: 13, fill: '#657080' })}
  ${text(810, 210, '岗位授权口径', { size: 13, fill: '#657080' })}
  ${line(60, 250, 900, 250, { stroke: '#E2E7EB' })}
  ${text(480, 300, '讨论控制权时必须逐项核对', { size: 20, weight: 700, fill: C.navy })}
  ${rect(160, 340, 640, 110, '', { fill: '#F6F7F8', stroke: '#E2E7EB' })}
  ${text(480, 380, '法律强制规则  /  章程自治  /  股东协议  /  实际流程', { size: 16, fill: C.ink })}
  ${text(480, 415, '任一环节不一致，都可能导致条款无法执行。', { size: 14, fill: '#657080' })}
`);

/* 6 融资稀释 */
doc('dilution-before-after', '融资前后股权稀释示意', '简化模型：新增股份扩大分母，原有股份数量不变。', `
  ${text(240, 120, '融资前', { size: 18, weight: 700, fill: C.navy })}
  ${rect(100, 150, 280, 90, '创始团队 80%', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${rect(100, 260, 280, 60, '现有其他股东 20%', { fill: C.white, stroke: C.line, size: 14 })}
  ${arrow(430, 250, 540, 250)}
  ${text(485, 225, '增资', { size: 14, fill: C.teal })}
  ${text(720, 120, '融资后', { size: 18, weight: 700, fill: C.navy })}
  ${rect(590, 150, 210, 90, '创始团队 72%', { fill: C.navy, stroke: C.navy, textFill: C.white, size: 15 })}
  ${rect(590, 260, 150, 60, '其他 18%', { fill: C.white, stroke: C.line, size: 14 })}
  ${rect(755, 260, 150, 60, '投资人 10%', { fill: C.teal, stroke: C.teal, textFill: C.white, size: 14 })}
  ${text(480, 380, '教学数字仅用于说明分母变化；不含期权池、优先权与可转换工具。', { size: 14, fill: '#657080' })}
`);

/* 7 归属时间线 */
doc('vesting-timeline', '期权归属时间线', '四年归属、一年 Cliff 的时间示意。', `
  ${line(120, 300, 840, 300, { stroke: C.line, width: 3 })}
  ${[0, 1, 2, 3, 4].map((year) => `<g>${line(120 + year * 180, 288, 120 + year * 180, 312, { stroke: C.navy })}${text(120 + year * 180, 344, `第 ${year} 年`, { size: 13, fill: '#657080' })}</g>`).join('')}
  ${rect(120, 190, 180, 70, 'Cliff：0%', { fill: '#E8EFF2', stroke: C.line, size: 14 })}
  ${rect(300, 190, 180, 70, '25%', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${rect(480, 190, 180, 70, '50%', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${rect(660, 190, 180, 70, '75% → 100%', { fill: C.teal, stroke: C.teal, textFill: C.white, size: 14 })}
  ${text(480, 430, '归属模型不等于可行权数量、税后收益或法律权利。', { size: 15, fill: '#657080' })}
`);

/* 8 多轮融资 */
doc('multi-round-cap-table', '多轮融资股权变化示意', '按事件顺序重算，而不是直接拼接各轮比例。', `
  ${rect(70, 150, 160, 70, '创始团队', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${arrow(230, 185, 290, 185)}
  ${rect(290, 150, 160, 70, '种子轮', { fill: C.white, stroke: C.teal })}
  ${arrow(450, 185, 510, 185)}
  ${rect(510, 150, 160, 70, 'A 轮 + 期权池', { fill: C.white, stroke: C.blue, size: 14 })}
  ${arrow(670, 185, 720, 185)}
  ${rect(720, 150, 170, 70, 'B 轮 + 转股', { fill: C.white, stroke: C.amber, size: 14 })}
  ${line(70, 270, 890, 270, { stroke: '#E2E7EB' })}
  ${text(480, 320, '每次事件后都要更新完全稀释股本', { size: 20, weight: 700, fill: C.navy })}
  ${rect(170, 360, 620, 90, '', { fill: '#F6F7F8', stroke: '#E2E7EB' })}
  ${text(480, 400, '已发行股份 + 已授予期权 + 期权池 + 可转换工具', { size: 16 })}
  ${text(480, 430, '不同文件的定义口径必须一致', { size: 14, fill: '#657080' })}
`);

/* 9 股东生命周期 */
doc('shareholder-lifecycle', '股东参与生命周期', '进入、持续贡献、角色变化与退出构成完整链条。', `
  ${rect(80, 220, 150, 80, '进入', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${arrow(230, 260, 300, 260)}
  ${rect(300, 220, 150, 80, '持续贡献', { fill: C.white, stroke: C.teal })}
  ${arrow(450, 260, 520, 260)}
  ${rect(520, 220, 150, 80, '角色变化', { fill: C.white, stroke: C.amber })}
  ${arrow(670, 260, 740, 260)}
  ${rect(740, 220, 140, 80, '退出', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${text(175, 340, '出资 / 授予', { size: 13, fill: '#657080' })}
  ${text(375, 340, '归属 / 绩效', { size: 13, fill: '#657080' })}
  ${text(595, 340, '职责 / 投入', { size: 13, fill: '#657080' })}
  ${text(810, 340, '转让 / 回购', { size: 13, fill: '#657080' })}
  ${text(480, 430, '每个阶段都应提前约定信息权与处理规则。', { size: 15, fill: '#657080' })}
`);

/* 10 决策矩阵 */
doc('decision-matrix', '重大事项决策矩阵示意', '不同事项应由不同主体决策；此项为教学模型。', `
  ${['事项', '股东会', '董事会', '经理层', '特定股东'].map((h, i) => rect(80 + i * 165, 110, 160, 54, h, { fill: C.navy, stroke: C.navy, textFill: C.white, size: 14 })).join('')}
  ${[
    ['修改章程', '批准', '提议', '—', '否决'],
    ['重大投资', '—', '决定', '执行', '知情'],
    ['日常采购', '—', '监督', '决定', '—'],
    ['关联交易', '批准', '审议', '执行', '回避']
  ].map((row, r) => row.map((cell, c) => rect(80 + c * 165, 178 + r * 66, 160, 56, cell, { fill: c === 0 ? '#E8EFF2' : C.white, stroke: '#D8E0E6', size: 14 })).join('')).join('')}
  ${text(480, 480, '具体权限取决于法域、章程、协议与授权制度。', { size: 14, fill: '#657080' })}
`);

/* 11 股权转让流程 */
doc('transfer-flow', '股权转让与审批流程示意', '流程节点为通用讨论框架，不替代具体法域程序。', `
  ${rect(70, 190, 150, 74, '转让意向', { fill: C.teal, stroke: C.teal, textFill: C.white })}
  ${arrow(220, 227, 280, 227)}
  ${rect(280, 190, 150, 74, '书面通知', { fill: C.white, stroke: C.teal })}
  ${arrow(430, 227, 490, 227)}
  ${rect(490, 190, 170, 74, '优先购买权', { fill: C.white, stroke: C.blue })}
  ${arrow(660, 227, 720, 227)}
  ${rect(720, 190, 160, 74, '签署与交割', { fill: C.navy, stroke: C.navy, textFill: C.white })}
  ${rect(260, 330, 160, 66, '内部审批', { size: 14 })}
  ${rect(520, 330, 180, 66, '登记 / 备案', { size: 14 })}
  ${arrow(565, 264, 340, 330)}
  ${arrow(605, 264, 610, 330)}
  ${text(480, 450, '通知内容、答复期限与沉默后果必须在条款中明确。', { size: 14, fill: '#657080' })}
`);

/* 12 治理风险检查 */
doc('governance-risk', '公司治理风险检查图', '从信息、授权、冲突、记录与退出五个维度检查治理风险。', `
  ${rect(360, 100, 240, 74, '治理风险检查', { fill: C.navy, stroke: C.navy, textFill: C.white, size: 20 })}
  ${rect(80, 250, 150, 66, '信息权', { fill: C.white, stroke: C.teal })}
  ${rect(270, 250, 150, 66, '授权边界', { fill: C.white, stroke: C.teal })}
  ${rect(460, 250, 150, 66, '利益冲突', { fill: C.white, stroke: C.amber })}
  ${rect(650, 250, 150, 66, '会议记录', { fill: C.white, stroke: C.blue })}
  ${rect(390, 380, 180, 66, '退出机制', { fill: C.white, stroke: C.navy })}
  ${arrow(430, 174, 155, 250)}
  ${arrow(460, 174, 345, 250)}
  ${arrow(500, 174, 535, 250)}
  ${arrow(530, 174, 725, 250)}
  ${arrow(480, 174, 480, 380)}
  ${text(480, 480, '治理风险往往在平时积累，在交易或争议时集中暴露。', { size: 14, fill: '#657080' })}
`);

/* 资产来源清单 */
const sourceList = `# 资产来源清单

本项目的视觉资产均为**原创生成**，不下载或引用未经授权的商业摄影、书籍封面或品牌素材。

| 文件 | 类型 | 来源 | 作者 | 许可 | 生成 / 记录日期 |
| --- | --- | --- | --- | --- | --- |
| public/assets/illustrations/hero-architecture.svg | 原创 SVG 插画 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/images/og-cover.svg | 原创 SVG 封面 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/four-layers.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/parent-subsidiary.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/governance-triangle.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/founder-factors.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/rights-comparison.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/dilution-before-after.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/vesting-timeline.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/multi-round-cap-table.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/shareholder-lifecycle.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/decision-matrix.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/transfer-flow.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |
| public/assets/diagrams/governance-risk.svg | 原创示意图 | scripts/generate-assets.js | 项目编辑团队 | CC0-1.0 | 2026-11-20 |

所有图示均标注为“示意图 / 教学模型”，不作为法律权利证明、估值结论或正式公司结构文件。
`;
write('public/assets/ASSET-SOURCES.md', sourceList);
