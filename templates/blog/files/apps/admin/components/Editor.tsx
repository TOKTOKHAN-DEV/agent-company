'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';

import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';

/**
 * Rich text editor for post bodies.
 *
 * Storage is markdown; tiptap edits HTML. Conversion happens here and a hidden
 * textarea carries the markdown so the surrounding server-action form submits
 * normally — no client state library, no API round-trip on save.
 */

interface EditorProps {
  name: string;
  defaultValue: string;
  slug: string;
}

export function Editor({ name, defaultValue, slug }: EditorProps) {
  const [markdown, setMarkdown] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Tiptap renders on the client only; SSR would mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // h1 belongs to the post title
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: markdownToHtml(defaultValue),
    editorProps: {
      attributes: {
        class:
          'prose-editor min-h-[26rem] w-full rounded-b-lg border border-t-0 border-neutral-300 bg-white px-4 py-3 outline-none focus:border-[var(--color-accent)]',
      },
    },
    onUpdate: ({ editor }) => setMarkdown(htmlToMarkdown(editor.getHTML())),
  });

  // Keep the hidden field in sync if the incoming post changes.
  useEffect(() => {
    setMarkdown(defaultValue);
  }, [defaultValue]);

  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const body = new FormData();
        body.append('file', file);
        body.append('slug', slug);

        const response = await fetch('/api/upload', { method: 'POST', body });
        const result = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !result.url) {
          throw new Error(result.error ?? '업로드에 실패했습니다.');
        }

        // Alt text is a publish-gate requirement, so prompt for it up front
        // rather than letting an empty alt reach the audit.
        const alt = window.prompt('대체 텍스트 (보이는 것을 설명하세요)', file.name) ?? '';
        editor?.chain().focus().setImage({ src: result.url, alt }).run();
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : String(error));
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [editor, slug],
  );

  if (!editor) {
    return (
      <div className="min-h-[30rem] animate-pulse rounded-lg border border-neutral-300 bg-neutral-50" />
    );
  }

  return (
    <div>
      <input type="hidden" name={name} value={markdown} />

      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-neutral-300 bg-neutral-50 px-2 py-1.5">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="굵게">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="기울임">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} label="취소선">
          <s>S</s>
        </ToolbarButton>

        <Divider />

        {([2, 3, 4] as const).map((level) => (
          <ToolbarButton
            key={level}
            active={editor.isActive('heading', { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            label={`제목 ${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}

        <Divider />

        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="글머리 목록">
          • 목록
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="번호 목록">
          1. 목록
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="인용">
          ❝
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="코드 블록">
          {'</>'}
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const previous = editor.getAttributes('link').href as string | undefined;
            const url = window.prompt('링크 URL', previous ?? 'https://');
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url }).run();
          }}
          label="링크"
        >
          🔗
        </ToolbarButton>

        <ToolbarButton onClick={() => fileInputRef.current?.click()} label="이미지 업로드" disabled={uploading}>
          {uploading ? '업로드 중…' : '🖼 이미지'}
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadImage(file);
          }}
        />
      </div>

      <EditorContent editor={editor} />

      {uploadError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        저장 형식은 마크다운입니다. 업로드한 이미지는 <code className="font-mono">user-upload</code> 로
        기록됩니다 — 이미지 <strong>생성</strong>은 Codex imagegen 전용입니다.
      </p>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={`rounded-md px-2 py-1 text-sm transition-colors disabled:opacity-40 ${
        active ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden="true" />;
}
