# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
**Deutsch** ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Ein Monorepo, das ein KI-Team betreibt.
> Ein Organigramm, eine Betriebsordnung, ein Gedächtnis, das die Sitzung überdauert, und ein Veröffentlichen-Knopf, den nur ein Mensch drückt.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Projektüberblick

Agenten-IDEs wie Orca und Paseo stellen eine Arbeitsumgebung bereit: parallele Worktrees, ein
Terminal pro Agent, eine Diff-Ansicht. Sobald man damit ein echtes Projekt betreibt, tauchen
allerdings immer wieder dieselben Probleme auf.

Die Historie dessen, was schon getan wurde, bleibt nicht erhalten. Die Sitzung endet oder ein
anderer Agent übernimmt, und frühere Entscheidungen sind weg. Man erklärt noch einmal, was längst
geklärt war, und manchmal landet die Arbeit wieder bei einem Ansatz, den man bereits verworfen
hatte.

Auch die Prüfung des Ergebnisses ist nicht einfach. Deshalb braucht es eine Stelle, an der ein
Mensch die Arbeit prüft und hinausgibt. Bei einem Blog ist das eine Admin-Seite, bei einer
Toss-Mini-App sind es der Preflight vor der Einreichung und die Konsole.

Keines der beiden Probleme löst sich durch besseres Prompting. Wir haben an jeder Stelle, an der
etwas zusammenbricht, ein System eingezogen.

| Was zusammenbricht | System | Wodurch erzwungen |
| --- | --- | --- |
| Kontextverlust | Handbuch · Wiki-Index · Kurz- und Langzeitgedächtnis werden zu jedem Sitzungsstart geladen | SessionStart-Hook |
| Qualitätsdrift | Das Veröffentlichungs-Gate ist eine deterministische Funktion. Menschen und Agenten sehen dasselbe Urteil | Kein LLM-Aufruf im Gate |
| Vermischte Rollen | Jeder Agent deklariert Runtime, Modell und Schreibbereich | `agents/registry.yaml` |
| Assets ohne Herkunft | Nur ein Weg zur Bilderzeugung, Herkunft wird bei jedem Asset festgehalten | Tool-Guard + Audit |
| Versehentliches Veröffentlichen | Agenten kommen bis `in_review` und halten an. Den Knopf drückt ein Mensch | Diesen Weg gibt es in den Typen nicht |

---

## Installation

### Einen Agenten machen lassen (empfohlen)

Fügen Sie das genau so in den Coding-Agenten ein, den Sie verwenden: Claude Code, Codex, Cursor,
Gemini CLI.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

Die Anleitung ist vom Klonen bis zur Prüfung in sich geschlossen. Ist der aktuelle Ordner leer,
wird direkt dorthin geklont, und jedes benötigte oder optionale Werkzeug ist samt Rückfalloption
beschrieben, sodass der Agent dort, wo er hängen bleibt, selbst entscheiden kann.

### Von Hand

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # Abhängigkeiten prüfen → Firma auswählen → Umgebung vorbereiten → verifizieren
pnpm dev
```

Das vollständige Vorgehen und die Fehlerbehebung stehen in [INSTALL.md](../../INSTALL.md).

> Es heißt `pnpm company-setup`, nicht `pnpm setup`. `setup` ist ein eingebautes pnpm-Kommando,
> ein gleichnamiges Skript würde davon verdeckt.

---

## Kern und Templates

Das Repository besteht aus zwei Schichten. Der Kern ist in jeder Firma gleich, und das Template
entscheidet, was gebaut wird.

```
agent-company/
│
├── ── Kern (immer vorhanden) ───────────────────────
│   ├── .claude/          Hooks (SessionStart · PreToolUse) · Slash-Kommandos
│   ├── wiki/             Projektwissen + Kurz-/Langzeitgedächtnis + ADRs
│   ├── agents/           Platz für die Belegschaft (registry.yaml + <id>/)
│   ├── scripts/          deterministische Shell-Skripte
│   ├── CLAUDE.md         Anweisungen für Claude Code
│   └── AGENTS.md         gemeinsame Anweisungen für alle KI-Coding-Agenten
│
├── ── Templates (eins wählen und ausrollen) ────────
│   └── templates/<id>/
│       ├── template.yaml   Manifest — Skripte · Prüfungen · harte Regeln · nächste Schritte
│       └── files/          Pfade relativ zum Repo-Root (apps/ · packages/ · agents/ …)
│
└── ── Produkt (nur dieses Repo) ────────────────────
    └── site/               Landingpage. eine statische HTML-Datei, kein Build → Vercel
```

`pnpm company-setup` lässt Sie ein Template wählen, kopiert `templates/<id>/files/` in den Root und
führt anschließend die `script:`-Einträge des Manifests im Root-`package.json` zusammen. Beim
Wechsel werden genau die Skript-Schlüssel wieder entfernt, die das vorherige Template hinzugefügt
hatte.

### Vorhandene Templates

| id | Status | Was entsteht | Belegschaft | Gate |
| --- | --- | --- | --- | --- |
| [`blog-autopublish`](../../templates/blog-autopublish/README.md) | stable | öffentliche Website + Prüfoberfläche | blog-writer · image-maker | `audit` → `in_review` |
| `bare` | stable | nur der Kern. leere Belegschaft | entscheiden Sie selbst | bauen Sie selbst |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | Toss-WebView-Mini-App | spec-writer · ui-builder · release-manager | `preflight` → Prüfung in der Konsole |

```bash
pnpm template list                    # Liste · aktuell angewendet
pnpm template apply <id>              # ausrollen
pnpm template apply <id> --force      # über ein anderes Template schreiben
pnpm template prune                   # ungenutzten Katalog und Landingpage aufräumen
```

`planned` heißt, dass das Manifest die Absicht festhält, aber noch kein Inhalt existiert. `apply`
lehnt das ab, denn eine leere Hülle auszurollen führt nur dazu, dass man später sucht, warum nichts
funktioniert.

### Ein Projekt ist eine Firma

Ein Repository hat zwei Gesichter. Nach der Wahl werden der übrige Katalog und die Produkt-Landing
in diesem Projekt nicht mehr gebraucht, deshalb bietet `pnpm company-setup` an, sie aufzuräumen.

| | Produkt-Repo (dieses) | Ihr über Use this template erstelltes Projekt |
| --- | --- | --- |
| `site/` (Landing) | vorhanden → auf Vercel deployt | wird aufgeräumt |
| Nicht gewählte Templates | alle vorhanden | werden aufgeräumt |
| `files/` des gewählten Templates | vorhanden | gelöscht (liegt bereits im Root) |
| `template.yaml` des gewählten Templates | vorhanden | bleibt |
| Kern | vorhanden | vorhanden |

Dass das Manifest bleibt, ist der entscheidende Punkt, denn `check-deps.sh` liest daraus `verify-*`
und `load-context.sh` liest `rule:`. Löscht man es, verschwinden Prüfungen und harte Regeln, ohne
dass ein Fehler erscheint.

Das Produkt-Repo trägt die Markierung `.company/PRODUCT`, deshalb verweigert prune dort den Dienst.
Wer es klont und das Setup ausführt, verliert den Katalog nicht.

Wird später ein anderes Template gebraucht, lässt es sich von upstream holen.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Warum die Templates nicht in eigenen Repos liegen

Die Schlüssel des Manifests entwickeln sich gemeinsam mit den Kern-Skripten. Gelesen werden sie mit
`sed`, ein unbekannter Schlüssel wird also stillschweigend ignoriert, und ein veraltetes
Remote-Template würde ganze Prüfungen ohne Fehlermeldung ausfallen lassen. In einem Repo tritt das
nicht auf. Außerdem würde ein Netzwerkzugriff mitten im Setup das Versprechen brechen, dass zwei
Durchläufe denselben Zustand ergeben.

Das Gewicht taugt kaum als Argument. Aus Sicht von git sind `templates/` 388K.

Der Zeitpunkt zum Aufteilen kommt, wenn Dritte anfangen, Templates beizusteuern, wenn ein Template
große Assets bekommt oder wenn die Release-Zyklen auseinanderlaufen. Anzupassen wäre dann eine
einzige Stelle: das Kopieren der Dateien in `template.sh`.

---

## Was der Kern bereitstellt

### 1. Die Kontextschicht

Zum Sitzungsstart spielt ein Hook Folgendes ein.

```
harte Kernregeln → aktuelle Firma (Template) + deren harte Regeln → Wiki-Index
                 → Langzeitgedächtnis → jüngstes Kurzzeitgedächtnis → Belegschaft → git-Status
```

Geladen wird ein Index, nicht das ganze Wiki. Das Modell bekommt eine Karte und öffnet selbst, was
es braucht ([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

Das zweistufige Gedächtnis behält nur, was Bestand hat.

```
kurzfristig ──(3+ mal referenziert / weiterhin zutreffend)──▶ langfristig
langfristig ──(wird zur Projektregel)──────────────────────▶ Wiki-Dokument oder ADR
```

Die Beförderung verwaltet `/save-memory`.

### 2. Die Belegschaft

Die Agenten hier sind keine Claude-Subagenten. Jeder ist ein eigenständiger Prozess in seinem
eigenen Terminal, und die Runtimes unterscheiden sich. Genau deshalb kann eine ADE wie Orca sie
tatsächlich parallel ausführen.

```bash
pnpm agent --list
pnpm agent <id> "<Aufgabe>"
pnpm agent <id> "<Aufgabe>" --dry-run   # gibt nur das zusammengesetzte Kommando aus (für ein anderes Terminal)
```

Der Launcher liest Runtime und Modell aus `agents/registry.yaml`, setzt `AGENT.md` und einen
Skill-Index (durch Scannen des Ordners erzeugt) zum System-Prompt zusammen und startet die
passende CLI. Ein neuer Skill erscheint, ohne dass etwas registriert werden muss.

Einen Agenten fügt man wegen Runtime und Parallelität hinzu, nicht wegen einer Rolle. Kann ein
vorhandener Agent die Arbeit erledigen, ist ein zusätzlicher Skill die bessere Wahl →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. Das Veröffentlichungs-Gate

Das Gate ist eine deterministische Funktion. Die Admin-Oberfläche und die CLI rufen dieselbe
Funktion auf, deshalb sehen Menschen und Agenten dasselbe Urteil. Im Inneren steckt kein
Modellaufruf, denn ein Modell, das sein eigenes Ergebnis bewertet, neigt zum Durchwinken.

Was das Gate prüft, legt das Template fest. Bei `blog-autopublish` ist es `pnpm audit:content`.

### 4. Die Bildrichtlinie

Für die Bilderzeugung gibt es genau einen Weg: Codex `imagegen`. Die Richtlinie gehört zum Kern, das
Kommando kommt vom Template, denn wo ein Bild landet und in welchem Metadatum seine Herkunft
vermerkt wird, unterscheidet sich je nach Domäne. Bei `blog-autopublish` sieht es so aus.

```bash
pnpm imagegen --slug <slug> --prompt "<Beschreibung der Szene>"
```

Steht Codex nicht zur Verfügung, greift diese Reihenfolge.

1. Ohne Bild fortfahren (Standard)
2. Die Nutzerin oder den Nutzer um einen Upload bitten (`source: user-upload`)
3. Websuche. Die Lizenz muss geprüft werden, und `source: web-search` sowie `license` werden festgehalten

Eine Regel, die nur in einem Dokument steht, wird nicht befolgt, deshalb wird sie auf drei Ebenen
erzwungen.

| Ebene | Mechanismus |
| --- | --- |
| Typen | `ImageSource` kennt keinen Wert `claude` |
| Hook | `PreToolUse` blockiert Bilderzeugungs-Kommandos außerhalb von Codex |
| Audit | Fehlende Herkunft oder ein Webbild ohne Lizenz gelten als error → keine Veröffentlichung |

Begründung: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Harte Kernregeln

Gelten unabhängig vom Template. Um eine zu ändern, muss zuerst ein ADR in `wiki/decisions/`
geschrieben werden.

1. **Ein Weg für die Bilderzeugung.** Kein anderes Bildmodell, kein SVG als Ersatz.
2. **Den Veröffentlichen-Knopf drückt ein Mensch.** Agenten kommen bis `in_review` und halten an.
3. **Die Wahrheit steht in den Dateien des Repos.** Ergebnisse und Entscheidungen werden im selben Repository versioniert wie der Code.
4. **Das Gate ist deterministisch.** Keine Modellinferenz innerhalb der Prüfung.
5. **Der Kontext lädt sich selbst.** Niemand muss daran denken, ihn mitzubringen.

Domänenregeln stehen unter `rule:` in `templates/<id>/template.yaml` und werden zum Sitzungsstart
über diese fünf gelegt.

---

## Kommandos

### Kern (immer)

| Kommando | Beschreibung |
| --- | --- |
| `pnpm company-setup` | Abhängigkeiten prüfen → Template wählen → Umgebung vorbereiten → verifizieren (+ optional: GitHub folgen/Stern) |
| `pnpm check` | Prüft nur den Zustand (installiert nichts), inklusive der Prüfungen des aktuellen Templates |
| `pnpm template list \| apply <id> \| prune` | Templates ansehen · anwenden · aufräumen |
| `pnpm agent --list \| <id> "<Aufgabe>"` | Agenten auflisten · ausführen |
| `pnpm context` | Sitzungskontext manuell ausgeben |
| `pnpm memory:new <topic>` | Neue Gedächtnisdatei anlegen (`--long` für langfristig) |
| `pnpm dev \| build \| typecheck \| lint \| test` | Gesamter Workspace (turbo) |

### Was ein Template hinzufügt

`blog-autopublish` ergänzt `dev:web` · `dev:admin` · `audit:content` · `cover` · `imagegen`.
Welche Schlüssel dazukommen, steht in den `script:`-Zeilen des Manifests.

---

## Slash-Kommandos

| Kommando | Zweck |
| --- | --- |
| `/company-setup` | Vollständige Abhängigkeitsprüfung + Installation · Template-Auswahl (Folgen/Stern optional) |
| `/save-memory` | Speichert die Sitzung im Kurzzeitgedächtnis und befördert sie bei Bedarf ins Langzeitgedächtnis/Wiki |
| `/create-agent` | Legt einen Agenten in registry + AGENT.md + skills/ in einem Zug an |

Die Skills, die Agenten lesen (`agents/<id>/skills/`), sind etwas anderes. Das sind
runtime-neutrale Playbooks, die der Launcher in den System-Prompt einspielt, weshalb auch
codex-Agenten sie lesen.

---

## Ein neues Template schreiben

```
templates/<id>/
├── template.yaml    Manifest
└── files/           Pfade relativ zum Repo-Root
```

Das Manifest nutzt ein Format mit wiederholten Schlüsseln. Es wird kein YAML-Parser eingebunden:
`sed`/`awk` lesen es, weil das Setup deterministisch bleiben muss.

| Schlüssel | Bedeutung |
| --- | --- |
| `id` · `name` · `status` · `summary` | Was in der Liste erscheint. `status` ist `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | Einzeilige Zusammenfassungen (für Doku und Landingpage) |
| `script: key=value` | Wird ins Root-`package.json` gemergt. Beim Wechsel werden nur diese Schlüssel entfernt |
| `verify-workspace:` | Prüft bis hin zur Verknüpfung der Abhängigkeiten (sonst Fehler) |
| `verify-dir:` | Verzeichnis vorhanden + Dateianzahl (sonst Fehler) |
| `verify-optional:` | Wünschenswerte Datei/Verzeichnis (Warnung, falls sie fehlt) |
| `verify-env: VAR=Grund` | Prüft den Wert in `.env`. Fehlt er, wird gemeldet, was dadurch abgeschaltet ist |
| `note-env: VAR=Grund` | Werte, die normalerweise leer sind. Zeigt nur den Zustand |
| `runtime:` | CLIs, die dieses Template nutzt (Warnung, falls sie fehlen) |
| `mcp: Name=Grund` | MCP-Server, die dieses Template nutzt. Die Registrierung wird geprüft |
| `mcp-claude:` · `mcp-codex:` | Das Registrierungskommando, das bei Fehlen ausgegeben wird |
| `rule:` | Harte Regeln dieser Firma, über die Kernregeln gelegt |
| `next:` | Hinweise nach dem Setup. `${VAR}` wird aus `.env` ersetzt |

Vier Skripte lesen das Manifest: `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh`. Wer einen Schlüssel ergänzt, muss einem
davon beibringen, ihn zu lesen, denn ein Schlüssel, den niemand liest, ist Dokumentation und keine
Konfiguration.

Die MCP-Registrierung wird geprüft, indem Konfigurationsdateien gelesen werden (`~/.claude.json` ·
`.mcp.json` · `~/.codex/config.toml`), statt `claude mcp list` auszuführen. Dieses Kommando macht
einen Health-Check über das Netz, was `pnpm check` seine Determiniertheit nehmen würde.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · deterministische bash-Skripte.
Den App-Stack (Next.js · React · Tailwind · zod und so weiter) bringt das Template mit.

## Lizenz

MIT
