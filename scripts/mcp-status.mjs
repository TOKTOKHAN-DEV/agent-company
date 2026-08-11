#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// mcp-status.mjs — 이름으로 준 MCP 서버가 등록되어 있는지 확인한다.
//
// 사용:  node scripts/mcp-status.mjs <name> [<name> ...]
// 출력:  "<name>\t<registered|missing>\t<scope>"  (한 줄에 하나)
//
// 왜 `claude mcp list` 를 쓰지 않는가: 그 명령은 각 서버에 접속해 헬스체크를
// 합니다. 네트워크가 끼면 `pnpm check` 가 느려지고 결과가 흔들립니다.
// 검사는 결정적이어야 하므로 설정 파일만 읽습니다.
//
// MCP 서버는 네 군데에 등록될 수 있습니다:
//   ~/.claude.json        mcpServers              (user 스코프)
//   ~/.claude.json        projects[cwd].mcpServers (local 스코프)
//   ./.mcp.json           mcpServers              (project 스코프, 커밋됨)
//   ~/.codex/config.toml  [mcp_servers.<name>]    (codex)
//
// 등록 여부만 봅니다. **인증 여부는 알 수 없습니다** — OAuth 토큰은 별도
// 저장소에 있고, 확인하려면 결국 네트워크를 타야 합니다.
// ─────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const names = process.argv.slice(2).filter(Boolean);
if (names.length === 0) process.exit(0);

/** 실패해도 조용히 넘어간다 — 설정 파일이 없는 것은 정상이다. */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const found = new Map(); // name -> scope

function collect(obj, scope) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (!found.has(key)) found.set(key, scope);
  }
}

const claudeJson = readJson(join(homedir(), ".claude.json"));
if (claudeJson) {
  collect(claudeJson.mcpServers, "user");
  const project = claudeJson.projects?.[process.cwd()];
  collect(project?.mcpServers, "local");
}

collect(readJson(join(process.cwd(), ".mcp.json"))?.mcpServers, "project");

// codex 는 TOML 입니다. 파서를 들이지 않고 섹션 헤더만 읽습니다 —
// 우리가 알아야 하는 건 "그 이름이 등록되어 있는가" 하나뿐입니다.
for (const m of readText(join(homedir(), ".codex", "config.toml")).matchAll(
  /^\s*\[mcp_servers\.["']?([^\]"']+)["']?\]/gm,
)) {
  const key = m[1];
  if (!found.has(key)) found.set(key, "codex");
}

for (const name of names) {
  const scope = found.get(name);
  process.stdout.write(`${name}\t${scope ? "registered" : "missing"}\t${scope ?? "-"}\n`);
}
