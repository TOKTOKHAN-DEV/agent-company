# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
**Français** ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> Un monorepo que fait tourner une équipe d'IA.
> Un organigramme, un règlement intérieur, une mémoire qui survit à la session et un bouton de publication que seul un humain peut presser.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## Présentation du projet

Les IDE pour agents comme Orca et Paseo fournissent un environnement de travail : worktrees
parallèles, un terminal par agent, une vue diff. Dès qu'on mène un vrai projet dessus, les mêmes
problèmes finissent pourtant par apparaître.

L'historique de ce qui a déjà été fait ne reste pas. La session se termine, ou un autre agent
reprend le travail, et les décisions passées disparaissent. On se retrouve à réexpliquer ce qui
était déjà tranché, et il arrive que le travail reparte sur une approche pourtant abandonnée.

La relecture du résultat n'est pas simple non plus. Il faut donc un endroit où une personne vérifie
le travail et le publie. Pour un blog, c'est une page d'administration ; pour une mini-app Toss, ce
sont la pré-vérification avant soumission et la console.

Ni l'un ni l'autre ne se règle en peaufinant les prompts. Nous avons ajouté un système à chaque
endroit où les choses cèdent.

| Ce qui cède | Système | Ce qui l'impose |
| --- | --- | --- |
| Perte de contexte | Le manuel, l'index du wiki et la mémoire court/long terme se chargent à chaque début de session | Hook SessionStart |
| Dérive de qualité | La barrière de publication est une fonction déterministe. Humains et agents voient le même verdict | Aucun appel de LLM dedans |
| Rôles qui se mélangent | Chaque agent déclare son runtime, son modèle et son périmètre d'écriture | `agents/registry.yaml` |
| Ressources sans provenance | Un seul chemin pour générer des images, provenance enregistrée sur chaque ressource | Garde-fou d'outil + audit |
| Publication accidentelle | Les agents vont jusqu'à `in_review` et s'arrêtent. Le bouton, c'est un humain | Ce chemin n'existe pas dans les types |

---

## Installation

### Laisser un agent s'en charger (recommandé)

Collez ceci tel quel dans l'agent de code que vous utilisez : Claude Code, Codex, Cursor, Gemini
CLI.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

Le guide se suffit à lui-même, du clone jusqu'à la vérification. Si le dossier courant est vide, il
clone sur place, et chaque outil requis ou optionnel est décrit avec sa solution de repli, de sorte
que l'agent peut décider seul là où il bloque.

### À la main

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # vérifier les dépendances → choisir quelle entreprise monter → préparer l'environnement → vérifier
pnpm dev
```

Pour la procédure complète et le dépannage, voir [INSTALL.md](../../INSTALL.md).

> C'est `pnpm company-setup`, pas `pnpm setup`. `setup` est une commande interne de pnpm, donc un
> script portant ce nom serait masqué.

---

## Cœur et modèles

Le dépôt se compose de deux couches. Le cœur est le même dans toutes les entreprises, et c'est le
modèle qui décide de ce qui est construit.

```
agent-company/
│
├── ── cœur (toujours présent) ──────────────────────
│   ├── .claude/          hooks (SessionStart · PreToolUse) · commandes slash
│   ├── wiki/             connaissances du projet + mémoire court/long terme + ADR
│   ├── agents/           l'emplacement de l'effectif (registry.yaml + <id>/)
│   ├── scripts/          scripts shell déterministes
│   ├── CLAUDE.md         consignes pour Claude Code
│   └── AGENTS.md         consignes communes à tous les agents de code IA
│
├── ── modèles (en choisir un et le déployer) ───────
│   └── templates/<id>/
│       ├── template.yaml   manifeste — scripts · vérifications · règles dures · étapes suivantes
│       └── files/          chemins relatifs à la racine du dépôt (apps/ · packages/ · agents/ …)
│
└── ── produit (ce dépôt uniquement) ────────────────
    └── site/               landing. un seul fichier HTML statique, sans build → Vercel
```

`pnpm company-setup` vous fait choisir un modèle, copie `templates/<id>/files/` à la racine, puis
fusionne les `script:` du manifeste dans le `package.json` racine. En changeant de modèle, seules
les clés de script ajoutées par le précédent sont retirées.

### Modèles disponibles

| id | statut | ce qui est produit | effectif | barrière |
| --- | --- | --- | --- | --- |
| [`blog-autopublish`](../../templates/blog-autopublish/README.md) | stable | site public + poste de relecture | blog-writer · image-maker | `audit` → `in_review` |
| `bare` | stable | le cœur seul. effectif vide | à vous de décider | à vous de le faire |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | mini-app WebView Toss | spec-writer · ui-builder · release-manager | `preflight` → relecture en console |

```bash
pnpm template list                    # liste · modèle appliqué
pnpm template apply <id>              # déployer
pnpm template apply <id> --force      # écraser par-dessus un autre modèle
pnpm template prune                   # nettoyer le catalogue inutilisé et la landing
```

`planned` signifie que le manifeste énonce l'intention mais qu'il n'y a pas encore de contenu.
`apply` refuse, car déposer une coquille vide revient à chercher plus tard pourquoi rien ne marche.

### Un projet, une entreprise

Un même dépôt a deux visages. Une fois le choix fait, le reste du catalogue et la landing du produit
ne servent plus à ce projet, donc `pnpm company-setup` propose de les nettoyer.

| | Dépôt produit (celui-ci) | Votre projet créé via Use this template |
| --- | --- | --- |
| `site/` (landing) | présent → déployé sur Vercel | supprimé au nettoyage |
| Modèles non retenus | tous présents | supprimés au nettoyage |
| `files/` du modèle retenu | présent | supprimé (déjà à la racine) |
| `template.yaml` du modèle retenu | présent | conservé |
| Cœur | présent | présent |

Conserver le manifeste est le point important, car `check-deps.sh` y lit `verify-*` et
`load-context.sh` y lit `rule:`. Si vous le supprimez, les vérifications et les règles dures
disparaissent sans la moindre erreur.

Le dépôt produit porte le marqueur `.company/PRODUCT`, donc prune y refuse d'agir. Un contributeur
qui clone et lance le setup ne perdra pas le catalogue.

Si vous avez besoin d'un autre modèle plus tard, vous pouvez le récupérer depuis upstream.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Pourquoi les modèles ne sont pas dans des dépôts séparés

Les clés du manifeste évoluent en même temps que les scripts du cœur. Elles sont lues avec `sed`,
donc une clé inconnue est ignorée en silence, et un modèle distant obsolète ferait disparaître des
vérifications entières sans aucune erreur. Tout garder dans un dépôt évite cela. Par ailleurs, une
requête réseau au milieu du setup casserait la promesse d'obtenir le même état en le relançant.

Le poids n'est pas un argument solide. Pour git, `templates/` pèse 388 Ko.

Le moment de séparer viendra quand des tiers commenceront à contribuer des modèles, quand un modèle
embarquera de gros fichiers, ou quand les rythmes de publication divergeront. Le seul endroit à
modifier serait la copie de fichiers dans `template.sh`.

---

## Ce que fournit le cœur

### 1. La couche de contexte

Au démarrage de la session, un hook injecte ceci.

```
règles dures du cœur → entreprise actuelle (modèle) + ses règles dures → index du wiki
                     → mémoire long terme → mémoire courte récente → effectif → état git
```

Il charge un index, pas le wiki entier. On donne une carte au modèle et il ouvre ce dont il a besoin
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

La mémoire à deux niveaux ne garde que ce qui dure.

```
court terme ──(référencée 3 fois ou plus / toujours vraie)──▶ long terme
long terme  ──(devient une règle du projet)────────────────▶ document wiki ou ADR
```

`/save-memory` gère la promotion.

### 2. L'effectif

Les agents dont il est question ici ne sont pas des sous-agents Claude. Chacun est un processus
indépendant dans son propre terminal, et leurs runtimes diffèrent. C'est ce qui permet à un ADE
comme Orca de les exécuter réellement en parallèle.

```bash
pnpm agent --list
pnpm agent <id> "<tâche>"
pnpm agent <id> "<tâche>" --dry-run   # n'affiche que la commande assemblée (pour un autre terminal)
```

Le lanceur lit le runtime et le modèle dans `agents/registry.yaml`, assemble `AGENT.md` et un index
des skills (généré en parcourant le dossier) dans le prompt système, puis démarre le CLI
correspondant. Une skill ajoutée apparaît sans aucun enregistrement.

On ajoute un agent pour une question de runtime et de parallélisme, pas de rôle. Si un agent
existant peut faire le travail, mieux vaut ajouter une skill →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. La barrière de publication

La barrière est une fonction déterministe. L'écran d'administration et la CLI appellent la même
fonction, donc humains et agents voient le même verdict. Aucun appel de modèle à l'intérieur, car un
modèle qui évalue sa propre production penche vers l'acceptation.

Ce que contrôle la barrière dépend du modèle. Pour `blog-autopublish`, c'est `pnpm audit:content`.

### 4. La politique d'images

Il n'y a qu'un seul chemin pour générer des images : Codex `imagegen`. La politique appartient au
cœur et la commande vient du modèle, car l'endroit où atterrit l'image et la métadonnée qui note sa
provenance changent selon le domaine. Pour `blog-autopublish`, cela donne ceci.

```bash
pnpm imagegen --slug <slug> --prompt "<description de la scène>"
```

Si Codex n'est pas disponible, on se replie dans cet ordre.

1. Continuer sans image (valeur par défaut)
2. Demander à l'utilisateur d'en joindre une (`source: user-upload`)
3. Recherche web. La licence doit être vérifiée, et `source: web-search` ainsi que `license` sont enregistrés

Une règle qui ne vit que dans un document n'est pas suivie, elle est donc imposée sur trois couches.

| Couche | Mécanisme |
| --- | --- |
| Types | `ImageSource` ne comporte pas de valeur `claude` |
| Hook | `PreToolUse` bloque les commandes de génération d'images hors Codex |
| Audit | Provenance non enregistrée ou image web sans licence traitées en error → publication impossible |

Justification : [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Règles dures du cœur

Vraies quel que soit le modèle. En changer une suppose d'écrire d'abord un ADR dans
`wiki/decisions/`.

1. **Un seul chemin pour générer des images.** Ni autre modèle d'image, ni SVG en remplacement.
2. **Le bouton de publication, c'est un humain.** Les agents vont jusqu'à `in_review` et s'arrêtent.
3. **La vérité est dans les fichiers du dépôt.** Résultats et décisions sont versionnés dans le même dépôt que le code.
4. **La barrière est déterministe.** Aucune inférence de modèle dans la relecture.
5. **Le contexte se charge tout seul.** Personne n'a à penser à l'apporter.

Les règles de domaine se placent dans `rule:` au sein de `templates/<id>/template.yaml` et sont
injectées par-dessus ces cinq-là au démarrage de la session.

---

## Commandes

### Cœur (toujours)

| Commande | Description |
| --- | --- |
| `pnpm company-setup` | Vérifier les dépendances → choisir un modèle → préparer l'environnement → vérifier (+ optionnel : suivre/étoiler sur GitHub) |
| `pnpm check` | Inspecte seulement l'état (n'installe rien), y compris les vérifications du modèle courant |
| `pnpm template list \| apply <id> \| prune` | Consulter · appliquer · nettoyer les modèles |
| `pnpm agent --list \| <id> "<tâche>"` | Lister · exécuter les agents |
| `pnpm context` | Afficher manuellement le contexte de session |
| `pnpm memory:new <topic>` | Créer un fichier de mémoire (`--long` pour le long terme) |
| `pnpm dev \| build \| typecheck \| lint \| test` | Tout le workspace (turbo) |

### Ce qu'ajoute un modèle

Appliquer `blog-autopublish` ajoute `dev:web` · `dev:admin` · `audit:content` · `cover` ·
`imagegen`. Les clés qui arrivent sont indiquées dans les lignes `script:` du manifeste.

---

## Commandes slash

| Commande | Rôle |
| --- | --- |
| `/company-setup` | Vérification complète des dépendances + installation · choix du modèle (suivre/étoiler facultatifs) |
| `/save-memory` | Enregistre la session en mémoire courte et la promeut en long terme/wiki si nécessaire |
| `/create-agent` | Crée un agent dans registry + AGENT.md + skills/ en une seule fois |

Les skills que lisent les agents (`agents/<id>/skills/`) sont autre chose. Ce sont des playbooks
neutres vis-à-vis du runtime que le lanceur injecte dans le prompt système, donc les agents codex
les lisent aussi.

---

## Créer un nouveau modèle

```
templates/<id>/
├── template.yaml    manifeste
└── files/           chemins relatifs à la racine du dépôt
```

Le manifeste utilise un format à clés répétées. Aucun parseur YAML n'est introduit : `sed`/`awk` le
lisent, parce que l'installation doit rester déterministe.

| Clé | Signification |
| --- | --- |
| `id` · `name` · `status` · `summary` | Ce qui apparaît dans la liste. `status` vaut `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | Résumés d'une ligne (utilisés dans la doc et la landing) |
| `script: key=value` | Fusionné dans le `package.json` racine. Seules ces clés sont retirées au changement |
| `verify-workspace:` | Vérifie jusqu'au lien des dépendances (échec sinon) |
| `verify-dir:` | Existence du répertoire + nombre de fichiers (échec sinon) |
| `verify-optional:` | Fichier/répertoire souhaitable (avertissement s'il manque) |
| `verify-env: VAR=raison` | Contrôle la valeur dans `.env`. Si absente, indique ce qui est désactivé |
| `note-env: VAR=raison` | Valeurs normalement vides. Affiche seulement l'état |
| `runtime:` | CLI utilisés par ce modèle (avertissement s'ils manquent) |
| `mcp: nom=raison` | Serveurs MCP utilisés par ce modèle. L'enregistrement est vérifié |
| `mcp-claude:` · `mcp-codex:` | La commande d'ajout à afficher lorsqu'il en manque un |
| `rule:` | Règles dures de cette entreprise, injectées par-dessus celles du cœur |
| `next:` | Indications après le setup. `${VAR}` est substitué depuis `.env` |

Quatre scripts lisent le manifeste : `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh`. Si vous ajoutez une clé, l'un d'eux doit
apprendre à la lire, car une clé que personne ne lit relève de la documentation, pas de la
configuration.

L'enregistrement MCP est vérifié en lisant des fichiers de configuration (`~/.claude.json` ·
`.mcp.json` · `~/.codex/config.toml`) plutôt qu'en lançant `claude mcp list`. Cette commande fait un
health check par le réseau, ce qui rendrait `pnpm check` non déterministe.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · scripts bash déterministes.
La stack applicative (Next.js · React · Tailwind · zod, etc.) est apportée par le modèle.

## Licence

MIT
