#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# template.sh — 템플릿을 조회하고 레포 루트에 펼친다.
#
# 사용:
#   bash scripts/template.sh list              등록된 템플릿 목록
#   bash scripts/template.sh current           현재 적용된 템플릿 id (없으면 none)
#   bash scripts/template.sh meta <id> <key>   매니페스트 값 읽기 (반복 키는 여러 줄)
#   bash scripts/template.sh apply <id> [--force]
#   bash scripts/template.sh prune [--force]   안 쓰는 카탈로그 · 랜딩 정리
#
# 매니페스트는 templates/<id>/template.yaml 이고, 실제 내용물은
# templates/<id>/files/ 아래에 레포 루트 기준 경로 그대로 들어 있습니다.
#
# 왜 셸인가: 셋업은 결정적이어야 합니다. 모델이 매번 다르게 해석하는
# 체크리스트가 아니라, 항상 같은 순서로 같은 파일을 같은 자리에 놓습니다.
#
# 왜 템플릿이 별도 레포가 아닌가: 매니페스트 키는 코어 스크립트와 lockstep 으로
# 움직입니다. sed 로 읽으므로 모르는 키는 조용히 무시되고, 원격 템플릿이 구버전이면
# 에러 없이 검사가 통째로 빠집니다. 한 레포에 두면 이 문제가 원천 봉쇄됩니다.
# 그리고 셋업 중간에 네트워크가 끼면 "두 번 돌려도 같은 상태"라는 약속이 깨집니다.
# 원격으로 이행해야 할 때 손댈 곳은 cmd_apply 의 파일 펼치기 한 곳뿐입니다.
# ─────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

TEMPLATES_DIR="templates"
STATE_DIR=".company/state"
STATE_FILE="$STATE_DIR/company"
# 이 파일이 있으면 여기는 **제품 레포**입니다. 카탈로그와 랜딩이 이 레포의 내용물이므로
# 정리 대상이 아닙니다. Use this template 으로 만들어진 사용자 프로젝트에는 없습니다.
PRODUCT_MARKER=".company/PRODUCT"
SITE_DIR="site"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
[ -t 1 ] || { RED=''; GREEN=''; YELLOW=''; DIM=''; BOLD=''; RESET=''; }

die() { printf '%s✘%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

manifest_of() { printf '%s/%s/template.yaml' "$TEMPLATES_DIR" "$1"; }

# 반복 키를 모두 출력한다. `key: value` 에서 value 만.
meta_all() {
  local m; m="$(manifest_of "$1")"
  [ -f "$m" ] || return 1
  sed -n "s/^$2:[[:space:]]*//p" "$m"
}
meta() { meta_all "$1" "$2" | head -n1; }

# 매니페스트의 `order:` 순으로 출력한다. 없으면 50.
# 알파벳 순에 맡기면 blank 가 app-in-toss 와 blog 사이에 끼어 목록 순서가
# 의도와 달라집니다. 순서는 의도이므로 매니페스트가 정합니다.
template_ids() {
  local d id
  for d in "$TEMPLATES_DIR"/*/; do
    [ -f "$d/template.yaml" ] || continue
    id="$(basename "$d")"
    printf '%s\t%s\n' "$(meta "$id" order || true)" "$id"
  done | awk -F'\t' '{ printf "%s\t%s\n", ($1 == "" ? 50 : $1), $2 }' \
       | sort -n -k1,1 -k2,2 | cut -f2
}

current_id() { [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || printf 'none'; }

# ── list ─────────────────────────────────────────────────────
cmd_list() {
  local cur; cur="$(current_id)"
  printf '%s등록된 템플릿%s\n\n' "$BOLD" "$RESET"
  local id name status summary mark
  for id in $(template_ids); do
    name="$(meta "$id" name)"
    status="$(meta "$id" status)"
    summary="$(meta "$id" summary)"
    if [ "$id" = "$cur" ]; then mark="${GREEN}●${RESET}"; else mark=' '; fi
    printf '  %s %-18s %s%-8s%s %s\n' "$mark" "$id" "$DIM" "$status" "$RESET" "$name"
    printf '    %s%s%s\n' "$DIM" "$summary" "$RESET"
  done
  printf '\n%s적용:%s bash scripts/template.sh apply <id>\n' "$BOLD" "$RESET"
  [ "$cur" != "none" ] && printf '%s현재:%s %s\n' "$BOLD" "$RESET" "$cur"
  return 0
}

# ── apply ────────────────────────────────────────────────────
cmd_apply() {
  local id="${1:-}" force=0
  shift || true
  for a in "$@"; do [ "$a" = "--force" ] && force=1; done

  [ -n "$id" ] || die "템플릿 id 가 필요합니다. 'bash scripts/template.sh list' 로 확인하세요."
  [ -f "$(manifest_of "$id")" ] || die "그런 템플릿이 없습니다: $id"

  # planned 는 매니페스트만 있고 내용물이 없습니다. 빈 껍데기를 펼쳐 놓고
  # 나중에 "왜 안 되지" 하게 만드는 것보다, 여기서 막고 이유를 말합니다.
  local status; status="$(meta "$id" status)"
  if [ "$status" = "planned" ]; then
    printf '%s✘%s %s 는 아직 준비 중입니다 (status: planned).\n\n' "$RED" "$RESET" "$id" >&2
    printf '매니페스트에 의도만 적혀 있고 %s/%s/files/ 내용물이 없습니다.\n' "$TEMPLATES_DIR" "$id" >&2
    printf '지금 쓸 수 있는 템플릿: bash scripts/template.sh list\n' >&2
    exit 1
  fi

  [ -d "$TEMPLATES_DIR/$id/files" ] || die "$TEMPLATES_DIR/$id/files 가 없습니다 — 템플릿이 비어 있습니다."

  local prev; prev="$(current_id)"
  if [ "$prev" != "none" ] && [ "$prev" != "$id" ] && [ "$force" -eq 0 ]; then
    printf '%s✘%s 이미 %s 가 적용되어 있습니다.\n\n' "$RED" "$RESET" "$prev" >&2
    printf '템플릿을 바꾸면 이전 템플릿이 놓은 파일이 그대로 남습니다.\n' >&2
    printf '덮어쓰는 것은 안전하지만 정리는 직접 하셔야 합니다.\n\n' >&2
    printf '  bash scripts/template.sh apply %s --force\n' "$id" >&2
    exit 1
  fi

  # 미리보기 상태 템플릿은 경고를 남긴다. 나중에 "왜 안 되지" 하는 것보다 낫다.
  if [ "$status" = "preview" ]; then
    printf '%s!%s %s 는 preview 입니다 — 뼈대는 돌지만 다듬을 곳이 남아 있습니다.\n' \
      "$YELLOW" "$RESET" "$id"
  fi

  # ── 파일 펼치기 ────────────────────────────────────────────
  local n
  n="$(find "$TEMPLATES_DIR/$id/files" -type f | wc -l | tr -d ' ')"
  [ "$n" -gt 0 ] || die "$TEMPLATES_DIR/$id/files 에 파일이 없습니다 — 펼칠 것이 없습니다."
  cp -R "$TEMPLATES_DIR/$id/files/." "$ROOT/" || die "파일 복사 실패"
  printf '  %s✔%s %s개 파일을 루트에 펼쳤습니다\n' "$GREEN" "$RESET" "$n"

  # ── package.json 스크립트 병합 ─────────────────────────────
  # 이전 템플릿의 키는 정확히 회수하고 새 템플릿의 키를 넣는다.
  local add_list drop_list
  add_list="$(meta_all "$id" script)"
  drop_list=""
  [ "$prev" != "none" ] && [ "$prev" != "$id" ] && drop_list="$(meta_all "$prev" script 2>/dev/null || true)"

  local tmp; tmp="$(mktemp -t company-tpl-XXXXXX)"
  ADD="$add_list" DROP="$drop_list" node -e '
    const fs = require("fs");
    const p = "package.json";
    const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
    pkg.scripts = pkg.scripts || {};
    const keyOf = (line) => line.slice(0, line.indexOf("="));
    const lines = (s) => (s || "").split("\n").filter((l) => l.includes("="));
    for (const l of lines(process.env.DROP)) delete pkg.scripts[keyOf(l)];
    let added = 0;
    for (const l of lines(process.env.ADD)) {
      const k = keyOf(l), v = l.slice(k.length + 1);
      if (pkg.scripts[k] !== v) added++;
      pkg.scripts[k] = v;
    }
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
    process.stdout.write(String(added));
  ' >"$tmp" 2>/dev/null \
    && printf '  %s✔%s package.json 스크립트 %s개 반영\n' "$GREEN" "$RESET" "$(cat "$tmp")" \
    || printf '  %s!%s package.json 병합 실패 — 스크립트를 직접 확인하세요\n' "$YELLOW" "$RESET"
  rm -f "$tmp"

  # ── 상태 기록 ──────────────────────────────────────────────
  mkdir -p "$STATE_DIR"
  printf '%s' "$id" > "$STATE_FILE"
  printf '  %s✔%s 현재 회사: %s%s%s\n' "$GREEN" "$RESET" "$BOLD" "$id" "$RESET"

  if [ "$prev" != "none" ] && [ "$prev" != "$id" ]; then
    printf '  %s!%s %s 가 놓았던 파일은 남아 있습니다 — 필요 없으면 직접 지우세요\n' \
      "$YELLOW" "$RESET" "$prev"
  fi
  return 0
}

# ── prune ────────────────────────────────────────────────────
# 프로젝트 하나는 회사 하나입니다. 고르고 나면 나머지 카탈로그와 제품 랜딩은
# 그 프로젝트에 아무 의미가 없으므로 지웁니다.
#
# 단, 적용된 템플릿의 **매니페스트는 남깁니다.** check-deps.sh 와 load-context.sh 가
# verify-* 와 rule: 을 계속 읽기 때문입니다. 지우면 검사와 하드 룰 주입이 조용히 사라집니다.
cmd_prune() {
  local force=0 a
  for a in "$@"; do [ "$a" = "--force" ] && force=1; done

  local cur; cur="$(current_id)"
  if [ "$cur" = "none" ]; then
    die "적용된 템플릿이 없습니다. 먼저 apply 하세요 — 지금 지우면 카탈로그만 사라집니다."
  fi

  if [ -f "$PRODUCT_MARKER" ] && [ "$force" -eq 0 ]; then
    printf '%s·%s 제품 레포입니다 (%s) — 카탈로그와 랜딩은 이 레포의 내용물이라 정리하지 않습니다.\n' \
      "$DIM" "$RESET" "$PRODUCT_MARKER"
    return 0
  fi

  local kept=0 removed=0 id
  for id in $(template_ids); do
    if [ "$id" = "$cur" ]; then
      # files/ 는 이미 루트에 펼쳐졌으니 중복입니다. 매니페스트와 README 만 남깁니다.
      if [ -d "$TEMPLATES_DIR/$id/files" ]; then
        rm -rf "$TEMPLATES_DIR/$id/files"
        printf '  %s✔%s %s/files 제거 (루트에 이미 펼쳐져 있음)\n' "$GREEN" "$RESET" "$id"
      fi
      printf '  %s·%s %s/template.yaml 유지 — check-deps · load-context 가 읽습니다\n' \
        "$DIM" "$RESET" "$id"
      kept=$((kept + 1))
    else
      rm -rf "${TEMPLATES_DIR:?}/$id"
      removed=$((removed + 1))
    fi
  done
  [ "$removed" -gt 0 ] && printf '  %s✔%s 안 쓰는 템플릿 %s개 제거\n' "$GREEN" "$RESET" "$removed"

  if [ -d "$SITE_DIR" ]; then
    rm -rf "${SITE_DIR:?}"
    printf '  %s✔%s %s/ 제거 (제품 랜딩 — 이 프로젝트의 것이 아닙니다)\n' "$GREEN" "$RESET" "$SITE_DIR"
  fi

  printf '\n%s정리 완료%s — 이 저장소는 이제 %s 회사 하나입니다.\n' "$BOLD" "$RESET" "$cur"
  printf '%s다른 템플릿이 다시 필요하면 upstream 에서 가져오세요:%s\n' "$DIM" "$RESET"
  printf '  %sgit remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git%s\n' "$DIM" "$RESET"
  printf '  %sgit fetch upstream && git checkout upstream/main -- templates/%s\n' "$DIM" "$RESET"
  return 0
}

# ── 진입점 ───────────────────────────────────────────────────
case "${1:-}" in
  list)    cmd_list ;;
  current) current_id; printf '\n' ;;
  meta)    [ $# -ge 3 ] || die "사용: template.sh meta <id> <key>"; meta_all "$2" "$3" ;;
  ids)     template_ids ;;
  apply)   shift; cmd_apply "$@" ;;
  prune)   shift; cmd_prune "$@" ;;
  ""|-h|--help)
    sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *) die "알 수 없는 명령: $1  (list | current | ids | meta | apply | prune)" ;;
esac
