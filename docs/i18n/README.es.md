# Orca AI Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
**Español** ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Plantilla monorepo para llevar proyectos de TI con un equipo de agentes de IA.
> El contexto sobrevive entre sesiones y la calidad la protege una compuerta de revisión.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Qué resuelve

Cuando le confías un proyecto a una IA, dos cosas se rompen una y otra vez.

**El contexto desaparece.** Al terminar una sesión o cambiar de responsable, la IA ya no sabe qué se
decidió. Repite discusiones cerradas y vuelve a enfoques que ya habías descartado.

**No hay control de calidad.** Sin una compuerta de revisión, lo que produce la IA llega directo a
producción.

Esta plantilla bloquea ambos problemas **por estructura**.

| Problema | Solución |
| --- | --- |
| Pérdida de contexto | `CLAUDE.md` + `AGENTS.md` + `wiki/` + memoria corta/larga, cargados por un hook SessionStart |
| Control de calidad | Función de auditoría determinista + pantalla de revisión + botón de publicar que solo pulsa una persona |
| Roles difusos | Agentes independientes separados por runtime + mapeo explícito de modelos + paralelismo multiterminal |
| Procedencia de imágenes | Una única vía con Codex `imagegen` + procedencia registrada + triple refuerzo |

---

## Instalación

### Opción 1 — Delegarlo a una IA (una línea, copiar y pegar)

Abre cualquiera de `claude`, `codex` o `gemini` y pega la línea de abajo.
La IA lee [INSTALL.md](../../INSTALL.md) y lo sigue al pie de la letra.

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, read its INSTALL.md, and set it up exactly as written. When done, run `pnpm check` and show me the result.
```

<details>
<summary>Versión en español</summary>

```text
Clona https://github.com/TOKTOKHAN-DEV/orca-ai-company, lee su INSTALL.md e instálalo exactamente como está escrito. Al terminar, ejecuta `pnpm check` y muéstrame el resultado.
```

</details>

INSTALL.md cubre las herramientas obligatorias y opcionales, los procedimientos de respaldo y la
resolución de problemas, así que la IA puede decidir por sí misma donde se atasque. El `pnpm check` final
informa de forma determinista si la instalación salió bien.

### Opción 2 — Instalarlo tú mismo

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # revisión completa de dependencias · preparación del entorno · seguir la organización · dar star
pnpm dev       # web → :3000 · admin → :3001
```

Consulta **[INSTALL.md](../../INSTALL.md)** para el procedimiento detallado y la resolución de problemas.

> INSTALL.md está escrito en coreano por ahora. Los agentes de IA lo leen sin problema.

---

## Estructura

```
orca-ai-company/
├── apps/
│   ├── web/              blog público (Next.js 16 App Router, :3000)
│   └── admin/            contenido · SEO/GEO · panel de revisión (:3001)
├── packages/
│   ├── content/          esquema · drivers de almacenamiento · auditoría · JSON-LD (única fuente de verdad)
│   └── supabase/         cliente · almacenamiento · migraciones (inactivo sin claves)
├── content/posts/        artículos en markdown — driver por defecto
├── docs/i18n/            traducciones del README, 8 idiomas
├── agents/
│   ├── registry.yaml     runtime · modelo · permisos (única fuente de verdad)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        visión general · arquitectura · convenciones · guías · historial
│   ├── decisions/        ADR
│   └── memory/           memoria a corto y largo plazo
├── .claude/
│   ├── settings.json     registro de hooks
│   ├── hooks/            carga de contexto SessionStart · guardia de política de imágenes
│   └── skills/           3 comandos slash
├── scripts/              scripts de shell deterministas
├── CLAUDE.md             instrucciones para Claude Code
└── AGENTS.md             instrucciones para cualquier agente de programación con IA
```

---

## Implementación de referencia: un blog operado por IA

### web (`:3000`)

El blog público. Solo renderiza artículos con `status: published` de `content/posts/`.
Genera automáticamente JSON-LD (BlogPosting · FAQPage), `sitemap.xml`, `robots.txt` y `rss.xml`.
Los rastreadores de motores de respuesta (GPTBot, ClaudeBot, PerplexityBot, …) están permitidos de forma
explícita.

### admin (`:3001`)

- **Editor** — texto enriquecido con tiptap y subida de imágenes. Siempre se guarda como markdown
- **Panel de SEO técnico** — canonical · directivas robots · OG/Twitter · priority del sitemap · hreflang
- **Panel GEO** — resumen extractivo · FAQ · entidades · citas · locale/mercados objetivo
- **Pantalla de revisión** — resultados de auditoría, vista previa de JSON-LD, checklist humano, botón de publicar
- **Panel SEO/GEO** — puntos pendientes de todos los artículos, agregados por carril

La interfaz usa un select basado en Radix en lugar del `<select>` nativo: el desplegable que dibuja el
sistema operativo ignora los estilos y difiere entre navegadores.

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   persona
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   revisión admin → publicar
                 ↓
         review-and-submit → status: in_review
```

Los agentes solo llegan hasta `in_review`. **Publicar es un acto humano.**

---

## Por qué SEO y GEO se tratan por separado

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| Objetivo | Motores de búsqueda | Motores de respuesta (ChatGPT · Claude · Perplexity · AI Overviews) |
| Meta | **Posicionamiento** | **Ser citado** |
| Señales clave | Título · meta · enlaces · velocidad | Estructura extraíble · preguntas y respuestas explícitas · fuentes · entidades |

Para que te citen, la página tiene que ser fácil de extraer. Por eso el frontmatter lleva un bloque GEO
aparte: `geo.faq` se renderiza como JSON-LD `FAQPage` y `geo.answerSummary` como un bloque de resumen en
la parte superior de la página.

Las reglas prácticas están en [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md).

---

## SEO técnico

### Generado automáticamente — nada que mantener

| Ruta | Contenido |
| --- | --- |
| `/sitemap.xml` | Artículos publicados con priority · changefreq · hreflang por artículo |
| `/robots.txt` | Bots de búsqueda y de motores de respuesta permitidos, `/api/` bloqueado |
| `/rss.xml` | Feed de artículos publicados |
| `/llms.txt` | **Resumen del sitio para LLMs** — los modelos lo entienden sin analizar HTML |

`llms.txt` es la contraparte GEO del sitemap. El sitemap dice *dónde* están las URL; llms.txt dice *qué es
este sitio y qué artículos existen*. Cada entrada reutiliza el `geo.answerSummary` del artículo, así que
rellenar ese resumen rinde el doble.

### Por artículo, desde el admin

canonical · noindex/nofollow · directivas robots (`max-snippet`, …) · tarjetas OG/Twitter ·
priority/changefreq del sitemap · hreflang · si se incluye el artículo en llms.txt.

### Search console y analítica

Pon un valor en `.env` para activar cada uno. **Si lo dejas vacío, la etiqueta o el script nunca se emite.**

| Variable | Destino |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver Search Advisor |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (cargado `afterInteractive`) |

### Slugs en lenguaje natural

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

Se conserva el texto no ASCII. Mantener la palabra clave en la URL es una señal real de posicionamiento y
de clics, y un slug transliterado resulta ilegible para el público al que apunta.

Detalles: [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## Backend — archivos ahora, Supabase después

El código de la aplicación nunca toca el almacenamiento directamente. Solo ve una interfaz.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← se elige automáticamente según existan claves
   ├── file       content/posts/*.md   (por defecto · el estado actual)
   └── supabase   Postgres + Storage   (en cuanto haya claves)
```

**No tener claves es el estado normal.** `pnpm install && pnpm dev` funciona sin más. Para cambiar:

1. Pon las tres claves de Supabase en `.env`
2. Aplica `packages/supabase/migrations/0001_init.sql`
3. `pnpm --filter @orca/supabase migrate` — traslada los artículos (idempotente; los archivos se conservan)

No cambia ni una línea del código de la aplicación. `CONTENT_DRIVER=file` revierte en cualquier momento.

Una política RLS limita la clave anon a artículos `published` que no sean `noindex`: la última línea de
defensa para que un fallo de la aplicación siga sin poder filtrar un borrador.

Detalles: [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## Cómo se preserva el contexto

Al iniciar una sesión, un hook inyecta automáticamente lo siguiente:

```
reglas duras → índice del wiki → memoria a largo plazo → memoria reciente → agentes → estado de git
```

Carga **el índice, no el wiki completo.** Le das un mapa al modelo y dejas que abra lo que necesite.

### Memoria en dos niveles

```
corto plazo ──(referenciada 3+ veces / confirmada vigente)──▶ largo plazo
largo plazo ──(se convierte en regla del proyecto)──────────▶ documento del wiki o ADR
```

La promoción la gestiona la skill `/save-memory`.

---

## Política de imágenes (regla dura)

**Las imágenes se generan únicamente con Codex `imagegen`. Que Claude genere imágenes está prohibido.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<descripción de la escena>"
```

Si Codex no está disponible, se recurre a este orden:

1. **Continuar sin imagen** — el valor por defecto. La portada no es obligatoria para publicar.
2. **El usuario adjunta una** — `source: user-upload`
3. **Búsqueda web** — verificación de licencia obligatoria. `source: web-search` más un `license` registrado

Una regla que solo vive en la documentación no se cumple, así que esta se **refuerza en tres capas**:

| Capa | Mecanismo |
| --- | --- |
| Tipos | `ImageSource` no tiene ningún valor `claude` |
| Hook | `PreToolUse` bloquea comandos de generación de imágenes ajenos a Codex |
| Auditoría | Procedencia ausente o imagen web sin licencia es un error → se bloquea la publicación |

Justificación: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Skills (comandos slash)

| Comando | Qué hace |
| --- | --- |
| `/orca-setup` | Revisión completa de dependencias · instalación · seguir la organización · dar star (script determinista) |
| `/save-memory` | Guarda lo aprendido en memoria corta y lo promueve a largo plazo/wiki cuando corresponde |
| `/create-agent` | Crea un agente nuevo en registry + AGENT.md + skills/ de forma consistente |

Las skills que lee un agente (`agents/<id>/skills/`) son otra cosa. Aquellas son playbooks neutrales
respecto al runtime que el lanzador inyecta en el prompt de sistema, así que el agente codex también las lee.

---

## Agentes

**No son subagentes de Claude.** Cada uno es un proceso independiente en su propia terminal, y los
runtimes difieren. Eso es lo que permite a Orca ejecutarlos realmente en paralelo entre terminales.

| ID | Runtime | Modelo | Rol |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | planificar → escribir → SEO/GEO → revisar |
| `image-maker` | `codex` | default | generar imágenes con imagegen · registrar procedencia |

```bash
pnpm agent --list
pnpm agent blog-writer "Escribe un artículo sobre la estrategia de caché de Turborepo"
pnpm agent image-maker "Imagen de portada para turborepo-cache-strategy"
```

```
agents/blog-writer/
├── AGENT.md                       se inyecta como prompt de sistema
└── skills/
    ├── plan-post/SKILL.md         planificación · comprobación de duplicados · esquema
    ├── write-draft/SKILL.md       redacción del cuerpo
    ├── optimize-seo-geo/SKILL.md  metadatos
    └── review-and-submit/SKILL.md auditoría · in_review
```

El lanzador ensambla `AGENT.md` más un índice de skills (generado escaneando la carpeta) en el prompt de
sistema y arranca la CLI correcta con el modelo correcto. Añadir una skill surte efecto de inmediato, sin
registro aparte.

### Por qué solo dos

**La línea divisoria es el runtime y el paralelismo, no el rol.** Las cuatro etapas del pipeline de
contenido tocan el mismo archivo en secuencia, así que no se gana nada separándolas en procesos: se
separaron en skills. Las imágenes, en cambio, requieren un runtime distinto (solo Codex), y esa frontera
no es negociable, así que se convirtió en una frontera de proceso y la regla pasó a ser estructural.

Reglas multiterminal: [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md).

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm setup` | Revisión completa del entorno + instalación + seguir/dar star en GitHub |
| `pnpm check` | Solo revisa el estado del entorno (no instala nada) |
| `pnpm dev` | Ejecuta web y admin a la vez |
| `pnpm dev:web` / `pnpm dev:admin` | Ejecución individual |
| `pnpm build` | Compila ambas apps |
| `pnpm typecheck` | Comprobación de tipos |
| `pnpm audit:content` | Ejecuta la compuerta de publicación desde la CLI (misma función que la pantalla de revisión) |
| `pnpm context` | Imprime el contexto de sesión manualmente |
| `pnpm imagegen` | Genera una imagen con Codex |
| `pnpm memory:new <topic>` | Crea un archivo de memoria (`--long` para largo plazo) |
| `pnpm --filter @orca/supabase migrate` | Traslada artículos de archivos a Supabase (admite `--dry-run`) |

---

## Adaptarlo a otro dominio

El blog es una referencia para hacer concreta la plantilla. Para convertirlo en comercio, un panel o un
sitio de documentación:

1. Sustituye el esquema de `packages/content/src/schema.ts`
2. Sustituye las reglas de auditoría de `packages/content/src/audit.ts`
3. Reconstruye los agentes de `agents/` con `/create-agent`
4. Sustituye `wiki/03` y `wiki/04` por tus guías de dominio

**Lo que se queda**: los hooks, la estructura de memoria, el patrón de compuerta de revisión, la política
de imágenes y el esqueleto del monorepo. Esa parte es el valor real de la plantilla.

---

## Stack

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## Licencia

MIT
