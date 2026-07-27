#!/usr/bin/env node --experimental-strip-types
/**
 * audit.ts — 발행 게이트를 커맨드라인에서 실행한다.
 *
 * 사용:
 *   pnpm audit:content              # 모든 글
 *   pnpm audit:content <slug>       # 한 글
 *   pnpm audit:content --errors     # error 가 있는 글만
 *
 * 종료 코드: 0 = 전부 발행 가능, 1 = error 가 있는 글이 존재
 *
 * admin 검수 화면과 **같은 함수**를 씁니다. 사람과 에이전트가 다른 결과를 보면
 * 게이트의 의미가 없어집니다.
 */
import { auditPost, getRepository } from '../packages/content/src/index.ts';
import type { Post } from '../packages/content/src/index.ts';

const args = process.argv.slice(2);
const errorsOnly = args.includes('--errors');
const slug = args.find((a) => !a.startsWith('--'));

const isTTY = process.stdout.isTTY;
const c = {
  red: isTTY ? '\x1b[31m' : '',
  green: isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  reset: isTTY ? '\x1b[0m' : '',
};

const repo = getRepository();

let posts: Post[];
if (slug) {
  const post = await repo.getBySlug(slug);
  if (!post) {
    console.error(`글을 찾을 수 없습니다: ${slug}`);
    process.exit(2);
  }
  posts = [post];
} else {
  const { posts: all, errors } = await repo.getAll();
  for (const error of errors) console.error(`${c.red}파싱 실패${c.reset} ${error}`);
  if (errors.length > 0) process.exitCode = 1;
  posts = all;
}

let blocked = 0;

for (const post of posts) {
  const audit = auditPost(post);
  const errorCount = audit.issues.filter((i) => i.severity === 'error').length;

  if (errorsOnly && errorCount === 0) continue;
  if (errorCount > 0) blocked++;

  const tone = audit.score >= 85 ? c.green : audit.score >= 60 ? c.yellow : c.red;
  console.log(
    `\n${c.bold}${post.title}${c.reset} ${c.dim}(${post.slug} · ${post.status})${c.reset}  ${tone}${audit.score}${c.reset}`,
  );

  for (const issue of audit.issues) {
    const mark =
      issue.severity === 'error'
        ? `${c.red}✘${c.reset}`
        : issue.severity === 'warn'
          ? `${c.yellow}!${c.reset}`
          : `${c.dim}·${c.reset}`;
    console.log(`  ${mark} ${c.dim}[${issue.lane}]${c.reset} ${issue.field} — ${issue.message}`);
  }

  if (audit.issues.length === 0) console.log(`  ${c.green}✔${c.reset} 문제 없음`);
  if (!audit.publishable) console.log(`  ${c.red}발행 불가${c.reset} — error 를 먼저 해결하세요.`);
}

console.log(`\n${'─'.repeat(46)}`);
if (blocked > 0) {
  console.log(`${c.red}${blocked}개 글에 error 가 있어 발행할 수 없습니다.${c.reset}`);
  process.exit(1);
}
console.log(`${c.green}검사한 ${posts.length}개 글 모두 발행 가능합니다.${c.reset}`);
