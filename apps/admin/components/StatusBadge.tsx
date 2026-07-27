import type { PostStatus } from '@orca/content';

const STYLES: Record<PostStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  in_review: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-neutral-200 text-neutral-500',
};

const LABELS: Record<PostStatus, string> = {
  draft: '초안',
  in_review: '검수 중',
  scheduled: '예약',
  published: '발행됨',
  archived: '보관',
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 85 ? 'bg-emerald-100 text-emerald-800' : score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}>{score}</span>;
}
