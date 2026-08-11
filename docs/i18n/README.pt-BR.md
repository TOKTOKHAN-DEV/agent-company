# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
**Português** ·
[Русский](./README.ru.md)

> Um monorepo tocado por um time de IA.
> Um organograma, um regimento interno, memória que sobrevive à sessão e um botão de publicação que só uma pessoa aperta.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Visão geral do projeto

IDEs para agentes como Orca e Paseo oferecem um ambiente de trabalho: worktrees em paralelo, um
terminal por agente, uma visão de diff. Só que, quando você toca um projeto de verdade neles, os
mesmos problemas costumam aparecer.

O histórico do que já foi feito não fica. A sessão termina, ou outro agente assume, e as decisões
anteriores somem. Você acaba explicando de novo o que já tinha sido resolvido, e às vezes o
trabalho volta para uma abordagem que já havia sido descartada.

Revisar o resultado também não é simples. Por isso é preciso um lugar onde uma pessoa confere o
trabalho e o publica. Num blog é uma página de administração; num mini app da Toss são a checagem
prévia ao envio e o console.

Nenhum dos dois se resolve lapidando prompts. Colocamos um sistema em cada ponto onde as coisas
desandam.

| O que desanda | Sistema | Como é imposto |
| --- | --- | --- |
| Perda de contexto | Manual · índice do wiki · memória de curto/longo prazo carregam a cada início de sessão | Hook SessionStart |
| Desvio de qualidade | O portão de publicação é uma função determinística. Pessoas e agentes veem o mesmo veredito | Nenhuma chamada de LLM dentro |
| Papéis misturados | Cada agente declara runtime, modelo e escopo de escrita | `agents/registry.yaml` |
| Recursos sem procedência | Um único caminho para gerar imagens, com procedência registrada em cada recurso | Guarda de ferramentas + auditoria |
| Publicação acidental | Os agentes vão até `in_review` e param. O botão é apertado por uma pessoa | Esse caminho não existe nos tipos |

---

## Instalação

### Deixe um agente fazer (recomendado)

Cole isto exatamente assim no agente de código que você usa: Claude Code, Codex, Cursor, Gemini
CLI.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

O guia se basta, do clone até a verificação. Se a pasta atual estiver vazia, ele clona ali mesmo, e
cada ferramenta obrigatória ou opcional está descrita junto com seu plano alternativo, de modo que
o agente consegue decidir sozinho onde travar.

### Na mão

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # checar dependências → escolher que empresa montar → preparar ambiente → verificar
pnpm dev
```

Para o procedimento completo e a solução de problemas, veja [INSTALL.md](../../INSTALL.md).

> É `pnpm company-setup`, não `pnpm setup`. `setup` é um comando embutido do pnpm, então um script
> com esse nome ficaria encoberto.

---

## Núcleo e templates

O repositório é feito de duas camadas. O núcleo é o mesmo em qualquer empresa, e o template decide
o que será construído.

```
agent-company/
│
├── ── núcleo (sempre presente) ─────────────────────
│   ├── .claude/          hooks (SessionStart · PreToolUse) · comandos de barra
│   ├── wiki/             conhecimento do projeto + memória de curto/longo prazo + ADRs
│   ├── agents/           onde fica o quadro de agentes (registry.yaml + <id>/)
│   ├── scripts/          scripts de shell determinísticos
│   ├── CLAUDE.md         instruções para o Claude Code
│   └── AGENTS.md         instruções comuns a todo agente de código com IA
│
├── ── templates (escolha um e aplique) ─────────────
│   └── templates/<id>/
│       ├── template.yaml   manifesto — scripts · verificações · regras rígidas · próximos passos
│       └── files/          caminhos relativos à raiz do repo (apps/ · packages/ · agents/ …)
│
└── ── produto (somente neste repo) ─────────────────
    └── site/               landing. um único HTML estático, sem build → Vercel
```

`pnpm company-setup` faz você escolher um template, copia `templates/<id>/files/` para a raiz e
depois mescla os `script:` do manifesto no `package.json` da raiz. Ao trocar de template, apenas as
chaves de script que o anterior tinha adicionado são recolhidas.

### Templates disponíveis

| id | status | o que entrega | quadro | portão |
| --- | --- | --- | --- | --- |
| [`blog-autopublish`](../../templates/blog-autopublish/README.md) | stable | site público + mesa de revisão | blog-writer · image-maker | `audit` → `in_review` |
| `bare` | stable | só o núcleo. quadro vazio | você decide | você monta |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | mini app WebView da Toss | spec-writer · ui-builder · release-manager | `preflight` → revisão no console |

```bash
pnpm template list                    # listagem · qual está aplicado
pnpm template apply <id>              # aplicar
pnpm template apply <id> --force      # sobrescrever por cima de outro template
pnpm template prune                   # limpar o catálogo sem uso e a landing
```

`planned` quer dizer que o manifesto declara a intenção mas ainda não há conteúdo. `apply` recusa,
porque deixar uma casca vazia só faz você procurar depois por que nada funciona.

### Um projeto é uma empresa

Um mesmo repositório tem duas caras. Depois da escolha, o restante do catálogo e a landing do
produto não são necessários naquele projeto, então `pnpm company-setup` propõe limpá-los.

| | Repo do produto (este) | Seu projeto criado com Use this template |
| --- | --- | --- |
| `site/` (landing) | presente → publicada na Vercel | removida na limpeza |
| Templates não escolhidos | todos presentes | removidos na limpeza |
| `files/` do template escolhido | presente | removido (já está na raiz) |
| `template.yaml` do template escolhido | presente | mantido |
| Núcleo | presente | presente |

Manter o manifesto é o ponto principal, porque `check-deps.sh` lê dele `verify-*` e
`load-context.sh` lê `rule:`. Se apagar, as verificações e as regras rígidas somem sem nenhum erro.

O repo do produto carrega o marcador `.company/PRODUCT`, então ali o prune se recusa a agir. Quem
clonar e rodar o setup não vai perder o catálogo.

Se precisar de outro template mais tarde, dá para buscá-lo no upstream.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Por que os templates não ficam em repos separados

As chaves do manifesto evoluem junto com os scripts do núcleo. Elas são lidas com `sed`, então uma
chave desconhecida é ignorada em silêncio, e um template remoto desatualizado faria verificações
inteiras sumirem sem erro algum. Manter tudo em um repo evita isso. Além disso, uma busca pela rede
no meio do setup quebraria a promessa de que rodar duas vezes leva ao mesmo estado.

Peso não é um bom argumento. Para o git, `templates/` tem 388K.

A hora de separar chega quando terceiros começarem a contribuir com templates, quando um template
ganhar recursos grandes ou quando os ciclos de release divergirem. O único ponto a mexer seria a
cópia de arquivos em `template.sh`.

---

## O que o núcleo entrega

### 1. A camada de contexto

No início da sessão, um hook injeta o seguinte.

```
regras rígidas do núcleo → empresa atual (template) + regras dela → índice do wiki
                         → memória de longo prazo → memória curta recente → quadro → estado do git
```

Ele carrega um índice, não o wiki inteiro. O modelo recebe um mapa e abre o que precisar
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

A memória em dois níveis guarda só o que dura.

```
curto prazo ──(referenciada 3+ vezes / continua verdadeira)──▶ longo prazo
longo prazo ──(vira regra do projeto)───────────────────────▶ documento do wiki ou ADR
```

`/save-memory` cuida da promoção.

### 2. O quadro de agentes

Os agentes aqui não são subagentes do Claude. Cada um é um processo independente no próprio
terminal, e os runtimes são diferentes. É isso que permite a uma ADE como o Orca executá-los de
fato em paralelo.

```bash
pnpm agent --list
pnpm agent <id> "<tarefa>"
pnpm agent <id> "<tarefa>" --dry-run   # imprime só o comando montado (para outro terminal)
```

O launcher lê runtime e modelo em `agents/registry.yaml`, monta `AGENT.md` e um índice de skills
(gerado varrendo a pasta) no prompt de sistema e inicia aquele CLI. Uma skill adicionada aparece
sem precisar registrar nada.

Um agente é adicionado por runtime e paralelismo, não por papel. Se um agente existente dá conta do
trabalho, acrescentar uma skill é o melhor caminho →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. O portão de publicação

O portão é uma função determinística. A tela de administração e a CLI chamam a mesma função, então
pessoas e agentes veem o mesmo veredito. Não há chamada de modelo lá dentro, porque um modelo que
avalia o próprio resultado tende a aprovar.

O que o portão checa é decisão do template. Em `blog-autopublish` é `pnpm audit:content`.

### 4. A política de imagens

Existe um único caminho para gerar imagens: Codex `imagegen`. A política pertence ao núcleo e o
comando vem do template, porque onde a imagem vai parar e em qual metadado a procedência é anotada
muda conforme o domínio. Em `blog-autopublish` fica assim.

```bash
pnpm imagegen --slug <slug> --prompt "<descrição da cena>"
```

Se o Codex não estiver disponível, o recuo segue esta ordem.

1. Seguir sem imagem (padrão)
2. Pedir que a pessoa anexe uma (`source: user-upload`)
3. Busca na web. A licença precisa ser verificada, e `source: web-search` e `license` são registrados

Uma regra que só existe num documento não é seguida, então ela é imposta em três camadas.

| Camada | Mecanismo |
| --- | --- |
| Tipos | `ImageSource` não tem o valor `claude` |
| Hook | `PreToolUse` bloqueia comandos de geração de imagem fora do Codex |
| Auditoria | Procedência não registrada ou imagem da web sem licença viram error → não dá para publicar |

Fundamentação: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Regras rígidas do núcleo

Valem independentemente do template. Mudar uma exige escrever antes um ADR em `wiki/decisions/`.

1. **Um caminho único para gerar imagens.** Nem outro modelo de imagem, nem SVG como substituto.
2. **O botão de publicar é apertado por uma pessoa.** Os agentes vão até `in_review` e param.
3. **A verdade está nos arquivos do repo.** Resultados e decisões são versionados no mesmo repositório do código.
4. **O portão é determinístico.** Nada de inferência de modelo dentro da revisão.
5. **O contexto se carrega sozinho.** Ninguém precisa lembrar de trazê-lo.

As regras de domínio ficam em `rule:` dentro de `templates/<id>/template.yaml` e são injetadas por
cima dessas cinco no início da sessão.

---

## Comandos

### Núcleo (sempre)

| Comando | Descrição |
| --- | --- |
| `pnpm company-setup` | Checar dependências → escolher template → preparar ambiente → verificar (+ opcional: seguir/dar star no GitHub) |
| `pnpm check` | Só inspeciona o estado (não instala), incluindo as verificações do template atual |
| `pnpm template list \| apply <id> \| prune` | Consultar · aplicar · limpar templates |
| `pnpm agent --list \| <id> "<tarefa>"` | Listar · executar agentes |
| `pnpm context` | Imprimir o contexto da sessão manualmente |
| `pnpm memory:new <topic>` | Criar um arquivo de memória (`--long` para longo prazo) |
| `pnpm dev \| build \| typecheck \| lint \| test` | Todo o workspace (turbo) |

### O que um template acrescenta

Aplicar `blog-autopublish` adiciona `dev:web` · `dev:admin` · `audit:content` · `cover` ·
`imagegen`. Quais chaves chegam está escrito nas linhas `script:` do manifesto.

---

## Comandos de barra

| Comando | O que faz |
| --- | --- |
| `/company-setup` | Checagem completa de dependências + instalação · escolha de template (seguir/star opcionais) |
| `/save-memory` | Salva a sessão na memória de curto prazo e promove para longo prazo/wiki quando faz sentido |
| `/create-agent` | Cria um agente em registry + AGENT.md + skills/ de uma vez |

As skills que os agentes leem (`agents/<id>/skills/`) são outra coisa. Aquelas são playbooks
neutros em relação ao runtime que o launcher injeta no prompt de sistema, então agentes codex
também as leem.

---

## Escrevendo um novo template

```
templates/<id>/
├── template.yaml    manifesto
└── files/           caminhos relativos à raiz do repo
```

O manifesto usa um formato de chaves repetidas. Nenhum parser de YAML é adicionado: `sed`/`awk`
fazem a leitura, porque a instalação precisa continuar determinística.

| Chave | Significado |
| --- | --- |
| `id` · `name` · `status` · `summary` | O que aparece na listagem. `status` é `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | Resumos de uma linha (usados na documentação e na landing) |
| `script: key=value` | Mesclado no `package.json` da raiz. Na troca só essas chaves são recolhidas |
| `verify-workspace:` | Confere até o vínculo das dependências (falha se não houver) |
| `verify-dir:` | Diretório existe + contagem de arquivos (falha se não houver) |
| `verify-optional:` | Arquivo/diretório desejável (aviso se faltar) |
| `verify-env: VAR=motivo` | Confere o valor no `.env`. Se faltar, informa o que fica desligado |
| `note-env: VAR=motivo` | Valores que normalmente ficam vazios. Só mostra o estado |
| `runtime:` | CLIs que este template usa (aviso se faltarem) |
| `mcp: nome=motivo` | Servidores MCP que este template usa. O registro é verificado |
| `mcp-claude:` · `mcp-codex:` | O comando de registro impresso quando falta algum |
| `rule:` | Regras rígidas desta empresa, injetadas por cima das do núcleo |
| `next:` | Orientações após o setup. `${VAR}` é substituído a partir do `.env` |

Quatro scripts leem o manifesto: `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh`. Se você adicionar uma chave, um deles
precisa aprender a lê-la, porque uma chave que ninguém lê é documentação, não configuração.

O registro de MCP é verificado lendo arquivos de configuração (`~/.claude.json` · `.mcp.json` ·
`~/.codex/config.toml`) em vez de rodar `claude mcp list`. Esse comando faz health check pela rede,
o que tiraria o determinismo do `pnpm check`.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · scripts bash determinísticos.
A stack da aplicação (Next.js · React · Tailwind · zod e afins) vem do template.

## Licença

MIT
