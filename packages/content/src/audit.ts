import type { Post } from './schema.ts';

export type Severity = 'error' | 'warn' | 'info';

export interface AuditIssue {
  field: string;
  severity: Severity;
  message: string;
  /** Which reviewer lane owns the fix. */
  lane: 'seo' | 'geo' | 'images' | 'editorial';
}

export interface AuditResult {
  slug: string;
  score: number; // 0-100
  issues: AuditIssue[];
  publishable: boolean;
}

const MIN_BODY_CHARS = 600;

/**
 * Deterministic pre-publish audit. The admin review screen and the
 * `content-reviewer` agent both run this so a human and an agent
 * always see the same verdict — no model judgment involved.
 */
export function auditPost(post: Post): AuditResult {
  const issues: AuditIssue[] = [];
  const add = (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) =>
    issues.push({ field, severity, lane, message });

  // ── Editorial ──────────────────────────────────────────────
  if (post.body.length < MIN_BODY_CHARS) {
    add('body', 'warn', 'editorial', `Body is ${post.body.length} chars; aim for ${MIN_BODY_CHARS}+.`);
  }
  if (!/^#{1,3}\s/m.test(post.body)) {
    add('body', 'warn', 'editorial', 'No headings found. Answer engines rely on heading structure.');
  }
  if (!post.description.trim()) {
    add('description', 'error', 'editorial', 'Description is empty.');
  }

  // ── SEO ────────────────────────────────────────────────────
  const seoTitle = post.seo.title ?? post.title;
  if (seoTitle.length > 60) add('seo.title', 'warn', 'seo', `SEO title is ${seoTitle.length} chars (>60).`);
  const metaDescription = post.seo.description ?? post.description;
  if (!metaDescription) add('seo.description', 'error', 'seo', 'Meta description is missing.');
  else if (metaDescription.length > 160)
    add('seo.description', 'warn', 'seo', `Meta description is ${metaDescription.length} chars (>160).`);
  if (post.seo.keywords.length === 0) add('seo.keywords', 'info', 'seo', 'No target keywords set.');
  if (post.tags.length === 0) add('tags', 'warn', 'seo', 'No tags — internal linking and topic clusters suffer.');

  // ── Technical SEO ──────────────────────────────────────────
  if (post.seo.canonical && !/^https?:\/\//.test(post.seo.canonical)) {
    add('seo.canonical', 'error', 'seo', 'Canonical must be an absolute URL (https://…).');
  }
  if (post.seo.ogImage && !/^(https?:\/\/|\/)/.test(post.seo.ogImage)) {
    add('seo.ogImage', 'error', 'seo', 'OG image must be an absolute URL or a root-relative path.');
  }
  if (post.seo.priority < 0 || post.seo.priority > 1) {
    add('seo.priority', 'error', 'seo', 'Sitemap priority must be between 0.0 and 1.0.');
  }
  for (const alternate of post.seo.alternates) {
    if (!/^(https?:\/\/|\/)/.test(alternate.href)) {
      add('seo.alternates', 'error', 'seo', `hreflang "${alternate.hreflang}" has a relative href.`);
    }
  }
  if (post.status === 'published' && post.seo.noindex) {
    add('seo.noindex', 'warn', 'seo', 'Published but noindex — the page will not be indexed or cited.');
  }
  // A keyword-bearing slug is one of the few signals fully under our control.
  if (/^post-\d+$/.test(post.slug)) {
    add('slug', 'warn', 'seo', 'Auto-generated slug. Use a natural-language slug containing the target keyword.');
  }
  if (post.slug.length > 80) {
    add('slug', 'info', 'seo', `Slug is ${post.slug.length} chars; shorter URLs travel better.`);
  }

  // ── GEO (generative engine optimization) ───────────────────
  if (!post.geo.answerSummary) {
    add('geo.answerSummary', 'warn', 'geo', 'No extractive summary for answer engines to quote.');
  }
  if (post.geo.faq.length === 0) {
    add('geo.faq', 'warn', 'geo', 'No FAQ pairs — FAQPage JSON-LD is the highest-yield GEO signal.');
  }
  if (post.geo.citations.length === 0) {
    add('geo.citations', 'info', 'geo', 'No cited sources; cited pages are surfaced more often.');
  }
  if (post.geo.entities.length === 0) {
    add('geo.entities', 'info', 'geo', 'No named entities declared.');
  }

  // ── Images & provenance ────────────────────────────────────
  if (!post.cover) {
    add('cover', 'info', 'images', 'No cover image. Run `pnpm imagegen` (Codex) or attach one manually.');
  } else {
    if (!post.cover.alt.trim()) add('cover.alt', 'error', 'images', 'Cover image has no alt text.');
    if (post.cover.source === 'none') {
      add('cover.source', 'error', 'images', 'Cover image provenance is unset.');
    }
    if (post.cover.source === 'codex-imagegen' && !post.cover.origin) {
      add('cover.origin', 'warn', 'images', 'Codex-generated image is missing its prompt in `origin`.');
    }
    if (post.cover.source === 'web-search' && !post.cover.license) {
      add('cover.license', 'error', 'images', 'Web-sourced image has no license recorded.');
    }
  }

  // ── Publish gate ───────────────────────────────────────────
  if (post.status === 'published' && !post.publishedAt) {
    add('publishedAt', 'error', 'editorial', 'Published post has no publish date.');
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warn').length;
  const score = Math.max(0, 100 - errors * 20 - warnings * 7);

  return { slug: post.slug, score, issues, publishable: errors === 0 };
}
