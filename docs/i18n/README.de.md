# Orca AI Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
**Deutsch** ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Monorepo-Vorlage, um IT-Projekte mit einem Team aus KI-Agenten zu betreiben.
> Der Kontext überlebt Sitzungsgrenzen, die Qualität sichert ein Review-Gate.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Welches Problem das löst

Wenn man einer KI ein Projekt überlässt, brechen immer wieder zwei Dinge.

**Der Kontext verschwindet.** Sobald eine Sitzung endet oder die zuständige Person wechselt, weiß die KI
nicht mehr, was entschieden wurde. Sie führt geklärte Diskussionen erneut und fällt auf längst verworfene
Ansätze zurück.

**Es gibt keine Qualitätssicherung.** Ohne Review-Schritt geht alles, was die KI produziert, direkt in
Produktion.

Diese Vorlage blockiert beides **strukturell**.

| Problem | Lösung |
| --- | --- |
| Kontextverlust | `CLAUDE.md` + `AGENTS.md` + `wiki/` + Kurz-/Langzeitgedächtnis, automatisch per SessionStart-Hook geladen |
| Qualitätskontrolle | Deterministische Audit-Funktion + Review-Oberfläche + Publish-Button, den nur ein Mensch drücken kann |
| Vermischte Rollen | Nach Runtime getrennte, eigenständige Agenten + explizite Modellzuordnung + Parallelität über mehrere Terminals |
| Bildherkunft | Ein einziger Weg über Codex `imagegen` + dokumentierte Herkunft + dreifache Durchsetzung |

---

## Installation

### Installation für Menschen

Fügen Sie diesen Prompt in Ihren LLM-Agenten ein (Claude Code, Codex, Cursor, Gemini CLI, …):

```text
Install and configure orca-ai-company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/orca-ai-company/refs/heads/main/INSTALL.md
```

Oder lesen Sie die [Installationsanleitung](../../INSTALL.md) selbst. Aber im Ernst: Überlassen Sie es
dem Agenten — Menschen zerlegen Konfigurationsdateien mit Tippfehlern.

### Installation für LLM-Agenten

Holen Sie die Installationsanleitung und arbeiten Sie sie ab:

```bash
curl -s https://raw.githubusercontent.com/TOKTOKHAN-DEV/orca-ai-company/refs/heads/main/INSTALL.md
```

Die Anleitung ist **in sich geschlossen, vom Klonen bis zur Prüfung**. Ist das aktuelle Verzeichnis leer,
klont sie an Ort und Stelle statt ein Unterverzeichnis zu verschachteln, und sie dokumentiert alle
Pflicht- und optionalen Werkzeuge samt Fallback-Verfahren — der Agent kann also überall dort selbst
entscheiden, wo er hängen bleibt. Das abschließende `pnpm check` meldet deterministisch, ob die
Einrichtung geklappt hat.

### Selbst installieren

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # vollständige Abhängigkeitsprüfung · Umgebung vorbereiten · Organisation folgen · Repo mit Stern
pnpm dev       # web → :3000 · admin → :3001
```

Ausführliches Vorgehen und Fehlerbehebung siehe **[INSTALL.md](../../INSTALL.md)**.

> INSTALL.md ist derzeit auf Koreanisch verfasst. KI-Agenten lesen sie problemlos.

---

## Aufbau

```
orca-ai-company/
├── apps/
│   ├── web/              öffentlicher Blog (Next.js 16 App Router, :3000)
│   └── admin/            Inhalte · SEO/GEO · Review-Dashboard (:3001)
├── packages/
│   ├── content/          Schema · Storage-Treiber · Audit · JSON-LD (einzige Wahrheitsquelle)
│   └── supabase/         Client · Storage · Migrationen (ohne Schlüssel inaktiv)
├── content/posts/        Markdown-Beiträge — Standardtreiber
├── docs/i18n/            README-Übersetzungen, 8 Sprachen
├── agents/
│   ├── registry.yaml     Runtime · Modell · Rechte (einzige Wahrheitsquelle)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        Überblick · Architektur · Konventionen · Leitfäden · Historie
│   ├── decisions/        ADRs
│   └── memory/           Kurz- und Langzeitgedächtnis
├── .claude/
│   ├── settings.json     Hook-Registrierung
│   ├── hooks/            SessionStart-Kontextladen · Wächter für die Bildrichtlinie
│   └── skills/           3 Slash-Befehle
├── scripts/              deterministische Shell-Skripte
├── CLAUDE.md             Anweisungen für Claude Code
└── AGENTS.md             Anweisungen für jeden KI-Coding-Agenten
```

---

## Referenzimplementierung: ein von KI betriebener Blog

### web (`:3000`)

Der öffentliche Blog. Rendert aus `content/posts/` nur Beiträge mit `status: published`.
Erzeugt JSON-LD (BlogPosting · FAQPage), `sitemap.xml`, `robots.txt` und `rss.xml` automatisch.
Crawler von Antwortmaschinen (GPTBot, ClaudeBot, PerplexityBot, …) sind ausdrücklich erlaubt.

### admin (`:3001`)

- **Editor** — tiptap-Rich-Text mit Bild-Upload. Gespeichert wird immer Markdown
- **Technisches SEO-Panel** — Canonical · robots-Direktiven · OG/Twitter · Sitemap-priority · hreflang
- **GEO-Panel** — extrahierbare Zusammenfassung · FAQ · Entitäten · Quellen · Locale/Zielmärkte
- **Review-Ansicht** — Audit-Ergebnisse, JSON-LD-Vorschau, menschliche Checkliste, Publish-Button
- **SEO/GEO-Dashboard** — offene Punkte aller Beiträge, nach Lane aggregiert

Die Oberfläche nutzt ein Radix-basiertes Select statt des nativen `<select>` — das vom Betriebssystem
gezeichnete Aufklappmenü ignoriert Styling und sieht in jedem Browser anders aus.

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   Mensch
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   Admin-Review → Veröffentlichen
                 ↓
         review-and-submit → status: in_review
```

Agenten kommen nur bis `in_review`. **Veröffentlichen ist eine menschliche Handlung.**

---

## Warum SEO und GEO getrennt behandelt werden

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| Ziel | Suchmaschinen | Antwortmaschinen (ChatGPT · Claude · Perplexity · AI Overviews) |
| Zweck | **Ranking** | **Zitiert werden** |
| Kernsignale | Titel · Meta · Links · Tempo | Extrahierbare Struktur · explizite Fragen und Antworten · Quellen · Entitäten |

Um zitiert zu werden, muss eine Seite leicht zu entnehmen sein. Deshalb trägt das Frontmatter einen eigenen
GEO-Block: `geo.faq` wird als `FAQPage`-JSON-LD gerendert, `geo.answerSummary` als Zusammenfassungsblock
oben auf der Seite.

Die Arbeitsregeln stehen in [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md).

---

## Technisches SEO

### Automatisch erzeugt — nichts zu pflegen

| Pfad | Inhalt |
| --- | --- |
| `/sitemap.xml` | Veröffentlichte Beiträge mit priority · changefreq · hreflang je Beitrag |
| `/robots.txt` | Such- und Antwortmaschinen-Bots erlaubt, `/api/` gesperrt |
| `/rss.xml` | Feed der veröffentlichten Beiträge |
| `/llms.txt` | **Seitenzusammenfassung für LLMs** — Modelle verstehen die Seite ohne HTML-Parsing |

`llms.txt` ist das GEO-Gegenstück zur Sitemap. Die Sitemap sagt, *wo* die URLs liegen; llms.txt sagt, *was
diese Seite ist und welche Beiträge existieren*. Jeder Eintrag verwendet die `geo.answerSummary` des
Beitrags — die Zusammenfassung auszufüllen zahlt sich also doppelt aus.

### Pro Beitrag, im Admin

Canonical · noindex/nofollow · robots-Direktiven (`max-snippet`, …) · OG/Twitter-Cards ·
Sitemap-priority/changefreq · hreflang · Aufnahme in llms.txt.

### Search Console und Analytics

Ein Wert in `.env` schaltet die jeweilige Integration ein. **Bleibt er leer, wird das Tag bzw. Skript gar
nicht ausgegeben.**

| Variable | Ziel |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver Search Advisor |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (`afterInteractive` geladen) |

### Slugs in natürlicher Sprache

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

Nicht-ASCII bleibt erhalten. Das Zielkeyword in der URL zu behalten ist ein echtes Ranking- und
Klickratensignal, und ein transliterierter Slug ist für genau das Publikum unlesbar, das er ansprechen soll.

Details: [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## Backend — jetzt Dateien, später Supabase

Der Anwendungscode fasst den Speicher nie direkt an. Er sieht nur eine Schnittstelle.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← automatisch gewählt, je nachdem ob Schlüssel vorhanden sind
   ├── file       content/posts/*.md   (Standard · der aktuelle Zustand)
   └── supabase   Postgres + Storage   (sobald Schlüssel gesetzt sind)
```

**Keine Schlüssel zu haben ist der Normalzustand.** `pnpm install && pnpm dev` läuft einfach. Zum Umstellen:

1. Drei Supabase-Schlüssel in `.env` eintragen
2. `packages/supabase/migrations/0001_init.sql` anwenden
3. `pnpm --filter @orca/supabase migrate` — vorhandene Beiträge übernehmen (idempotent; Dateien bleiben)

Keine einzige Zeile Anwendungscode ändert sich. `CONTENT_DRIVER=file` setzt jederzeit zurück.

Eine RLS-Policy beschränkt den anon-Schlüssel auf `published`-Beiträge, die nicht `noindex` sind — die
letzte Verteidigungslinie, damit ein Fehler in der Anwendung trotzdem keinen Entwurf preisgibt.

Details: [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## Wie der Kontext erhalten bleibt

Beim Start einer Sitzung injiziert ein Hook automatisch:

```
harte Regeln → Wiki-Index → Langzeitgedächtnis → jüngstes Kurzzeitgedächtnis → Agenten → Git-Status
```

Geladen wird **der Index, nicht das ganze Wiki.** Man gibt dem Modell eine Karte und lässt es öffnen, was
es braucht.

### Zweistufiges Gedächtnis

```
Kurzzeit ──(3+ Mal referenziert / weiterhin zutreffend)──▶ Langzeit
Langzeit ──(wird zur Projektregel)───────────────────────▶ Wiki-Dokument oder ADR
```

Die Beförderung verwaltet die Skill `/save-memory`.

---

## Bildrichtlinie (harte Regel)

**Bilder werden ausschließlich mit Codex `imagegen` erzeugt. Claude darf keine Bilder generieren.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<Szenenbeschreibung>"
```

Ist Codex nicht verfügbar, gilt diese Reihenfolge:

1. **Ohne Bild fortfahren** — der Standard. Ein Titelbild ist keine Voraussetzung zum Veröffentlichen.
2. **Nutzer hängt selbst eines an** — `source: user-upload`
3. **Websuche** — Lizenzprüfung verpflichtend. `source: web-search` plus dokumentierte `license`

Eine Regel, die nur in der Dokumentation steht, hält nicht. Diese wird daher **in drei Schichten
durchgesetzt**:

| Schicht | Mechanismus |
| --- | --- |
| Typen | `ImageSource` kennt den Wert `claude` überhaupt nicht |
| Hook | `PreToolUse` blockiert Bildgenerierungsbefehle außerhalb von Codex |
| Audit | Fehlende Herkunft oder unlizenziertes Webbild ist ein Fehler → Veröffentlichung blockiert |

Begründung: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Skills (Slash-Befehle)

| Befehl | Wirkung |
| --- | --- |
| `/orca-setup` | Vollständige Abhängigkeitsprüfung · Installation · Organisation folgen · Stern vergeben (deterministisches Skript) |
| `/save-memory` | Sitzungserkenntnisse ins Kurzzeitgedächtnis schreiben und bei Bedarf ins Langzeitgedächtnis/Wiki befördern |
| `/create-agent` | Einen neuen Agenten konsistent in registry + AGENT.md + skills/ anlegen |

Die Skills, die ein Agent liest (`agents/<id>/skills/`), sind etwas anderes: runtime-neutrale Playbooks,
die der Launcher in den Systemprompt einfügt — der codex-Agent liest sie ebenfalls.

---

## Agenten

**Das sind keine Claude-Subagenten.** Jeder ist ein eigenständiger Prozess in einem eigenen Terminal, und
die Runtimes unterscheiden sich. Genau deshalb kann Orca sie über mehrere Terminals echt parallel ausführen.

| ID | Runtime | Modell | Rolle |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | planen → schreiben → SEO/GEO → prüfen |
| `image-maker` | `codex` | default | Bilder mit imagegen erzeugen · Herkunft dokumentieren |

```bash
pnpm agent --list
pnpm agent blog-writer "Schreib einen Beitrag über die Caching-Strategie von Turborepo"
pnpm agent image-maker "Titelbild für turborepo-cache-strategy"
```

```
agents/blog-writer/
├── AGENT.md                       wird als Systemprompt injiziert
└── skills/
    ├── plan-post/SKILL.md         Planung · Dublettenprüfung · Gliederung
    ├── write-draft/SKILL.md       Text schreiben
    ├── optimize-seo-geo/SKILL.md  Metadaten
    └── review-and-submit/SKILL.md Audit · in_review
```

Der Launcher baut `AGENT.md` plus einen Skill-Index (durch Scannen des Ordners erzeugt) zum Systemprompt
zusammen und startet die passende CLI mit dem passenden Modell. Eine neue Skill wirkt sofort, ganz ohne
separate Registrierung.

### Warum nur zwei

**Die Trennlinie ist Runtime und Parallelität, nicht die Rolle.** Alle vier Stufen der Content-Pipeline
fassen nacheinander dieselbe Datei an — sie in Prozesse aufzuteilen bringt nichts, also wurden sie in
Skills aufgeteilt. Bilder dagegen brauchen eine andere Runtime (nur Codex), und diese Grenze ist nicht
verhandelbar. Sie wurde deshalb zur Prozessgrenze, und die Regel wurde strukturell.

Regeln für mehrere Terminals: [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md).

---

## Befehle

| Befehl | Beschreibung |
| --- | --- |
| `pnpm setup` | Vollständige Umgebungsprüfung + Installation + GitHub folgen/Stern |
| `pnpm check` | Prüft nur den Zustand der Umgebung (installiert nichts) |
| `pnpm dev` | web und admin gemeinsam starten |
| `pnpm dev:web` / `pnpm dev:admin` | Einzeln starten |
| `pnpm build` | Beide Apps bauen |
| `pnpm typecheck` | Typprüfung |
| `pnpm audit:content` | Publish-Gate über die CLI ausführen (dieselbe Funktion wie die Review-Ansicht) |
| `pnpm context` | Sitzungskontext manuell ausgeben |
| `pnpm imagegen` | Bild mit Codex erzeugen |
| `pnpm memory:new <topic>` | Neue Gedächtnisdatei anlegen (`--long` für Langzeit) |
| `pnpm --filter @orca/supabase migrate` | Beiträge aus Dateien nach Supabase übernehmen (`--dry-run` möglich) |

---

## Auf eine andere Domäne übertragen

Der Blog ist eine Referenz, um die Vorlage greifbar zu machen. Für Commerce, ein Dashboard oder eine
Doku-Website:

1. Schema in `packages/content/src/schema.ts` ersetzen
2. Audit-Regeln in `packages/content/src/audit.ts` ersetzen
3. Agenten in `agents/` per `/create-agent` neu aufbauen
4. `wiki/03` und `wiki/04` durch eigene Fachleitfäden ersetzen

**Was bleibt**: die Hooks, die Gedächtnisstruktur, das Review-Gate-Muster, die Bildrichtlinie und das
Monorepo-Gerüst. Genau darin liegt der eigentliche Wert der Vorlage.

---

## Stack

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## Lizenz

MIT
