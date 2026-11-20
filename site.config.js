/**
 * 站点级配置。构建与客户端脚本共用同一份基础信息。
 *
 * BASE_PATH  : 部署子路径。GitHub Pages 项目站点需设为 "/仓库名/"。
 * SITE_URL   : 站点绝对地址，用于 canonical / Open Graph / sitemap。
 *              未配置时不输出绝对地址标签（构建日志会提示），避免写入虚构域名。
 */

function normalizeBase(value) {
  if (!value || value === '/') return '/';
  let base = value.trim();
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  return base;
}

const base = normalizeBase(process.env.BASE_PATH || '/');
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');

export default {
  name: '公司架构与股权设计',
  nameEn: 'Equity Architecture Playbook',
  tagline: '好的公司架构，让企业走得更远。',
  description:
    '一个系统研究公司组织架构、股权架构、公司治理、创始人股权分配、控制权设计、员工股权激励、融资稀释、股东退出与长期治理的中文知识库。',
  repo: 'equity-architecture-playbook',
  base,
  siteUrl,
  author: '编辑团队',
  editorNote: '本站内容由编辑团队整理与撰写，属于研究与教育性质资料。',
  buildDate: new Date().toISOString().slice(0, 10),
  nav: [
    { label: '首页', path: '/' },
    { label: '公司架构', path: '/company-structure/' },
    { label: '股权设计', path: '/equity-design/' },
    { label: '创始人分股', path: '/founder-equity/' },
    { label: '控制权', path: '/control-rights/' },
    { label: '股权激励', path: '/equity-incentives/' },
    { label: '融资与稀释', path: '/fundraising/' },
    { label: '股东退出', path: '/shareholder-exit/' },
    { label: '案例研究', path: '/case-studies/' },
    { label: '书籍与资源', path: '/books/' }
  ],
  utilityNav: [
    { label: '工具', path: '/tools/' },
    { label: '术语', path: '/glossary/' },
    { label: '金句', path: '/quotes/' },
    { label: '关于', path: '/about/' }
  ],
  /** 首页「先理解这六件事」 */
  fundamentals: [
    {
      no: '01',
      title: '架构有四层，不要混着谈',
      text: '法律架构解决主体与责任，股权架构解决所有权，组织架构解决谁向谁汇报，业务架构解决价值如何交付。四层混为一谈，是治理讨论失焦的起点。',
      href: '/company-structure/what-is-corporate-architecture/'
    },
    {
      no: '02',
      title: '比例不等于控制权',
      text: '股权比例、表决权、董事席位、经理层权限、协议控制与分红权是不同权利。同一比例在不同法域、不同事项上，效果可以完全不同。',
      href: '/control-rights/economic-rights-vs-control/'
    },
    {
      no: '03',
      title: '分股分的是未来，不只是过去',
      text: '初始出资只是贡献的一部分。全职投入、技术、客户资源、承担风险与持续经营责任，需要在同一张讨论表上被看见。',
      href: '/founder-equity/founder-equity-factors/'
    },
    {
      no: '04',
      title: '没有归属机制的股权，是未来的争议',
      text: '股权一次给足、不留归属与回购安排，等于把公司未来押在"所有人都一直在"这个假设上。',
      href: '/founder-equity/founder-vesting-basics/'
    },
    {
      no: '05',
      title: '融资稀释是可计算的结构问题',
      text: '投前投后、期权池、多轮融资与优先级条款，会共同决定创始团队在完全稀释口径下的真实持股。',
      href: '/fundraising/dilution-math/'
    },
    {
      no: '06',
      title: '退出机制要在关系好时写',
      text: '定价、回购、僵局与争议解决条款的价值，只在关系破裂时才被检验。写的时候越冷静，执行时越体面。',
      href: '/shareholder-exit/exit-types-overview/'
    }
  ]
};