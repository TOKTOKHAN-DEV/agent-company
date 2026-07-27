# Orca AI Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
**Português** ·
[Русский](./README.ru.md)

> Template monorepo para tocar projetos de TI com um time de agentes de IA.
> O contexto sobrevive entre sessões e a qualidade é protegida por um portão de revisão.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## O que resolve

Quando você entrega um projeto para uma IA, duas coisas quebram repetidamente.

**O contexto some.** Assim que a sessão acaba ou a pessoa responsável muda, a IA não sabe mais o que foi
decidido. Ela repete discussões já encerradas e volta para abordagens que você já tinha descartado.

**Não há controle de qualidade.** Sem uma etapa de revisão, o que a IA produz vai direto para produção.

Este template bloqueia os dois **por estrutura**.

| Problema | Solução |
| --- | --- |
| Perda de contexto | `CLAUDE.md` + `AGENTS.md` + `wiki/` + memória curta/longa, carregados por um hook SessionStart |
| Controle de qualidade | Função de auditoria determinística + tela de revisão + botão de publicar que só um humano aperta |
| Papéis misturados | Agentes independentes separados por runtime + mapeamento explícito de modelos + paralelismo multiterminal |
| Procedência de imagens | Um único caminho via Codex `imagegen` + procedência registrada + tripla imposição |

---

## Instalação

### Opção 1 — Deixar com uma IA (uma linha, copiar e colar)

Abra qualquer uma das CLIs `claude`, `codex` ou `gemini` e cole a linha abaixo.
A IA lê o [INSTALL.md](../../INSTALL.md) e segue exatamente o que está lá.

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, read its INSTALL.md, and set it up exactly as written. When done, run `pnpm check` and show me the result.
```

<details>
<summary>Versão em português</summary>

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, leia o INSTALL.md e instale exatamente como está escrito. Ao terminar, rode `pnpm check` e me mostre o resultado.
```

</details>

O INSTALL.md cobre ferramentas obrigatórias e opcionais, procedimentos de fallback e solução de problemas,
então a IA consegue decidir sozinha onde travar. O `pnpm check` final informa de forma determinística se a
instalação deu certo.

### Opção 2 — Instalar você mesmo

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # checagem completa de dependências · preparo do ambiente · seguir a organização · dar star
pnpm dev       # web → :3000 · admin → :3001
```

Veja **[INSTALL.md](../../INSTALL.md)** para o procedimento detalhado e solução de problemas.

> O INSTALL.md está escrito em coreano por enquanto. Agentes de IA leem sem problema.

---

## Estrutura

```
orca-ai-company/
├── apps/
│   ├── web/              blog público (Next.js 16 App Router, :3000)
│   └── admin/            conteúdo · SEO/GEO · painel de revisão (:3001)
├── packages/
│   ├── content/          schema · drivers de armazenamento · auditoria · JSON-LD (fonte única da verdade)
│   └── supabase/         cliente · storage · migrações (inativo sem as chaves)
├── content/posts/        posts em markdown — driver padrão
├── docs/i18n/            traduções do README, 8 idiomas
├── agents/
│   ├── registry.yaml     runtime · modelo · permissões (fonte única da verdade)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        visão geral · arquitetura · convenções · guias · histórico
│   ├── decisions/        ADRs
│   └── memory/           memória de curto e longo prazo
├── .claude/
│   ├── settings.json     registro dos hooks
│   ├── hooks/            carregamento de contexto no SessionStart · guarda da política de imagens
│   └── skills/           3 comandos de barra
├── scripts/              scripts shell determinísticos
├── CLAUDE.md             instruções para o Claude Code
└── AGENTS.md             instruções para qualquer agente de codificação com IA
```

---

## Implementação de referência: um blog operado por IA

### web (`:3000`)

O blog público. Renderiza apenas posts com `status: published` de `content/posts/`.
Gera automaticamente JSON-LD (BlogPosting · FAQPage), `sitemap.xml`, `robots.txt` e `rss.xml`.
Crawlers de motores de resposta (GPTBot, ClaudeBot, PerplexityBot, …) são explicitamente permitidos.

### admin (`:3001`)

- **Editor** — texto rico com tiptap e upload de imagens. Sempre salvo em markdown
- **Painel de SEO técnico** — canonical · diretivas robots · OG/Twitter · priority do sitemap · hreflang
- **Painel GEO** — resumo extrativo · FAQ · entidades · citações · locale/mercados-alvo
- **Tela de revisão** — resultados da auditoria, prévia do JSON-LD, checklist humano, botão de publicar
- **Painel SEO/GEO** — pendências de todos os posts, agregadas por lane

A interface usa um select baseado em Radix em vez do `<select>` nativo: o menu desenhado pelo sistema
operacional ignora estilos e varia entre navegadores.

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   humano
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   revisão no admin → publicar
                 ↓
         review-and-submit → status: in_review
```

Os agentes só chegam até `in_review`. **Publicar é um ato humano.**

---

## Por que SEO e GEO são tratados separadamente

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| Alvo | Mecanismos de busca | Mecanismos de resposta (ChatGPT · Claude · Perplexity · AI Overviews) |
| Meta | **Posição** | **Ser citado** |
| Sinais-chave | Título · meta · links · velocidade | Estrutura extraível · perguntas e respostas explícitas · fontes · entidades |

Para ser citado, a página precisa ser fácil de extrair. Por isso o frontmatter tem um bloco GEO separado:
`geo.faq` vira JSON-LD `FAQPage` e `geo.answerSummary` vira um bloco de resumo no topo da página.

As regras práticas estão em [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md).

---

## SEO técnico

### Gerado automaticamente — nada a manter

| Caminho | Conteúdo |
| --- | --- |
| `/sitemap.xml` | Posts publicados com priority · changefreq · hreflang por post |
| `/robots.txt` | Bots de busca e de mecanismos de resposta liberados, `/api/` bloqueado |
| `/rss.xml` | Feed dos posts publicados |
| `/llms.txt` | **Resumo do site para LLMs** — modelos entendem o site sem analisar HTML |

`llms.txt` é a contraparte GEO do sitemap. O sitemap diz *onde* estão as URLs; o llms.txt diz *o que é
este site e quais posts existem*. Cada entrada reaproveita o `geo.answerSummary` do post, então preencher
esse resumo rende em dobro.

### Por post, no admin

canonical · noindex/nofollow · diretivas robots (`max-snippet`, …) · cards OG/Twitter ·
priority/changefreq do sitemap · hreflang · incluir ou não o post no llms.txt.

### Search console e analytics

Preencha um valor no `.env` para ligar cada um. **Se deixar vazio, a tag ou o script nunca é emitido.**

| Variável | Destino |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver Search Advisor |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (carregado com `afterInteractive`) |

### Slugs em linguagem natural

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

Caracteres não-ASCII são preservados. Manter a palavra-chave na URL é um sinal real de ranqueamento e de
cliques, e um slug transliterado é ilegível justamente para o público-alvo.

Detalhes: [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## Backend — arquivos agora, Supabase depois

O código da aplicação nunca toca o armazenamento diretamente. Ele só enxerga uma interface.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← escolhido automaticamente conforme existam chaves
   ├── file       content/posts/*.md   (padrão · o estado atual)
   └── supabase   Postgres + Storage   (assim que houver chaves)
```

**Não ter chaves é o estado normal.** `pnpm install && pnpm dev` funciona direto. Para migrar:

1. Coloque as três chaves do Supabase no `.env`
2. Aplique `packages/supabase/migrations/0001_init.sql`
3. `pnpm --filter @orca/supabase migrate` — move os posts existentes (idempotente; os arquivos ficam)

Nenhuma linha do código da aplicação muda. `CONTENT_DRIVER=file` reverte a qualquer momento.

Uma política de RLS restringe a chave anon a posts `published` que não sejam `noindex` — a última linha de
defesa para que um bug na aplicação ainda assim não vaze um rascunho.

Detalhes: [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## Como o contexto é preservado

Quando uma sessão começa, um hook injeta automaticamente:

```
regras rígidas → índice do wiki → memória longa → memória curta recente → agentes → status do git
```

Ele carrega **o índice, não o wiki inteiro.** Você entrega um mapa ao modelo e deixa que ele abra o que
precisar.

### Memória em dois níveis

```
curto prazo ──(referenciada 3+ vezes / confirmada ainda válida)──▶ longo prazo
longo prazo ──(vira regra do projeto)────────────────────────────▶ documento do wiki ou ADR
```

A promoção é gerenciada pela skill `/save-memory`.

---

## Política de imagens (regra rígida)

**Imagens são geradas somente pelo Codex `imagegen`. É proibido o Claude gerar imagens.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<descrição da cena>"
```

Se o Codex não estiver disponível, siga esta ordem de fallback:

1. **Seguir sem imagem** — o padrão. Capa não é requisito para publicar.
2. **O usuário anexa uma** — `source: user-upload`
3. **Busca na web** — verificação de licença obrigatória. `source: web-search` mais `license` registrada

Regra que vive apenas na documentação não se sustenta, então esta é **imposta em três camadas**:

| Camada | Mecanismo |
| --- | --- |
| Tipos | `ImageSource` não tem valor `claude` algum |
| Hook | `PreToolUse` bloqueia comandos de geração de imagem fora do Codex |
| Auditoria | Procedência ausente ou imagem web sem licença é erro → publicação bloqueada |

Justificativa: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Skills (comandos de barra)

| Comando | O que faz |
| --- | --- |
| `/orca-setup` | Checagem completa de dependências · instalação · seguir a organização · dar star (script determinístico) |
| `/save-memory` | Salva o aprendizado da sessão na memória curta e promove para longa/wiki quando faz sentido |
| `/create-agent` | Cria um agente novo em registry + AGENT.md + skills/ de forma consistente |

As skills que um agente lê (`agents/<id>/skills/`) são outra coisa: playbooks neutros quanto ao runtime que
o launcher injeta no prompt de sistema — o agente codex também as lê.

---

## Agentes

**Não são subagentes do Claude.** Cada um é um processo independente no próprio terminal, e os runtimes são
diferentes. É isso que permite ao Orca executá-los de fato em paralelo entre terminais.

| ID | Runtime | Modelo | Papel |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | planejar → escrever → SEO/GEO → revisar |
| `image-maker` | `codex` | default | gerar imagens com imagegen · registrar procedência |

```bash
pnpm agent --list
pnpm agent blog-writer "Escreva um post sobre a estratégia de cache do Turborepo"
pnpm agent image-maker "Imagem de capa para turborepo-cache-strategy"
```

```
agents/blog-writer/
├── AGENT.md                       injetado como prompt de sistema
└── skills/
    ├── plan-post/SKILL.md         planejamento · checagem de duplicidade · esboço
    ├── write-draft/SKILL.md       escrita do corpo
    ├── optimize-seo-geo/SKILL.md  metadados
    └── review-and-submit/SKILL.md auditoria · in_review
```

O launcher monta `AGENT.md` mais um índice de skills (gerado ao varrer a pasta) no prompt de sistema e sobe
a CLI certa com o modelo certo. Adicionar uma skill passa a valer na hora, sem registro separado.

### Por que só dois

**A linha divisória é runtime e paralelismo, não papel.** As quatro etapas do pipeline de conteúdo mexem no
mesmo arquivo em sequência, então não há ganho em separá-las em processos — foram separadas em skills. Já as
imagens exigem um runtime diferente (só Codex), e essa fronteira não é negociável: virou fronteira de
processo, e a regra virou estrutura.

Regras multiterminal: [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md).

---

## Comandos

| Comando | Descrição |
| --- | --- |
| `pnpm setup` | Checagem completa do ambiente + instalação + seguir/star no GitHub |
| `pnpm check` | Só checa o estado do ambiente (não instala nada) |
| `pnpm dev` | Roda web e admin juntos |
| `pnpm dev:web` / `pnpm dev:admin` | Execução individual |
| `pnpm build` | Compila os dois apps |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm audit:content` | Roda o portão de publicação pela CLI (mesma função da tela de revisão) |
| `pnpm context` | Imprime o contexto da sessão manualmente |
| `pnpm imagegen` | Gera imagem com o Codex |
| `pnpm memory:new <topic>` | Cria um arquivo de memória (`--long` para longo prazo) |
| `pnpm --filter @orca/supabase migrate` | Move posts dos arquivos para o Supabase (suporta `--dry-run`) |

---

## Adaptando para outro domínio

O blog é uma referência para tornar o template concreto. Para virar e-commerce, dashboard ou site de
documentação:

1. Troque o schema em `packages/content/src/schema.ts`
2. Troque as regras de auditoria em `packages/content/src/audit.ts`
3. Reconstrua os agentes em `agents/` via `/create-agent`
4. Troque `wiki/03` e `wiki/04` pelos guias do seu domínio

**O que permanece**: os hooks, a estrutura de memória, o padrão de portão de revisão, a política de imagens
e o esqueleto do monorepo. Essa parte é o valor real do template.

---

## Stack

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## Licença

MIT
