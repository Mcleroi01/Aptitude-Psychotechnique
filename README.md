# Aptitude Psychotechnique

Plateforme **indépendante** d'évaluation et de préparation aux tests psychotechniques :

- **candidats** : entraînement corrigé sur la banque Aptitude, examens blancs, suivi des résultats ;
- **organisations** : banque de questions privée, évaluations en une ou plusieurs épreuves, campagnes de recrutement.

Le moteur est **générique** : aucun nombre de questions, aucune durée ni aucune matière n'est imposé par le code.
« 15 questions en 15 minutes » n'est qu'un modèle d'évaluation fourni en exemple (seed). La plateforme est
indépendante : elle n'est affiliée à aucun employeur ni organisme de recrutement.

> État : les 10 phases sont terminées (architecture, interface publique, comptes et organisations, banques et éditeur de
> questions, évaluations et campagnes, passage des épreuves, correction et rapports, import, invitations, tableau de bord et bibliothèque). Une évaluation utilisée par une campagne publiée est
> figée : on la duplique pour créer une variante.

## Passage des épreuves

- **Horloge du serveur seule** : échéances calculées au démarrage (durée globale, durée de l'épreuve au moment où le
  candidat la commence, clôture de la campagne). Le navigateur n'affiche qu'un compte à rebours recalé sur le serveur.
- **Enregistrement au fil de l'eau** (tolérance réseau de 3 s après zéro), reprise après coupure ou rechargement.
- **Soumission automatique** : à zéro par le navigateur ; sinon à la première consultation de la tentative ; en dernier
  recours par `/api/cron/expire-attempts` (Vercel Cron, quotidien, protégé par `CRON_SECRET`).
- Aucune clé de correction n'est envoyée au navigateur pendant une tentative, sauf la correction d'une question
  vérifiée en mode entraînement.

## Accès sans compte et connexion par e-mail

- **Entraînement et examens blancs sans compte** (`/entrainement`) : le visiteur est identifié par un jeton aléatoire
  en cookie httpOnly (`aptitude_invite`), dont seul le hachage est stocké. Ses séries sont rattachées à son compte dès
  qu'il se connecte ou s'inscrit ; celles jamais rattachées sont supprimées après 30 jours. Les campagnes de recrutement
  exigent un compte.
- **Lien de connexion par e-mail** : connecte un compte existant ou le crée au premier clic (15 minutes, usage unique,
  consommé au clic pour résister aux antivirus de messagerie). La réponse ne révèle pas si l'adresse a un compte.

## Import de questionnaires

- **CSV et Excel** (`.xlsx`) : lus dans le navigateur (`papaparse`, `read-excel-file`), seules les lignes sont
  envoyées ; 500 lignes et 2 Mo au maximum. Modèle téléchargeable : `/api/import/modele` (une ligne par question,
  en-têtes en français, voir `lib/imports/rows.ts`).
- Chaque ligne est convertie puis validée par **le même schéma que l'éditeur** ; les erreurs sont expliquées ligne par
  ligne. On corrige dans l'éditeur, on approuve ou on rejette, puis on importe (en brouillon par défaut).
- **PDF et images** : transcription assistée, document affiché à côté du formulaire. Aucune réponse n'est extraite
  automatiquement ; l'architecture (lots `ImportJob` / `ImportItem`) permet d'ajouter plus tard une extraction, qui
  resterait soumise à la même validation humaine.

## Invitations, tableau de bord, bibliothèque

- **Invitations** : liste collée (une personne par ligne), lien personnel par e-mail (jeton haché), renvoi et
  révocation. Le candidat doit se connecter avec l'adresse invitée. Envoi possible seulement si la campagne est publiée
  et si le propriétaire a confirmé son adresse ; 100 envois par jour et par organisation.
- **Tableau de bord candidat** : tentatives, score moyen et meilleur score, progression, réussite par catégorie et
  catégories à retravailler, invitations reçues. Les campagnes aux résultats masqués n'y figurent pas.
- **Bibliothèque** (`/bibliotheque`, gérée dans `/admin/bibliotheque`) : fichiers dans le bucket privé, téléchargement
  par URL signée de 5 minutes, statut de vérification affiché ; un document non vérifié porte un avertissement explicite.

## Animations

GSAP (`gsap`, `@gsap/react`) pour le héros, les apparitions au défilement (attributs `data-reveal`, `data-stagger`,
`data-parallax`, `data-count`, `data-cascade`), le bandeau défilant et les cadres lumineux. Désactivées si le système
demande de réduire les animations. Les fonds animés évitent `backdrop-filter` et les grands masques CSS, coûteux à
l'affichage.

## Correction et rapports

- **File de correction** anonyme (code de copie) pour les rôles `OWNER`, `ADMIN` et `GRADER` ; toute note, y compris
  l'ajustement d'une note automatique, recalcule aussitôt le score et la réussite de la tentative.
- **Résultats de campagne** : moyenne, médiane, taux de réussite, répartition, scores par épreuve et par catégorie,
  temps moyen, détail par candidat.
- **Exports** : CSV (séparateur « ; », compatible Excel, protection contre l'injection de formules) et rapports PDF
  générés côté serveur avec `pdf-lib` ; le candidat peut télécharger sa synthèse si l'organisation communique les
  résultats. Réponses non mises en cache (`no-store`).

## Modèle

| Concept | Rôle |
|---|---|
| `Organization`, `Membership` | Espace entreprise et rôles `OWNER`, `ADMIN`, `RECRUITER`, `GRADER` |
| `Question`, `QuestionOption` | Banque : `organizationId` nul = banque Aptitude, sinon banque privée |
| `Assessment` → `AssessmentSection` → `AssessmentQuestion` | Évaluation, épreuves (durée, barème, seuil, navigation), questions réutilisées sans duplication |
| `Campaign`, `Invitation` | Campagne de recrutement publiée et candidats invités |
| `AssessmentAttempt` → `AttemptSection` → `AttemptAnswer` | Tentative, échéances calculées par le serveur, réponses et notes |
| `ImportJob`, `ImportItem` | Import CSV/Excel/PDF/image, toujours validé par une personne |

Formats de questions : choix unique, choix multiples, vrai/faux, numérique, texte, texte à compléter ; tout format peut
porter une image ou un document joint.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Recharts |
| Formulaires | React Hook Form + Zod |
| Données | PostgreSQL (Supabase) + Prisma 7 (adaptateur `pg`) |
| Authentification | Auth.js v5 (e-mail + mot de passe, bcrypt, session JWT) |
| Fichiers | Supabase Storage (bucket privé + URL signées) |
| Tests | Vitest |
| Hébergement | Vercel (serverless) |

## Organisation du code

```
app/            Routes (App Router) : pages publiques, espace candidat, admin, API
components/ui/  Composants shadcn/ui
components/     Composants partagés (layout, éléments communs)
features/       Modules fonctionnels (practice, exam, results, library, admin, dashboard)
services/       Logique métier et accès aux données (exam, scoring, stats, stockage, limitation)
lib/            Infrastructure : prisma, auth, guards, erreurs, env, supabase
schemas/        Schémas Zod partagés client/serveur
types/          Types TypeScript partagés
prisma/         schema.prisma, migrations, seed
tests/          Tests Vitest
proxy.ts        Redirections optimistes selon la session (ex-middleware)
```

Principes de sécurité :

- **Autorisation côté serveur** (`lib/guards.ts`) : `requireUser()`, `requireSuperAdmin()`, `requireOrgMember(slug,
  permission)` pour les pages ; `assertUser()`, `assertSuperAdmin()`, `assertOrgPermission()` pour les actions. Les
  droits par rôle sont centralisés dans `lib/permissions.ts`. L'appartenance à une organisation est relue en base à
  chaque requête ; un non-membre reçoit une 404. Le proxy ne fait qu'une redirection de confort.
- **Vérification d'e-mail** : jeton aléatoire à usage unique, seul son hachage SHA-256 est stocké ; confirmation par
  un clic (les scanners de liens ne peuvent pas la déclencher) ; 3 envois par heure au maximum.
- **Comptes revérifiés** toutes les 5 minutes dans le JWT : un compte désactivé ou rétrogradé perd ses droits.
- **Limitation des connexions** : 5 échecs par e-mail et 20 par IP sur 15 minutes (table `LoginAttempt`, sans Redis).
- **Secrets** : `server-only` empêche d'importer la clé Supabase `service_role` ou Prisma dans du code client.
- **Erreurs** : `runAction()` (`lib/errors.ts`) renvoie un résultat uniforme et masque les détails internes.
- **En-têtes HTTP** (`next.config.ts`) : Content-Security-Policy (scripts limités à l'origine, Supabase seule origine
  tierce pour les fichiers), HSTS en production, `X-Frame-Options: DENY`, COOP, `no-store` sur les pages personnelles.
- **Données personnelles** : jetons (invitations, liens de connexion, invités) stockés hachés ; fichiers dans des buckets
  privés servis par URL signée temporaire ; exports non mis en cache.
- **Mot de passe oublié** : le lien de connexion par e-mail sert de récupération ; aucun mot de passe n'est jamais envoyé.

## Installation locale

Prérequis : Node.js ≥ 20.19 (testé avec Node 24) et un projet [Supabase](https://supabase.com) gratuit.

```bash
npm install                 # installe et génère le client Prisma
cp .env.example .env        # puis renseigner les valeurs
npm run db:deploy           # crée les tables (migrations existantes)
npm run db:seed             # catégories, 41 questions originales, évaluation d'exemple, super-administrateur
npm run storage:setup       # buckets Supabase Storage privés
npm run dev                 # http://localhost:3000
```

### Configurer Supabase

1. Créer un projet (région la plus proche, par exemple `eu-central-1` ou `eu-west-*`).
2. **Database → Connect** : copier la chaîne *Transaction pooler* (port 6543) dans `DATABASE_URL` en ajoutant
   `?pgbouncer=true`, et la chaîne *Session pooler* ou *Direct* (port 5432) dans `DIRECT_URL`.
3. **Project Settings → API** : copier l'URL dans `NEXT_PUBLIC_SUPABASE_URL` et la clé `service_role` dans
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Storage** : `npm run storage:setup` crée les buckets privés `question-images` (2 Mo, images) et `documents`
   (10 Mo, PDF et images). Les fichiers sont envoyés directement du navigateur vers Supabase par URL signée à usage
   unique, et lus uniquement par URL signée temporaire.

## Variables d'environnement

| Variable | Obligatoire | Usage |
|---|---|---|
| `DATABASE_URL` | oui | Connexion poolée (6543) utilisée par l'application |
| `DIRECT_URL` | oui | Connexion directe (5432) pour migrations et seed |
| `AUTH_SECRET` | oui | Signature des sessions (≥ 32 caractères, `npx auth secret`) |
| `AUTH_URL` | non | URL publique ; détectée automatiquement sur Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Clé serveur pour le stockage, jamais exposée au client |
| `RESEND_API_KEY` | oui en production | Envoi des e-mails ; sans clé en développement, les liens s'affichent dans la console du serveur |
| `EMAIL_FROM` | avec Resend | Expéditeur sur un domaine vérifié dans Resend, ex. `Aptitude <noreply@votre-domaine.com>` |
| `CRON_SECRET` | en production | Secret de la tâche planifiée de clôture des tentatives (Vercel l'envoie automatiquement) |
| `APP_URL` | non | URL publique utilisée dans les e-mails ; à défaut `AUTH_URL` ou l'URL Vercel |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed | Premier compte super-administrateur |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build de production |
| `npm run typecheck` / `npm run lint` / `npm test` | Vérifications (aussi exécutées par GitHub Actions, `.github/workflows/ci.yml`) |
| `npm run db:migrate` | Crée et applique une migration (développement) |
| `npm run db:deploy` | Applique les migrations existantes (production) |
| `npm run db:seed` | Données initiales (idempotent) |
| `npm run db:studio` | Explorateur de base Prisma |
| `npm run storage:setup` | Crée ou met à jour les buckets Supabase Storage (idempotent) |

## Mise en production (GitHub + Vercel + Supabase + Resend)

Le code est sur **GitHub**, l'application tourne sur **Vercel**, la base PostgreSQL et les fichiers sont chez
**Supabase**, les e-mails passent par **Resend**. Rien n'est stocké sur Vercel.

### 1. Supabase (base et fichiers)

1. Créer un projet **de production** (distinct de celui de développement), région proche des utilisateurs.
2. Relever les chaînes de connexion (*Transaction pooler* 6543 et *Session pooler* 5432), l'URL et la clé `service_role`.
3. Depuis votre poste, avec un `.env` pointant vers ce projet :

```bash
npm run db:deploy        # tables
npm run db:seed          # catégories, questions originales, examen d'exemple, super-administrateur
npm run storage:setup    # buckets privés
```

### 2. GitHub (code)

Créer un dépôt **privé**, puis depuis `app-web/` (racine du dépôt git) :

```bash
git remote add origin https://github.com/<compte>/<depot>.git
git push -u origin main
```

Le fichier `.env` est ignoré par git : aucun secret n'est publié. GitHub Actions vérifie chaque push.

### 3. Resend (e-mails)

Ajouter et vérifier votre nom de domaine (enregistrements DNS fournis par Resend), créer une clé API, choisir
l'expéditeur, par exemple `Aptitude Psychotechnique <noreply@votre-domaine.com>`.

### 4. Vercel (application)

1. **Add New → Project**, importer le dépôt GitHub (framework détecté : Next.js). `vercel.json` définit la commande de
   build (`prisma generate && prisma migrate deploy && next build`) et la tâche planifiée quotidienne.
2. **Settings → Environment Variables** (environnement *Production*) :
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (nouvelle valeur, `npx auth secret`), `AUTH_URL` et `APP_URL`
   (`https://votre-domaine`), `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `CRON_SECRET` (valeur aléatoire). Les variables `SEED_*` ne servent qu'en local.
3. Déployer, puis **Settings → Domains** pour rattacher votre nom de domaine.

### 5. Vérifications après déploiement

- `https://votre-domaine/api/health` répond `{"status":"ok","database":"ok"}`.
- Connexion du super-administrateur (`/connexion`), puis `/admin`.
- Lien de connexion par e-mail reçu ; inscription d'une organisation ; création d'une question, d'une évaluation,
  d'une campagne ; invitation envoyée à une adresse de test ; passage complet de l'épreuve.
- **Vercel → Settings → Cron Jobs** : la tâche `/api/cron/expire-attempts` apparaît.

## Offres gratuites et coûts

| Service | Limite gratuite (à vérifier sur les sites officiels) | Au-delà |
|---|---|---|
| Vercel Hobby | Usage non commercial, quotas mensuels d'exécution et de bande passante | Plan Pro, environ 20 $/mois par membre |
| Supabase Free | 500 Mo de base, 1 Go de stockage, mise en pause après 7 jours d'inactivité | Plan Pro, environ 25 $/mois |
| Resend Free | 3 000 e-mails/mois, 100/jour, un domaine | Plan payant, environ 20 $/mois |

**Important** : l'offre Vercel Hobby est réservée à un usage non commercial. Dès que la plateforme est vendue à des
entreprises (abonnements, prestations), le plan Vercel Pro est requis. Sur l'offre gratuite Supabase, un projet inactif
pendant 7 jours est mis en pause (réactivation en un clic) : l'activité réelle des utilisateurs suffit à l'éviter.

## Avertissements sur les contenus

- Les questions fournies sont **originales** et inspirées des types d'exercices observés ; elles ne prétendent pas
  provenir d'un test officiel.
- Chaque document de la bibliothèque porte un statut de vérification ; un document non vérifié n'est jamais présenté
  comme un communiqué officiel.
- Ne publiez pas de documents contenant des données personnelles (par exemple des listes nominatives de candidats).
