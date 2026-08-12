import { z } from 'zod';

/**
 * Content lifecycle. The admin app moves a post through these states;
 * the web app only ever renders `published`.
 */
export const PostStatus = z.enum(['draft', 'in_review', 'scheduled', 'published', 'archived']);
export type PostStatus = z.infer<typeof PostStatus>;

/**
 * Provenance of every image in the repo.
 *
 * HARD RULE (see CLAUDE.md § Image Policy): the only machine-generated
 * value allowed here is `codex-imagegen`. An agent may never write
 * `claude` or any other model — Claude image synthesis is forbidden.
 *
 * `user-upload` covers images a human attaches through the admin editor,
 * including Supabase Storage uploads. Uploading is not generating.
 */
export const ImageSource = z.enum(['codex-imagegen', 'user-upload', 'web-search', 'none']);
export type ImageSource = z.infer<typeof ImageSource>;

export const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'alt text is required for accessibility and SEO'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Where the image came from. Required so review can audit provenance. */
  source: ImageSource,
  /** Original prompt (codex-imagegen) or source URL (web-search). */
  origin: z.string().optional(),
  credit: z.string().optional(),
  license: z.string().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

/** Sitemap hints, surfaced per-post so editors can prioritise cornerstone content. */
export const ChangeFreq = z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
export type ChangeFreq = z.infer<typeof ChangeFreq>;

export const TwitterCard = z.enum(['summary', 'summary_large_image']);
export const OgType = z.enum(['article', 'website']);

/**
 * Technical SEO metadata.
 *
 * Everything here maps to something a crawler actually reads — a meta tag,
 * a link rel, a sitemap field, or a robots directive. Nothing is decorative.
 */
export const SeoSchema = z.object({
  title: z.string().max(60, 'SEO title should stay under 60 chars').optional(),
  description: z.string().max(160, 'meta description should stay under 160 chars').optional(),
  keywords: z.array(z.string()).default([]),

  // ── Indexing control ─────────────────────────────────────
  canonical: z.string().optional(),
  noindex: z.boolean().default(false),
  nofollow: z.boolean().default(false),
  /**
   * Extra robots directives, e.g. `max-snippet:-1`, `max-image-preview:large`.
   * These matter for GEO: they control how much an answer engine may quote.
   */
  robotsDirectives: z.array(z.string()).default([]),

  // ── Open Graph ───────────────────────────────────────────
  ogType: OgType.default('article'),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),

  // ── Twitter / X ──────────────────────────────────────────
  twitterCard: TwitterCard.default('summary_large_image'),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),

  // ── Sitemap ──────────────────────────────────────────────
  changefreq: ChangeFreq.default('monthly'),
  priority: z.number().min(0).max(1).default(0.7),

  // ── i18n ─────────────────────────────────────────────────
  /** hreflang alternates. `hreflang: 'x-default'` is allowed. */
  alternates: z
    .array(z.object({ hreflang: z.string().min(1), href: z.string().min(1) }))
    .default([]),

  /** Include this post in `/llms.txt`. Turn off for thin or time-bound pages. */
  llmsTxt: z.boolean().default(true),
});
export type Seo = z.infer<typeof SeoSchema>;

/**
 * GEO = Generative Engine Optimization.
 * Structured signals that answer engines (ChatGPT, Claude, Perplexity,
 * AI Overviews) extract when citing a page — plus locale targeting.
 */
export const GeoSchema = z.object({
  /** BCP-47 locale, e.g. `ko-KR`. */
  locale: z.string().default('ko-KR'),
  /** Markets this post targets, e.g. ['KR', 'US']. */
  targetMarkets: z.array(z.string()).default([]),
  /** One-paragraph extractive summary an answer engine can quote verbatim. */
  answerSummary: z.string().optional(),
  /** Named entities the post should be associated with. */
  entities: z.array(z.string()).default([]),
  /** Q&A pairs rendered as FAQPage JSON-LD — the highest-yield GEO signal. */
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .default([]),
  /** Primary sources cited in the body; answer engines weight cited pages higher. */
  citations: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .default([]),
});
export type Geo = z.infer<typeof GeoSchema>;

/** Editorial review record produced by the admin review screen. */
export const ReviewSchema = z.object({
  reviewer: z.string().optional(),
  reviewedAt: z.string().optional(),
  checks: z
    .object({
      factual: z.boolean().default(false),
      tone: z.boolean().default(false),
      seo: z.boolean().default(false),
      geo: z.boolean().default(false),
      images: z.boolean().default(false),
      links: z.boolean().default(false),
    })
    // zod 4: `.default()` expects the parsed output; `.prefault()` feeds the
    // value through parsing so the inner field defaults still apply.
    .prefault({}),
  notes: z.string().optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

/**
 * Slug rules.
 *
 * Natural-language slugs are allowed and preferred: keeping the target keyword
 * in the URL is a real ranking and click-through signal, and Korean/Japanese
 * readers see a legible URL rather than transliterated mush. Browsers
 * percent-encode non-ASCII on the wire and display it decoded.
 *
 * Constraints: lowercase, no whitespace, hyphen-separated. `\p{Lo}` covers
 * Hangul, Kana and Han; `\p{Ll}` covers lowercase Latin/Cyrillic/Greek.
 */
export const SLUG_PATTERN = /^[\p{Ll}\p{Lo}\p{N}]+(?:-[\p{Ll}\p{Lo}\p{N}]+)*$/u;

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(120, 'slug should stay under 120 chars')
    .regex(SLUG_PATTERN, 'slug must be lowercase, hyphen-separated, with no whitespace'),
  description: z.string().default(''),
  status: PostStatus.default('draft'),
  /** Agent or human that authored the draft. */
  author: z.string().default('unknown'),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().default('general'),
  cover: ImageSchema.optional(),
  seo: SeoSchema.prefault({}),
  geo: GeoSchema.prefault({}),
  review: ReviewSchema.prefault({}),
});
export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

/**
 * The shape callers pass to `writePost`. Fields with schema defaults are
 * optional here — the parse step fills them in.
 */
export type PostFrontmatterInput = z.input<typeof PostFrontmatterSchema>;

export interface Post extends PostFrontmatter {
  /** Markdown body, frontmatter stripped. */
  body: string;
  /** Absolute path on disk. Empty when the post came from Supabase. */
  filePath: string;
  readingTimeMinutes: number;
}
