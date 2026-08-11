# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
**Español** ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Un monorepo que hace funcionar un equipo de IA.
> Un organigrama, un reglamento, memoria que sobrevive a la sesión y un botón de publicación que solo pulsa una persona.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Descripción del proyecto

Los IDE para agentes como Orca y Paseo ofrecen un entorno de trabajo: worktrees en paralelo, una
terminal por agente, una vista de diff. Sin embargo, en cuanto llevas un proyecto real, suelen
aparecer los mismos problemas.

El historial de lo que ya hiciste no se queda. La sesión termina o lo retoma otro agente, y las
decisiones anteriores desaparecen. Acabas explicando otra vez lo que ya habías acordado, y a veces
el trabajo vuelve a un enfoque que ya habías descartado.

Revisar el resultado tampoco es sencillo. Por eso hace falta un sitio donde una persona revise el
trabajo y lo publique. En un blog es una página de administración; en una mini app de Toss son la
comprobación previa al envío y la consola.

Ninguno de los dos problemas se resuelve puliendo prompts. Añadimos un sistema en cada punto donde
las cosas se rompen.

| Lo que se rompe | Sistema | Cómo se impone |
| --- | --- | --- |
| Pérdida de contexto | El manual, el índice del wiki y la memoria a corto/largo plazo se cargan al inicio de cada sesión | Hook SessionStart |
| Deriva de calidad | La compuerta de publicación es una función determinista. Personas y agentes ven el mismo veredicto | Ninguna llamada a un LLM dentro |
| Mezcla de roles | Cada agente declara runtime, modelo y ámbito de escritura | `agents/registry.yaml` |
| Recursos sin procedencia | Un único camino para generar imágenes, con la procedencia registrada en cada recurso | Guardia de herramientas + auditoría |
| Publicación accidental | Los agentes llegan hasta `in_review` y paran. El botón lo pulsa una persona | Ese camino no existe en los tipos |

---

## Instalación

### Deja que lo haga un agente (recomendado)

Pega esto tal cual en el agente de programación que uses: Claude Code, Codex, Cursor, Gemini CLI.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

La guía es autosuficiente desde el clon hasta la verificación. Si la carpeta actual está vacía,
clona ahí mismo, y están descritas todas las herramientas necesarias y opcionales junto con su plan
alternativo, así que el agente puede decidir por su cuenta donde se atasque.

### A mano

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # revisar dependencias → elegir qué empresa montar → preparar entorno → verificar
pnpm dev
```

Para el procedimiento completo y la resolución de problemas, consulta
[INSTALL.md](../../INSTALL.md).

> Es `pnpm company-setup`, no `pnpm setup`. `setup` es un comando integrado de pnpm, así que un
> script con ese nombre queda tapado.

---

## Núcleo y plantillas

El repositorio está formado por dos capas. El núcleo es igual en cualquier empresa, y la plantilla
decide qué se construye.

```
agent-company/
│
├── ── núcleo (siempre presente) ────────────────────
│   ├── .claude/          hooks (SessionStart · PreToolUse) · comandos de barra
│   ├── wiki/             conocimiento del proyecto + memoria a corto/largo plazo + ADR
│   ├── agents/           donde va la plantilla de personal (registry.yaml + <id>/)
│   ├── scripts/          scripts de shell deterministas
│   ├── CLAUDE.md         instrucciones para Claude Code
│   └── AGENTS.md         instrucciones comunes para todo agente de programación con IA
│
├── ── plantillas (elige una y despliégala) ─────────
│   └── templates/<id>/
│       ├── template.yaml   manifiesto — scripts · comprobaciones · reglas duras · siguientes pasos
│       └── files/          rutas relativas a la raíz del repo (apps/ · packages/ · agents/ …)
│
└── ── producto (solo en este repo) ─────────────────
    └── site/               landing. un único HTML estático, sin build → Vercel
```

`pnpm company-setup` te hace elegir una plantilla, copia `templates/<id>/files/` en la raíz y luego
fusiona los `script:` del manifiesto en el `package.json` raíz. Al cambiar de plantilla se retiran
exactamente las claves de script que había añadido la anterior.

### Plantillas disponibles

| id | estado | qué produce | plantilla de personal | compuerta |
| --- | --- | --- | --- | --- |
| [`blog-autopublish`](../../templates/blog-autopublish/README.md) | stable | sitio público + mesa de revisión | blog-writer · image-maker | `audit` → `in_review` |
| `bare` | stable | solo el núcleo. plantilla vacía | lo decides tú | lo haces tú |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | mini app WebView de Toss | spec-writer · ui-builder · release-manager | `preflight` → revisión en consola |

```bash
pnpm template list                    # listado · cuál está aplicada
pnpm template apply <id>              # desplegar
pnpm template apply <id> --force      # sobrescribir encima de otra plantilla
pnpm template prune                   # limpiar el catálogo sin usar y la landing
```

`planned` significa que el manifiesto declara la intención pero todavía no hay contenido. `apply`
lo rechaza, porque dejar una carcasa vacía solo hace que después busques por qué no funciona.

### Un proyecto es una empresa

Un mismo repositorio tiene dos caras. Una vez elegida la plantilla, el resto del catálogo y la
landing del producto ya no hacen falta en ese proyecto, así que `pnpm company-setup` propone
limpiarlos.

| | Repo de producto (este) | Tu proyecto creado con Use this template |
| --- | --- | --- |
| `site/` (landing) | presente → desplegada en Vercel | se borra en la limpieza |
| Plantillas no elegidas | todas | se borran en la limpieza |
| `files/` de la plantilla elegida | presente | se borra (ya está en la raíz) |
| `template.yaml` de la plantilla elegida | presente | se conserva |
| Núcleo | presente | presente |

Conservar el manifiesto es lo importante, porque `check-deps.sh` lee de él `verify-*` y
`load-context.sh` lee `rule:`. Si lo borras, las comprobaciones y las reglas duras desaparecen sin
dar ningún error.

El repo de producto lleva el marcador `.company/PRODUCT`, así que ahí prune se niega a actuar. Un
colaborador que clone y ejecute el setup no perderá el catálogo.

Si más adelante necesitas otra plantilla, puedes recuperarla desde upstream.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Por qué las plantillas no están en repos aparte

Las claves del manifiesto evolucionan junto con los scripts del núcleo. Se leen con `sed`, así que
una clave desconocida se ignora en silencio, y una plantilla remota desactualizada haría
desaparecer comprobaciones enteras sin ningún error. Tenerlo todo en un repo evita eso. Además, una
descarga por red en mitad del setup rompería la promesa de que ejecutarlo dos veces da el mismo
estado.

El peso no es un buen argumento. Para git, `templates/` ocupa 388K.

El momento de separarlos llega cuando terceros empiecen a aportar plantillas, cuando una plantilla
incorpore recursos grandes o cuando los ciclos de publicación diverjan. El único punto a tocar sería
la copia de archivos en `template.sh`.

---

## Qué aporta el núcleo

### 1. La capa de contexto

Al iniciar la sesión, un hook inyecta lo siguiente.

```
reglas duras del núcleo → empresa actual (plantilla) + sus reglas duras → índice del wiki
                        → memoria a largo plazo → memoria reciente → personal → estado de git
```

Carga un índice, no el wiki completo. Al modelo se le da un mapa y él abre lo que necesita
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

La memoria en dos niveles conserva solo lo que dura.

```
corto plazo ──(referida 3+ veces / sigue siendo cierta)──▶ largo plazo
largo plazo ──(se convierte en regla del proyecto)──────▶ documento del wiki o ADR
```

`/save-memory` gestiona el ascenso.

### 2. La plantilla de personal

Los agentes de aquí no son subagentes de Claude. Cada uno es un proceso independiente en su propia
terminal y sus runtimes son distintos. Eso es lo que permite que un ADE como Orca los ejecute
realmente en paralelo.

```bash
pnpm agent --list
pnpm agent <id> "<tarea>"
pnpm agent <id> "<tarea>" --dry-run   # imprime solo el comando montado (para otra terminal)
```

El lanzador lee runtime y modelo de `agents/registry.yaml`, monta `AGENT.md` y un índice de skills
(generado escaneando la carpeta) en el prompt de sistema y arranca ese CLI. Si añades una skill,
aparece sin necesidad de registrarla.

Se añade un agente por runtime y paralelismo, no por rol. Si un agente existente puede hacer el
trabajo, es mejor añadir una skill →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. La compuerta de publicación

La compuerta es una función determinista. La pantalla de administración y la CLI llaman a la misma
función, así que personas y agentes ven el mismo veredicto. Dentro no hay ninguna llamada a un
modelo, porque un modelo que evalúa su propio resultado tiende a aprobarlo.

Qué comprueba la compuerta lo decide la plantilla. En `blog-autopublish` es `pnpm audit:content`.

### 4. La política de imágenes

Solo hay un camino para generar imágenes: Codex `imagegen`. La política pertenece al núcleo y el
comando lo aporta la plantilla, porque dónde acaba la imagen y en qué metadato se anota su
procedencia cambia según el dominio. En `blog-autopublish` queda así.

```bash
pnpm imagegen --slug <slug> --prompt "<descripción de la escena>"
```

Si Codex no está disponible, se recurre a este orden.

1. Seguir sin imagen (opción por defecto)
2. Pedir al usuario que adjunte una (`source: user-upload`)
3. Búsqueda web. Hay que verificar la licencia y se registran `source: web-search` y `license`

Una regla que solo vive en un documento no se cumple, así que se impone en tres capas.

| Capa | Mecanismo |
| --- | --- |
| Tipos | `ImageSource` no tiene el valor `claude` |
| Hook | `PreToolUse` bloquea los comandos de generación de imágenes que no sean de Codex |
| Auditoría | Procedencia sin registrar o imagen web sin licencia se tratan como error → no se puede publicar |

Fundamento: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Reglas duras del núcleo

Se cumplen con independencia de la plantilla. Cambiar una exige escribir antes un ADR en
`wiki/decisions/`.

1. **Un único camino para generar imágenes.** Ni otro modelo de imagen, ni un SVG como sustituto.
2. **El botón de publicar lo pulsa una persona.** Los agentes llegan hasta `in_review` y paran.
3. **La verdad está en los archivos del repo.** Resultados y decisiones se versionan en el mismo repositorio que el código.
4. **La compuerta es determinista.** Nada de inferencia de modelos dentro de la revisión.
5. **El contexto se carga solo.** Nadie tiene que acordarse de traerlo.

Las reglas de dominio van en `rule:` dentro de `templates/<id>/template.yaml` y se inyectan encima
de estas cinco al iniciar la sesión.

---

## Comandos

### Núcleo (siempre)

| Comando | Descripción |
| --- | --- |
| `pnpm company-setup` | Revisar dependencias → elegir plantilla → preparar entorno → verificar (+ opcional: seguir/dar star en GitHub) |
| `pnpm check` | Solo inspecciona el estado (no instala), incluidas las comprobaciones de la plantilla actual |
| `pnpm template list \| apply <id> \| prune` | Consultar · aplicar · limpiar plantillas |
| `pnpm agent --list \| <id> "<tarea>"` | Listar · ejecutar agentes |
| `pnpm context` | Imprimir el contexto de sesión a mano |
| `pnpm memory:new <topic>` | Crear un archivo de memoria (`--long` para largo plazo) |
| `pnpm dev \| build \| typecheck \| lint \| test` | Todo el workspace (turbo) |

### Lo que añade una plantilla

Aplicar `blog-autopublish` añade `dev:web` · `dev:admin` · `audit:content` · `cover` ·
`imagegen`. Qué claves llegan está escrito en las líneas `script:` del manifiesto.

---

## Comandos de barra

| Comando | Qué hace |
| --- | --- |
| `/company-setup` | Revisión completa de dependencias + instalación · selección de plantilla (seguir/star opcionales) |
| `/save-memory` | Guarda la sesión en memoria a corto plazo y la asciende a largo plazo/wiki si procede |
| `/create-agent` | Crea un agente en registry + AGENT.md + skills/ de una sola vez |

Las skills que leen los agentes (`agents/<id>/skills/`) son otra cosa. Aquellas son playbooks
neutrales respecto al runtime que el lanzador inyecta en el prompt de sistema, así que también las
leen los agentes de codex.

---

## Crear una plantilla nueva

```
templates/<id>/
├── template.yaml    manifiesto
└── files/           rutas relativas a la raíz del repo
```

El manifiesto usa un formato de claves repetidas. No se añade ningún parser de YAML: lo leen
`sed`/`awk`, porque la instalación tiene que ser determinista.

| Clave | Significado |
| --- | --- |
| `id` · `name` · `status` · `summary` | Lo que se ve en el listado. `status` es `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | Resúmenes de una línea (se usan en la documentación y la landing) |
| `script: key=value` | Se fusiona en el `package.json` raíz. Al cambiar solo se retiran estas claves |
| `verify-workspace:` | Comprueba incluso el enlace de dependencias (falla si no está) |
| `verify-dir:` | Existencia del directorio + número de archivos (falla si no está) |
| `verify-optional:` | Archivo/directorio conveniente (avisa si falta) |
| `verify-env: VAR=motivo` | Comprueba el valor en `.env`. Si falta, informa de qué queda desactivado |
| `note-env: VAR=motivo` | Valores que es normal que estén vacíos. Solo muestra el estado |
| `runtime:` | CLIs que usa esta plantilla (avisa si faltan) |
| `mcp: nombre=motivo` | Servidores MCP que usa esta plantilla. Se comprueba si están registrados |
| `mcp-claude:` · `mcp-codex:` | El comando de registro que se imprime cuando falta uno |
| `rule:` | Reglas duras de esta empresa, inyectadas sobre las del núcleo |
| `next:` | Indicaciones tras el setup. `${VAR}` se sustituye desde `.env` |

Hay cuatro scripts que leen el manifiesto: `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh`. Si añades una clave, alguno de ellos tiene
que aprender a leerla, porque una clave que nadie lee es documentación y no configuración.

El registro de MCP se comprueba leyendo archivos de configuración (`~/.claude.json` · `.mcp.json` ·
`~/.codex/config.toml`) en lugar de ejecutar `claude mcp list`. Ese comando hace un health check
por red, lo que dejaría `pnpm check` sin determinismo.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · scripts de bash deterministas.
El stack de la aplicación (Next.js · React · Tailwind · zod, etc.) lo aporta la plantilla.

## Licencia

MIT
