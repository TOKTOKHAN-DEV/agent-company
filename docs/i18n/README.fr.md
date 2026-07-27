# Orca AI Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
**Français** ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Modèle monorepo pour mener des projets informatiques avec une équipe d'agents IA.
> Le contexte survit d'une session à l'autre et la qualité est protégée par une barrière de relecture.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Ce que ça résout

Quand on confie un projet à une IA, deux choses cassent systématiquement.

**Le contexte disparaît.** Dès qu'une session se termine ou que la personne en charge change, l'IA ne sait
plus ce qui a été décidé. Elle rouvre des débats tranchés et revient à des approches déjà abandonnées.

**Il n'y a pas de contrôle qualité.** Sans étape de relecture, ce que produit l'IA part directement en
production.

Ce modèle bloque les deux **par la structure**.

| Problème | Solution |
| --- | --- |
| Perte de contexte | `CLAUDE.md` + `AGENTS.md` + `wiki/` + mémoire courte/longue, chargés par un hook SessionStart |
| Contrôle qualité | Fonction d'audit déterministe + écran de relecture + bouton de publication réservé à un humain |
| Rôles confus | Agents indépendants séparés par runtime + correspondance explicite des modèles + parallélisme multi-terminal |
| Provenance des images | Une seule voie via Codex `imagegen` + provenance enregistrée + triple contrainte |

---

## Installation

### Option 1 — Confier la tâche à une IA (une ligne à copier-coller)

Ouvrez `claude`, `codex` ou `gemini` et collez la ligne ci-dessous.
L'IA lit [INSTALL.md](../../INSTALL.md) et le suit à la lettre.

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, read its INSTALL.md, and set it up exactly as written. When done, run `pnpm check` and show me the result.
```

<details>
<summary>Version française</summary>

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, lis son INSTALL.md et installe le projet exactement comme indiqué. Une fois terminé, exécute `pnpm check` et montre-moi le résultat.
```

</details>

INSTALL.md couvre les outils obligatoires et optionnels, les procédures de repli et le dépannage : l'IA
peut donc décider elle-même partout où elle bloque. Le `pnpm check` final indique de façon déterministe si
l'installation a réussi.

### Option 2 — Installer soi-même

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # vérification complète des dépendances · préparation · suivre l'organisation · mettre une étoile
pnpm dev       # web → :3000 · admin → :3001
```

Voir **[INSTALL.md](../../INSTALL.md)** pour la procédure détaillée et le dépannage.

> INSTALL.md est pour l'instant rédigé en coréen. Les agents IA le lisent sans difficulté.

---

## Structure

```
orca-ai-company/
├── apps/
│   ├── web/              blog public (Next.js 16 App Router, :3000)
│   └── admin/            contenu · SEO/GEO · tableau de bord de relecture (:3001)
├── packages/
│   ├── content/          schéma · pilotes de stockage · audit · JSON-LD (source de vérité unique)
│   └── supabase/         client · stockage · migrations (inactif sans clés)
├── content/posts/        articles markdown — pilote par défaut
├── docs/i18n/            traductions du README, 8 langues
├── agents/
│   ├── registry.yaml     runtime · modèle · permissions (source de vérité unique)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        vue d'ensemble · architecture · conventions · guides · historique
│   ├── decisions/        ADR
│   └── memory/           mémoire à court et long terme
├── .claude/
│   ├── settings.json     enregistrement des hooks
│   ├── hooks/            chargement du contexte SessionStart · garde-fou de la politique d'images
│   └── skills/           3 commandes slash
├── scripts/              scripts shell déterministes
├── CLAUDE.md             instructions pour Claude Code
└── AGENTS.md             instructions pour tout agent de codage IA
```

---

## Implémentation de référence : un blog piloté par IA

### web (`:3000`)

Le blog public. Ne rend que les articles en `status: published` de `content/posts/`.
Génère automatiquement le JSON-LD (BlogPosting · FAQPage), `sitemap.xml`, `robots.txt` et `rss.xml`.
Les robots des moteurs de réponse (GPTBot, ClaudeBot, PerplexityBot, …) sont explicitement autorisés.

### admin (`:3001`)

- **Éditeur** — texte riche tiptap avec téléversement d'images. Toujours stocké en markdown
- **Panneau SEO technique** — canonical · directives robots · OG/Twitter · priority du sitemap · hreflang
- **Panneau GEO** — résumé extractible · FAQ · entités · citations · locale/marchés cibles
- **Écran de relecture** — résultats d'audit, aperçu JSON-LD, checklist humaine, bouton de publication
- **Tableau de bord SEO/GEO** — points en suspens de tous les articles, agrégés par voie

L'interface utilise un select basé sur Radix plutôt que le `<select>` natif : la liste dessinée par le
système d'exploitation ignore les styles et diffère d'un navigateur à l'autre.

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   humain
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   relecture admin → publication
                 ↓
         review-and-submit → status: in_review
```

Les agents ne vont que jusqu'à `in_review`. **Publier est un acte humain.**

---

## Pourquoi SEO et GEO sont traités séparément

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| Cible | Moteurs de recherche | Moteurs de réponse (ChatGPT · Claude · Perplexity · AI Overviews) |
| Objectif | **Classement** | **Citation** |
| Signaux clés | Titre · meta · liens · vitesse | Structure extractible · questions-réponses explicites · sources · entités |

Pour être cité, il faut être facile à extraire. D'où un bloc GEO distinct dans le frontmatter :
`geo.faq` est rendu en JSON-LD `FAQPage` et `geo.answerSummary` en bloc de résumé en haut de page.

Les règles pratiques : [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md).

---

## SEO technique

### Généré automatiquement — rien à maintenir

| Chemin | Contenu |
| --- | --- |
| `/sitemap.xml` | Articles publiés, avec priority · changefreq · hreflang par article |
| `/robots.txt` | Robots de recherche et de moteurs de réponse autorisés, `/api/` bloqué |
| `/rss.xml` | Flux des articles publiés |
| `/llms.txt` | **Résumé du site pour les LLM** — les modèles le comprennent sans analyser le HTML |

`llms.txt` est le pendant GEO du sitemap. Le sitemap indique *où* sont les URL ; llms.txt indique *ce
qu'est ce site et quels articles existent*. Chaque entrée réutilise le `geo.answerSummary` de l'article :
remplir ce résumé rapporte donc deux fois.

### Par article, depuis l'admin

canonical · noindex/nofollow · directives robots (`max-snippet`, …) · cartes OG/Twitter ·
priority/changefreq du sitemap · hreflang · inclusion ou non dans llms.txt.

### Search console et analytics

Renseignez une valeur dans `.env` pour activer chaque intégration. **Laissée vide, la balise ou le script
n'est jamais émis.**

| Variable | Cible |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver Search Advisor |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (chargé en `afterInteractive`) |

### Slugs en langage naturel

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

Le non-ASCII est conservé. Garder le mot-clé cible dans l'URL est un vrai signal de classement et de taux
de clic, et un slug translittéré est illisible pour le public visé.

Détails : [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## Backend — des fichiers maintenant, Supabase plus tard

Le code applicatif ne touche jamais directement au stockage. Il ne voit qu'une interface.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← choisi automatiquement selon la présence de clés
   ├── file       content/posts/*.md   (par défaut · l'état actuel)
   └── supabase   Postgres + Storage   (dès que les clés sont là)
```

**L'absence de clés est l'état normal.** `pnpm install && pnpm dev` fonctionne tel quel. Pour basculer :

1. Mettez les trois clés Supabase dans `.env`
2. Appliquez `packages/supabase/migrations/0001_init.sql`
3. `pnpm --filter @orca/supabase migrate` — migre les articles (idempotent ; les fichiers sont conservés)

Pas une ligne de code applicatif ne change. `CONTENT_DRIVER=file` permet de revenir à tout moment.

Une politique RLS limite la clé anon aux articles `published` non `noindex` — la dernière ligne de défense
pour qu'un bug applicatif ne puisse toujours pas divulguer un brouillon.

Détails : [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## Comment le contexte est préservé

Au démarrage d'une session, un hook injecte automatiquement :

```
règles strictes → index du wiki → mémoire longue → mémoire courte récente → agents → état git
```

Il charge **l'index, pas le wiki entier.** On donne une carte au modèle et il ouvre ce dont il a besoin.

### Mémoire à deux niveaux

```
court terme ──(référencée 3+ fois / toujours vraie)──▶ long terme
long terme  ──(devient une règle du projet)──────────▶ document wiki ou ADR
```

La promotion est gérée par la skill `/save-memory`.

---

## Politique d'images (règle stricte)

**Les images sont générées uniquement par Codex `imagegen`. Il est interdit à Claude d'en générer.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<description de la scène>"
```

Si Codex est indisponible, on se replie dans cet ordre :

1. **Continuer sans image** — par défaut. Une couverture n'est pas obligatoire pour publier.
2. **L'utilisateur en fournit une** — `source: user-upload`
3. **Recherche web** — vérification de licence obligatoire. `source: web-search` et un `license` enregistré

Une règle qui ne vit que dans la documentation n'est pas respectée : celle-ci est donc **imposée sur trois
couches**.

| Couche | Mécanisme |
| --- | --- |
| Types | `ImageSource` ne contient aucune valeur `claude` |
| Hook | `PreToolUse` bloque les commandes de génération d'images hors Codex |
| Audit | Provenance manquante ou image web sans licence = erreur → publication bloquée |

Justification : [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Skills (commandes slash)

| Commande | Rôle |
| --- | --- |
| `/orca-setup` | Vérification complète des dépendances · installation · suivre l'organisation · étoile (script déterministe) |
| `/save-memory` | Enregistre les acquis en mémoire courte et les promeut vers le long terme/wiki si justifié |
| `/create-agent` | Crée un nouvel agent dans registry + AGENT.md + skills/ de manière cohérente |

Les skills que lit un agent (`agents/<id>/skills/`) sont autre chose : ce sont des playbooks neutres
vis-à-vis du runtime, injectés par le lanceur dans le prompt système — l'agent codex les lit aussi.

---

## Agents

**Ce ne sont pas des sous-agents Claude.** Chacun est un processus indépendant dans son propre terminal, et
les runtimes diffèrent. C'est ce qui permet à Orca de les exécuter réellement en parallèle.

| ID | Runtime | Modèle | Rôle |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | planifier → rédiger → SEO/GEO → relire |
| `image-maker` | `codex` | default | générer des images avec imagegen · enregistrer la provenance |

```bash
pnpm agent --list
pnpm agent blog-writer "Écris un article sur la stratégie de cache de Turborepo"
pnpm agent image-maker "Image de couverture pour turborepo-cache-strategy"
```

```
agents/blog-writer/
├── AGENT.md                       injecté comme prompt système
└── skills/
    ├── plan-post/SKILL.md         planification · vérification des doublons · plan
    ├── write-draft/SKILL.md       rédaction du corps
    ├── optimize-seo-geo/SKILL.md  métadonnées
    └── review-and-submit/SKILL.md audit · in_review
```

Le lanceur assemble `AGENT.md` et un index des skills (généré en scannant le dossier) dans le prompt
système, puis démarre la bonne CLI avec le bon modèle. Ajouter une skill prend effet immédiatement, sans
enregistrement séparé.

### Pourquoi seulement deux

**Le critère de séparation, c'est le runtime et le parallélisme, pas le rôle.** Les quatre étapes du
pipeline de contenu touchent le même fichier l'une après l'autre : les séparer en processus n'apporte rien,
elles ont donc été séparées en skills. Les images, elles, exigent un runtime différent (Codex uniquement),
et cette frontière n'est pas négociable — elle est devenue une frontière de processus, et la règle est
devenue structurelle.

Règles multi-terminal : [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md).

---

## Commandes

| Commande | Description |
| --- | --- |
| `pnpm setup` | Vérification complète de l'environnement + installation + suivi/étoile GitHub |
| `pnpm check` | Vérifie uniquement l'état de l'environnement (n'installe rien) |
| `pnpm dev` | Lance web et admin ensemble |
| `pnpm dev:web` / `pnpm dev:admin` | Lancement individuel |
| `pnpm build` | Compile les deux applications |
| `pnpm typecheck` | Vérification des types |
| `pnpm audit:content` | Exécute la barrière de publication en CLI (même fonction que l'écran de relecture) |
| `pnpm context` | Affiche manuellement le contexte de session |
| `pnpm imagegen` | Génère une image avec Codex |
| `pnpm memory:new <topic>` | Crée un fichier de mémoire (`--long` pour le long terme) |
| `pnpm --filter @orca/supabase migrate` | Migre les articles des fichiers vers Supabase (`--dry-run` pris en charge) |

---

## L'adapter à un autre domaine

Le blog est une référence destinée à rendre le modèle concret. Pour en faire du commerce, un tableau de
bord ou un site de documentation :

1. Remplacez le schéma dans `packages/content/src/schema.ts`
2. Remplacez les règles d'audit dans `packages/content/src/audit.ts`
3. Reconstruisez les agents de `agents/` via `/create-agent`
4. Remplacez `wiki/03` et `wiki/04` par vos guides métier

**Ce qui reste** : les hooks, la structure de mémoire, le motif de barrière de relecture, la politique
d'images et le squelette monorepo. C'est là qu'est la vraie valeur du modèle.

---

## Stack

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## Licence

MIT
