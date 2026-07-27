import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">찾을 수 없음</h1>
      <p className="text-neutral-500">해당 글이 존재하지 않습니다.</p>
      <Link href="/" className="text-[var(--color-accent)] underline underline-offset-4">
        대시보드로
      </Link>
    </div>
  );
}
