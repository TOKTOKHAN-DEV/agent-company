'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  type ImageSource,
  type PostFrontmatterInput,
  type PostStatus,
  getRepository,
  slugify,
} from '@repo/content';

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function list(form: FormData, key: string): string[] {
  return text(form, key)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function bool(form: FormData, key: string): boolean {
  // Radix Select posts a string; native checkboxes post "on".
  const value = text(form, key);
  return value === 'on' || value === 'true';
}

function num(form: FormData, key: string, fallback: number): number {
  const parsed = Number(text(form, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Parse the repeated `faqQuestion` / `faqAnswer` inputs into pairs. */
function faqPairs(form: FormData) {
  const questions = form.getAll('faqQuestion').map(String);
  const answers = form.getAll('faqAnswer').map(String);
  return questions
    .map((question, index) => ({ question: question.trim(), answer: (answers[index] ?? '').trim() }))
    .filter((pair) => pair.question && pair.answer);
}

function citationList(form: FormData) {
  const titles = form.getAll('citationTitle').map(String);
  const urls = form.getAll('citationUrl').map(String);
  return titles
    .map((title, index) => ({ title: title.trim(), url: (urls[index] ?? '').trim() }))
    .filter((c) => c.title && /^https?:\/\//.test(c.url));
}

function alternateList(form: FormData) {
  const langs = form.getAll('altHreflang').map(String);
  const hrefs = form.getAll('altHref').map(String);
  return langs
    .map((hreflang, index) => ({ hreflang: hreflang.trim(), href: (hrefs[index] ?? '').trim() }))
    .filter((a) => a.hreflang && a.href);
}

export async function createPostAction(formData: FormData) {
  const title = text(formData, 'title');
  if (!title) throw new Error('제목은 필수입니다.');

  const repo = getRepository();
  // Natural-language slugs are preferred — the keyword stays in the URL.
  const slug = slugify(text(formData, 'slug') || title) || `post-${Date.now()}`;
  if (await repo.getBySlug(slug)) throw new Error(`슬러그 "${slug}"는 이미 존재합니다.`);

  const now = new Date().toISOString();
  await repo.save(
    {
      title,
      slug,
      status: 'draft',
      author: text(formData, 'author') || 'blog-writer',
      createdAt: now,
      updatedAt: now,
      category: text(formData, 'category') || 'general',
    },
    '## 개요\n\n여기서부터 작성하세요.\n',
  );

  revalidatePath('/');
  redirect(`/posts/${encodeURIComponent(slug)}`);
}

export async function savePostAction(formData: FormData) {
  const repo = getRepository();
  const slug = text(formData, 'slug');
  const existing = await repo.getBySlug(slug);
  if (!existing) throw new Error(`글을 찾을 수 없습니다: ${slug}`);

  const coverSrc = text(formData, 'coverSrc');
  const status = text(formData, 'status') as PostStatus;

  const frontmatter: PostFrontmatterInput = {
    ...existing,
    title: text(formData, 'title') || existing.title,
    description: text(formData, 'description'),
    status,
    author: text(formData, 'author') || existing.author,
    category: text(formData, 'category') || 'general',
    tags: list(formData, 'tags'),
    // Stamp the publish date the first time a post reaches `published`.
    publishedAt:
      status === 'published' ? (existing.publishedAt ?? new Date().toISOString()) : existing.publishedAt,
    cover: coverSrc
      ? {
          src: coverSrc,
          alt: text(formData, 'coverAlt'),
          // Provenance is chosen by a human here; agents set it via the
          // imagegen script. `claude` is not a member of ImageSource, so
          // Claude-generated images cannot be recorded at all.
          source: (text(formData, 'coverSource') || 'user-upload') as ImageSource,
          origin: text(formData, 'coverOrigin') || undefined,
          credit: text(formData, 'coverCredit') || undefined,
          license: text(formData, 'coverLicense') || undefined,
        }
      : undefined,
    seo: {
      title: text(formData, 'seoTitle') || undefined,
      description: text(formData, 'seoDescription') || undefined,
      keywords: list(formData, 'seoKeywords'),

      canonical: text(formData, 'seoCanonical') || undefined,
      noindex: bool(formData, 'seoNoindex'),
      nofollow: bool(formData, 'seoNofollow'),
      robotsDirectives: list(formData, 'seoRobotsDirectives'),

      ogType: (text(formData, 'seoOgType') || 'article') as 'article' | 'website',
      ogTitle: text(formData, 'seoOgTitle') || undefined,
      ogDescription: text(formData, 'seoOgDescription') || undefined,
      ogImage: text(formData, 'seoOgImage') || undefined,

      twitterCard: (text(formData, 'seoTwitterCard') || 'summary_large_image') as
        | 'summary'
        | 'summary_large_image',
      twitterSite: text(formData, 'seoTwitterSite') || undefined,
      twitterCreator: text(formData, 'seoTwitterCreator') || undefined,

      changefreq: (text(formData, 'seoChangefreq') || 'monthly') as never,
      priority: num(formData, 'seoPriority', 0.7),

      alternates: alternateList(formData),
      llmsTxt: bool(formData, 'seoLlmsTxt'),
    },
    geo: {
      locale: text(formData, 'geoLocale') || 'ko-KR',
      targetMarkets: list(formData, 'geoTargetMarkets'),
      answerSummary: text(formData, 'geoAnswerSummary') || undefined,
      entities: list(formData, 'geoEntities'),
      faq: faqPairs(formData),
      citations: citationList(formData),
    },
    review: existing.review,
  };

  await repo.save(frontmatter, text(formData, 'body'));

  revalidatePath('/');
  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/review/${slug}`);
}

export async function saveReviewAction(formData: FormData) {
  const repo = getRepository();
  const slug = text(formData, 'slug');
  const post = await repo.getBySlug(slug);
  if (!post) throw new Error(`글을 찾을 수 없습니다: ${slug}`);

  const status = (text(formData, 'status') || post.status) as PostStatus;

  await repo.save(
    {
      ...post,
      status,
      publishedAt:
        status === 'published' ? (post.publishedAt ?? new Date().toISOString()) : post.publishedAt,
      review: {
        reviewer: text(formData, 'reviewer') || undefined,
        reviewedAt: new Date().toISOString(),
        checks: {
          factual: bool(formData, 'checkFactual'),
          tone: bool(formData, 'checkTone'),
          seo: bool(formData, 'checkSeo'),
          geo: bool(formData, 'checkGeo'),
          images: bool(formData, 'checkImages'),
          links: bool(formData, 'checkLinks'),
        },
        notes: text(formData, 'notes') || undefined,
      },
    },
    post.body,
  );

  revalidatePath('/');
  revalidatePath(`/review/${slug}`);
}

export async function deletePostAction(formData: FormData) {
  await getRepository().remove(text(formData, 'slug'));
  revalidatePath('/');
  redirect('/');
}
