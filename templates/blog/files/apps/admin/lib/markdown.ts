import { Marked } from 'marked';
import TurndownService from 'turndown';

/**
 * Markdown ⇄ HTML bridge for the tiptap editor.
 *
 * Storage stays markdown regardless of backend — that is what makes a post
 * reviewable in a git diff and portable out of this template. Tiptap only
 * speaks HTML, so we convert at the editor boundary and nowhere else.
 */

const marked = new Marked({ gfm: true, breaks: false });

const turndown = new TurndownService({
  headingStyle: 'atx', // "## Heading", matching what agents write
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
});

// Turndown drops the language class on code blocks by default, which would
// silently strip ```ts fences that the content guidelines require.
turndown.addRule('fencedCodeWithLanguage', {
  filter: (node) =>
    node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE',
  replacement: (_content, node) => {
    const code = (node as HTMLElement).firstChild as HTMLElement;
    const className = code.getAttribute('class') ?? '';
    const language = /language-(\S+)/.exec(className)?.[1] ?? '';
    // textContent already ends with a newline; adding another leaves a blank
    // line before the closing fence on every save.
    const source = (code.textContent ?? '').replace(/\n+$/, '');
    return `\n\n\`\`\`${language}\n${source}\n\`\`\`\n\n`;
  },
});

// Preserve alt text and title on images — alt is a publish-gate requirement.
turndown.addRule('image', {
  filter: 'img',
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const alt = el.getAttribute('alt') ?? '';
    const src = el.getAttribute('src') ?? '';
    const title = el.getAttribute('title');
    return src ? `![${alt}](${src}${title ? ` "${title}"` : ''})` : '';
  },
});

/**
 * Turndown pads list markers to a fixed width (`-   item`, `1.  item`).
 * That is valid markdown, but it differs from what agents and humans write by
 * hand, so every save through the editor would rewrite untouched lines. In
 * this project the git diff *is* the review artifact (ADR-0001), so the output
 * is normalised to single-space markers.
 *
 * Fenced code is skipped — a line inside a fence may legitimately start with
 * something that looks like a list marker.
 */
function normalizeListMarkers(markdown: string): string {
  let insideFence = false;

  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        insideFence = !insideFence;
        return line;
      }
      if (insideFence) return line;

      return line
        .replace(/^(\s*)[-*+]\s{2,}/, '$1- ')
        .replace(/^(\s*)(\d+)\.\s{2,}/, '$1$2. ');
    })
    .join('\n');
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false });
}

export function htmlToMarkdown(html: string): string {
  return normalizeListMarkers(turndown.turndown(html)).trim();
}
