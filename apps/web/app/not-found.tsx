import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="text-[var(--color-muted)]">요청한 글을 찾을 수 없습니다. 아직 발행 전일 수 있습니다.</p>
      <Link href="/blog" className="inline-block text-[var(--color-accent)] underline underline-offset-4">
        글 목록으로
      </Link>
    </div>
  );
}
