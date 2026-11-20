import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { renderMarkdown, stripMarkdown } from './markdown.js';
import { readingMinutes, countText, uniq, listFiles, ROOT } from './utils.js';

const REQUIRED_FIELDS = ['title', 'description', 'category', 'publishedAt'];

/**
 * 载入全部内容并做基础结构化处理。
 * 返回 { articles, categories, byCategory, issues }
 */
export function loadContent({ categories, href, asset }) {
  const issues = { errors: [], warnings: [] };
  const articles = [];

  for (const category of categories) {
    if (category.pageType && category.pageType !== 'articles') continue;
    const dir = `content/${category.id}`;
    const files = listFiles(dir, '.md');
    if (!files.length) {
      issues.warnings.push(`栏目 ${category.id} 暂无文章`);
    }
    const items = [];
    for (const file of files) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      const raw = fs.readFileSync(file, 'utf8');
      const { data, body } = parseFrontmatter(raw);
      const slugFromFile = path.basename(file, '.md');
      const slug = String(data.slug || slugFromFile).trim();

      for (const field of REQUIRED_FIELDS) {
        if (!data[field]) issues.errors.push(`${rel} 缺少必填字段: ${field}`);
      }
      if (data.category && data.category !== category.id) {
        issues.errors.push(`${rel} 的 category (${data.category}) 与所在目录 (${category.id}) 不一致`);
      }
      if (!body.trim()) issues.errors.push(`${rel} 正文为空`);
      if (data.category !== category.id) {
        // 仍按目录归类，避免构建中断
      }

      const plain = stripMarkdown(body);
      const wordCount = countText(plain);
      if (wordCount < 500) {
        issues.warnings.push(`${rel} 正文仅 ${wordCount} 字，深度可能不足`);
      }
      if (!data.sources || !data.sources.length) {
        issues.warnings.push(`${rel} 未列出参考来源`);
      }
      const isLegal = ['finance-tax', 'shareholder-agreement', 'control-rights'].includes(category.id);
      if (isLegal && !data.jurisdiction) {
        issues.warnings.push(`${rel} 属于法律/税务相关栏目，但未标注 jurisdiction`);
      }
      if (isLegal && !data.verifiedAt) {
        issues.warnings.push(`${rel} 属于法律/税务相关栏目，但未标注 verifiedAt`);
      }

      const rendered = renderMarkdown(body, { href, asset, headingShift: -1 });

      items.push({
        ...data,
        slug,
        category: category.id,
        categoryTitle: category.title,
        body,
        plain,
        html: rendered.html,
        headings: rendered.headings,
        wordCount,
        readingTime: data.readingTime || readingMinutes(plain),
        publishedAt: data.publishedAt || '',
        updatedAt: data.updatedAt || data.publishedAt || '',
        contentType: data.contentType || '指南',
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
        jurisdiction: Array.isArray(data.jurisdiction)
          ? data.jurisdiction
          : data.jurisdiction
            ? [data.jurisdiction]
            : [],
        sources: Array.isArray(data.sources) ? data.sources : data.sources ? [data.sources] : [],
        featured: data.featured === true,
        order: typeof data.order === 'number' ? data.order : 999,
        path: `/${category.id}/${slug}/`,
        relPath: rel
      });
    }

    items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(b.publishedAt).localeCompare(String(a.publishedAt));
    });

    items.forEach((item, index) => {
      item.position = index + 1;
      item.prev = index > 0 ? items[index - 1] : null;
      item.next = index < items.length - 1 ? items[index + 1] : null;
    });

    articles.push(...items);
  }

  // 全局 slug 唯一性（含跨栏目）
  const seen = new Map();
  for (const article of articles) {
    const key = `${article.category}/${article.slug}`;
    if (seen.has(key)) issues.errors.push(`重复的文章地址: ${key}`);
    seen.set(key, true);
  }
  const slugSeen = new Map();
  for (const article of articles) {
    if (slugSeen.has(article.slug)) {
      issues.errors.push(`slug 重复: ${article.slug}（${article.relPath} 与 ${slugSeen.get(article.slug)}）`);
    }
    slugSeen.set(article.slug, article.relPath);
  }

  // 标签池
  const tagPool = uniq(articles.flatMap((a) => a.tags)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  return { articles, issues, tagPool };
}

export function groupByCategory(articles) {
  const map = new Map();
  for (const article of articles) {
    if (!map.has(article.category)) map.set(article.category, []);
    map.get(article.category).push(article);
  }
  return map;
}