import { Marked } from 'marked';

const marked = new Marked({ gfm: true, breaks: false });

/** Render a post body to HTML. Content is repo-authored, so it is trusted. */
export function renderMarkdown(body: string): string {
  return marked.parse(body, { async: false });
}

export function formatDate(iso: string | undefined, locale = 'ko-KR'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
